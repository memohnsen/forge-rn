//
//  Oura.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import AuthenticationServices
import UIKit
import Clerk

@Observable
class Oura {
    private let clientId: String
    private let supabaseURL: String
    private let keychain = OuraKeychain.shared
    
    private var authorizationURL: URL? {
        var components = URLComponents(string: "https://cloud.ouraring.com/oauth/authorize")
        let redirectURI = "forge://oauth/callback"
        // Full scope list matching Oura's example: email+personal+daily+heartrate+tag+workout+session+spo2+ring_configuration+stress+heart_health
        let scope = "email personal daily heartrate tag workout session spo2 ring_configuration stress heart_health"
        components?.queryItems = [
            URLQueryItem(name: "client_id", value: clientId),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: scope)
        ]
        return components?.url
    }
    
    private var tokenExchangeURL: String {
        return "\(supabaseURL)/functions/v1/oura-token-exchange"
    }
    
    var isLoading: Bool = false
    var isAuthenticated: Bool = false
    
    init() {
        self.clientId = Bundle.main.object(forInfoDictionaryKey: "OURA_CLIENT_ID") as? String ?? ""
        self.supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
    }
    
    // MARK: - Authentication
    
    func authenticate() async throws {
        guard let url = authorizationURL else {
            throw OuraError.invalidURL
        }
        
        guard let session = Clerk.shared.session else {
            throw OuraError.authError
        }
        
        guard let clerkToken = try await session.getToken() else {
            throw OuraError.authError
        }
        
        isLoading = true
        defer { isLoading = false }
        
        return try await withCheckedThrowingContinuation { continuation in
            let authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "forge"
            ) { [weak self] callbackURL, error in
                Task { @MainActor in
                    if let error = error {
                        if let authError = error as? ASWebAuthenticationSessionError,
                           authError.code == .canceledLogin {
                            continuation.resume(throwing: OuraError.authError)
                            return
                        }
                        continuation.resume(throwing: OuraError.authError)
                        return
                    }
                    
                    guard let callbackURL = callbackURL else {
                        continuation.resume(throwing: OuraError.authError)
                        return
                    }
                    
                    guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
                          let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
                        continuation.resume(throwing: OuraError.authError)
                        return
                    }
                    
                    do {
                        try await self?.exchangeCodeForToken(code: code, clerkToken: clerkToken.jwt)
                        continuation.resume()
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
            
            authSession.presentationContextProvider = OuraPresentationContextProvider.shared
            authSession.start()
        }
    }
    
    private func exchangeCodeForToken(code: String, clerkToken: String) async throws {
        guard let url = URL(string: tokenExchangeURL) else {
            throw OuraError.invalidURL
        }
        
        guard let userId = Clerk.shared.user?.id else {
            throw OuraError.authError
        }
        
        let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_KEY") as? String ?? ""
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clerkToken)", forHTTPHeaderField: "Authorization")
        request.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        
        let requestBody: [String: Any] = [
            "code": code
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OuraError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw OuraError.tokenExchangeError(errorMessage)
        }
        
        let tokenResponse = try JSONDecoder().decode(OuraTokenResponse.self, from: data)
        
        try keychain.saveAccessToken(tokenResponse.accessToken, userId: userId)
        if let refreshToken = tokenResponse.refreshToken {
            try keychain.saveRefreshToken(refreshToken, userId: userId)
        }
        
        isAuthenticated = true
    }
    
    // MARK: - Token Management
    
    func getAccessToken(userId: String) -> String? {
        return keychain.getAccessToken(userId: userId)
    }
    
    func refreshToken(userId: String) async throws {
        guard let refreshToken = keychain.getRefreshToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        guard let session = Clerk.shared.session,
              let clerkToken = try await session.getToken() else {
            throw OuraError.authError
        }
        
        guard let url = URL(string: "\(tokenExchangeURL)/refresh") else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clerkToken)", forHTTPHeaderField: "Authorization")
        
        let requestBody: [String: Any] = [
            "refresh_token": refreshToken
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw OuraError.tokenExchangeError("Token refresh failed")
        }
        
        let tokenResponse = try JSONDecoder().decode(OuraTokenResponse.self, from: data)
        
        try keychain.saveAccessToken(tokenResponse.accessToken, userId: userId)
        if let refreshToken = tokenResponse.refreshToken {
            try keychain.saveRefreshToken(refreshToken, userId: userId)
            
            let tokenManager = OuraTokenManager()
            await tokenManager.syncRefreshTokenIfStoring(userId: userId)
        }
    }
    
    func revokeToken(userId: String) async throws {
        guard let accessToken = getAccessToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        guard let url = URL(string: "https://api.ouraring.com/oauth/revoke") else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let body = "token=\(accessToken)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        request.httpBody = body.data(using: .utf8)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw OuraError.apiError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Revocation failed")
        }
        
        try keychain.deleteAllTokens(userId: userId)
        isAuthenticated = false
    }
    
    // MARK: - API Methods
    
    func fetchUserInfo(userId: String) async throws -> OuraUserInfo {
        guard let accessToken = getAccessToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        guard let url = URL(string: "https://api.ouraring.com/v1/userinfo") else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OuraError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw OuraError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        return try JSONDecoder().decode(OuraUserInfo.self, from: data)
    }
    
    // MARK: - Sleep Data
    
    func fetchDailySleep(userId: String, startDate: Date? = nil, endDate: Date? = nil) async throws -> [OuraSleep] {
        guard let accessToken = getAccessToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        var components = URLComponents(string: "https://api.ouraring.com/v2/usercollection/sleep")
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        
        if let startDate = startDate {
            components?.queryItems = [
                URLQueryItem(name: "start_date", value: dateFormatter.string(from: startDate))
            ]
        }
        
        if let endDate = endDate {
            var queryItems = components?.queryItems ?? []
            queryItems.append(URLQueryItem(name: "end_date", value: dateFormatter.string(from: endDate)))
            components?.queryItems = queryItems
        }
        
        guard let url = components?.url else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OuraError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ Oura sleep API error (\(httpResponse.statusCode)): \(errorMessage)")
            throw OuraError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📊 Oura sleep API response: \(String(jsonString.prefix(500)))")
        }
        
        do {
            let responseData = try JSONDecoder().decode(OuraDataResponse<OuraSleep>.self, from: data)
            print("✅ Parsed \(responseData.data.count) sleep records")
            return responseData.data
        } catch {
            print("❌ Failed to decode sleep data: \(error)")
            throw error
        }
    }

    // MARK: - Webhook Management
    
    func createWebhookSubscription(
        callbackURL: String,
        verificationToken: String,
        eventType: String,
        dataType: String,
        userId: String
    ) async throws -> OuraWebhookSubscription {
        guard let session = Clerk.shared.session,
              let clerkToken = try await session.getToken() else {
            throw OuraError.authError
        }
        
        guard let url = URL(string: "\(supabaseURL)/functions/v1/oura-webhook-subscription") else {
            throw OuraError.invalidURL
        }
        
        let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_KEY") as? String ?? ""
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clerkToken.jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        
        let requestBody: [String: Any] = [
            "callback_url": callbackURL,
            "verification_token": verificationToken,
            "event_type": eventType,
            "data_type": dataType
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OuraError.invalidResponse
        }
        
        // 409 Conflict means subscription already exists - treat as success
        if httpResponse.statusCode == 409 {
            print("ℹ️ Webhook subscription already exists for \(eventType)/\(dataType)")
            return OuraWebhookSubscription(
                id: nil,
                callbackUrl: nil,
                url: nil,
                verificationToken: nil,
                eventType: eventType,
                dataType: dataType,
                enabled: true,
                createdAt: nil,
                updatedAt: nil
            )
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ Webhook subscription failed: HTTP \(httpResponse.statusCode)")
            print("❌ Error response: \(errorMessage)")
            throw OuraError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }

        if let subscription = try? JSONDecoder().decode(OuraWebhookSubscription.self, from: data) {
            return subscription
        } else {
            let rawResponse = String(data: data, encoding: .utf8) ?? "Unable to decode"
            print("⚠️ Webhook subscription created but response format unexpected: \(rawResponse)")
            return OuraWebhookSubscription(
                id: nil,
                callbackUrl: nil,
                url: nil,
                verificationToken: nil,
                eventType: eventType,
                dataType: dataType,
                enabled: true,
                createdAt: nil,
                updatedAt: nil
            )
        }
    }
    
    func listWebhookSubscriptions(userId: String) async throws -> [OuraWebhookSubscription] {
        guard let accessToken = getAccessToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        guard let url = URL(string: "https://api.ouraring.com/v2/usercollection/webhook") else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw OuraError.invalidResponse
        }
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw OuraError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        return try JSONDecoder().decode([OuraWebhookSubscription].self, from: data)
    }
    
    func deleteWebhookSubscription(subscriptionId: String, userId: String) async throws {
        guard let accessToken = getAccessToken(userId: userId) else {
            throw OuraError.noAccessToken
        }
        
        guard let url = URL(string: "https://api.ouraring.com/v2/usercollection/webhook/\(subscriptionId)") else {
            throw OuraError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 || httpResponse.statusCode == 204 else {
            throw OuraError.apiError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0, message: "Deletion failed")
        }
    }
    
    // MARK: - Connection Status
    
    func checkConnectionStatus(userId: String) {
        isAuthenticated = getAccessToken(userId: userId) != nil
    }
}

// MARK: - Presentation Context Provider

class OuraPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = OuraPresentationContextProvider()
    
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}
