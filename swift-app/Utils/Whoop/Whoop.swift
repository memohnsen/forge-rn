//
//  Whoop.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import AuthenticationServices
import UIKit
import Clerk

@Observable
class Whoop {
    private let clientId: String
    private let supabaseURL: String
    private let keychain = WhoopKeychain.shared
    private var currentAuthState: String? 
    
    private var authorizationURL: URL? {
        // WHOOP OAuth authorization URL - verify in WHOOP API docs
        // According to WHOOP OAuth 2.0 docs: https://api.prod.whoop.com/oauth/oauth2/auth
        var components = URLComponents(string: "https://api.prod.whoop.com/oauth/oauth2/auth")
        let redirectURI = "forge://oauth/callback"
        // WHOOP scopes - verify required scopes in WHOOP API docs
        // Available scopes: read:recovery, read:cycles, read:workout, read:sleep, read:profile, read:body_measurement
        // offline scope is required to receive refresh tokens
        let scope = "read:recovery read:sleep read:cycles offline"
        // Client ID should already be trimmed in init, but trim again to be safe
        // Also split by newlines and take first line in case it wasn't cleaned properly
        let lines = clientId.components(separatedBy: .newlines)
        let firstLine = lines.first { !$0.trimmingCharacters(in: .whitespaces).isEmpty } ?? clientId
        let trimmedClientId = firstLine.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Generate state parameter (required by WHOOP, must be at least 8 characters)
        // Store it to verify in callback (CSRF protection)
        let state = UUID().uuidString
        currentAuthState = state
        
        components?.queryItems = [
            URLQueryItem(name: "client_id", value: trimmedClientId),
            URLQueryItem(name: "redirect_uri", value: redirectURI),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: scope),
            URLQueryItem(name: "state", value: state)
        ]
        print("🔗 [Whoop] Building authorization URL")
        print("🔗 [Whoop] Client ID: \(clientId.isEmpty ? "MISSING" : "\(clientId.prefix(8))...")")
        print("🔗 [Whoop] Redirect URI: \(redirectURI)")
        print("🔗 [Whoop] Scope: \(scope)")
        if let url = components?.url {
            print("✅ [Whoop] Authorization URL: \(url.absoluteString)")
        } else {
            print("❌ [Whoop] Failed to build authorization URL")
        }
        return components?.url
    }
    
    private var tokenExchangeURL: String {
        let url = "\(supabaseURL)/functions/v1/whoop-token-exchange"
        print("🔗 [Whoop] Token exchange URL: \(url)")
        return url
    }
    
    var isLoading: Bool = false
    var isAuthenticated: Bool = false
    
    init() {
        let rawClientId = Bundle.main.object(forInfoDictionaryKey: "WHOOP_CLIENT_ID") as? String ?? ""
        let lines = rawClientId.components(separatedBy: .newlines)
        let firstLine = lines.first { !$0.trimmingCharacters(in: .whitespaces).isEmpty } ?? ""
        self.clientId = firstLine.trimmingCharacters(in: .whitespacesAndNewlines)
        
        let rawSupabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        self.supabaseURL = rawSupabaseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        print("🚀 [Whoop] Initialized")
        print("🚀 [Whoop] Client ID loaded: \(clientId.isEmpty ? "❌ MISSING" : "✅ Present")")
        if !clientId.isEmpty {
            print("🚀 [Whoop] Client ID length: \(clientId.count) characters")
            print("🚀 [Whoop] Client ID (first 20 chars): \(String(clientId.prefix(20)))")
        }
        print("🚀 [Whoop] Supabase URL: \(supabaseURL.isEmpty ? "❌ MISSING" : supabaseURL)")
    }
    
    // MARK: - Authentication
    
    func authenticate() async throws {
        print("🔐 [Whoop] Starting authentication flow")
        
        guard let url = authorizationURL else {
            print("❌ [Whoop] Invalid authorization URL")
            throw WhoopError.invalidURL
        }
        
        guard let session = Clerk.shared.session else {
            print("❌ [Whoop] No Clerk session available")
            throw WhoopError.authError
        }
        
        guard let clerkToken = try await session.getToken() else {
            print("❌ [Whoop] Failed to get Clerk token")
            throw WhoopError.authError
        }
        
        print("✅ [Whoop] Clerk token obtained, starting web authentication session")
        isLoading = true
        defer { 
            isLoading = false
            print("🏁 [Whoop] Authentication flow completed, isLoading set to false")
        }
        
        return try await withCheckedThrowingContinuation { continuation in
            print("🌐 [Whoop] Creating ASWebAuthenticationSession")
            let authSession = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "forge"
            ) { [weak self] callbackURL, error in
                Task { @MainActor in
                    print("📞 [Whoop] OAuth callback received")
                    
                    if let error = error {
                        print("❌ [Whoop] OAuth callback error: \(error.localizedDescription)")
                        if let authError = error as? ASWebAuthenticationSessionError {
                            print("❌ [Whoop] Error code: \(authError.code.rawValue)")
                            if authError.code == .canceledLogin {
                                print("⚠️ [Whoop] User canceled login")
                                continuation.resume(throwing: WhoopError.authError)
                                return
                            }
                        }
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    
                    guard let callbackURL = callbackURL else {
                        print("❌ [Whoop] No callback URL received")
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    
                    print("✅ [Whoop] Callback URL: \(callbackURL.absoluteString)")
                    
                    guard let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false) else {
                        print("❌ [Whoop] Failed to parse callback URL components")
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    
                    print("🔍 [Whoop] Query items: \(components.queryItems?.map { "\($0.name)=\($0.value ?? "")" }.joined(separator: ", ") ?? "none")")
                    
                    // Check for OAuth errors first
                    if let error = components.queryItems?.first(where: { $0.name == "error" })?.value {
                        print("❌ [Whoop] OAuth error: \(error)")
                        if let errorDescription = components.queryItems?.first(where: { $0.name == "error_description" })?.value {
                            print("❌ [Whoop] Error description: \(errorDescription)")
                        }
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    
                    // Verify state parameter (CSRF protection)
                    let receivedState = components.queryItems?.first(where: { $0.name == "state" })?.value
                    if let expectedState = self?.currentAuthState {
                        if receivedState != expectedState {
                            print("❌ [Whoop] State mismatch - expected: \(expectedState), received: \(receivedState ?? "nil")")
                            continuation.resume(throwing: WhoopError.authError)
                            return
                        }
                        print("✅ [Whoop] State verified")
                    } else {
                        print("⚠️ [Whoop] No stored state to verify")
                    }
                    
                    guard let code = components.queryItems?.first(where: { $0.name == "code" })?.value else {
                        print("❌ [Whoop] No authorization code found in callback")
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    
                    print("✅ [Whoop] Authorization code received: \(code.prefix(10))...")
                    
                    do {
                        print("🔄 [Whoop] Exchanging code for token")
                        try await self?.exchangeCodeForToken(code: code, clerkToken: clerkToken.jwt)
                        print("✅ [Whoop] Token exchange successful")
                        // Clear state after successful authentication
                        self?.currentAuthState = nil
                        continuation.resume()
                    } catch {
                        print("❌ [Whoop] Token exchange failed: \(error.localizedDescription)")
                        // Clear state on error too
                        self?.currentAuthState = nil
                        continuation.resume(throwing: error)
                    }
                }
            }
            
            authSession.presentationContextProvider = WhoopPresentationContextProvider.shared
            authSession.prefersEphemeralWebBrowserSession = false
            
            print("▶️ [Whoop] Starting authentication session")
            print("▶️ [Whoop] URL: \(url.absoluteString)")
            print("▶️ [Whoop] Callback scheme: forge")
            
            // Check if we're on main thread (required for ASWebAuthenticationSession)
            if !Thread.isMainThread {
                print("⚠️ [Whoop] Not on main thread, dispatching to main")
                DispatchQueue.main.async {
                    let started = authSession.start()
                    if !started {
                        print("❌ [Whoop] Failed to start authentication session")
                        continuation.resume(throwing: WhoopError.authError)
                        return
                    }
                    print("✅ [Whoop] Authentication session started successfully")
                }
            } else {
                let started = authSession.start()
                if !started {
                    print("❌ [Whoop] Failed to start authentication session")
                    continuation.resume(throwing: WhoopError.authError)
                    return
                }
                print("✅ [Whoop] Authentication session started successfully")
            }
        }
    }
    
    private func exchangeCodeForToken(code: String, clerkToken: String) async throws {
        print("🔄 [Whoop] exchangeCodeForToken called")
        print("🔄 [Whoop] Code length: \(code.count)")
        print("🔄 [Whoop] Clerk token length: \(clerkToken.count)")
        
        guard let url = URL(string: tokenExchangeURL) else {
            print("❌ [Whoop] Invalid token exchange URL: \(tokenExchangeURL)")
            throw WhoopError.invalidURL
        }
        
        guard let userId = Clerk.shared.user?.id else {
            print("❌ [Whoop] No user ID available")
            throw WhoopError.authError
        }
        
        print("👤 [Whoop] User ID: \(userId)")
        
        let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_KEY") as? String ?? ""
        if supabaseKey.isEmpty {
            print("❌ [Whoop] Supabase key is missing")
        } else {
            print("✅ [Whoop] Supabase key present")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clerkToken)", forHTTPHeaderField: "Authorization")
        request.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        
        let requestBody: [String: Any] = [
            "code": code
        ]
        
        print("📤 [Whoop] Sending token exchange request to: \(url.absoluteString)")
        print("📤 [Whoop] Request body: \(requestBody)")
        
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid HTTP response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Token exchange response status: \(httpResponse.statusCode)")
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Token exchange failed with status \(httpResponse.statusCode)")
            print("❌ [Whoop] Error response: \(errorMessage)")
            throw WhoopError.tokenExchangeError(errorMessage)
        }
        
        print("✅ [Whoop] Token exchange successful, parsing response")
        print("📥 [Whoop] Response data length: \(data.count) bytes")
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📥 [Whoop] Response JSON: \(jsonString.prefix(200))...")
        }
        
        let tokenResponse = try JSONDecoder().decode(WhoopTokenResponse.self, from: data)
        
        print("✅ [Whoop] Token response decoded")
        print("✅ [Whoop] Access token length: \(tokenResponse.accessToken.count)")
        print("✅ [Whoop] Has refresh token: \(tokenResponse.refreshToken != nil)")
        if let refreshToken = tokenResponse.refreshToken {
            print("✅ [Whoop] Refresh token length: \(refreshToken.count)")
        }
        
        try keychain.saveAccessToken(tokenResponse.accessToken, userId: userId)
        print("✅ [Whoop] Access token saved to keychain")
        
        if let refreshToken = tokenResponse.refreshToken {
            print("💾 [Whoop] Saving refresh token to keychain")
            try keychain.saveRefreshToken(refreshToken, userId: userId)
            print("✅ [Whoop] Refresh token saved to keychain")
            
            if let savedToken = keychain.getRefreshToken(userId: userId) {
                print("✅ [Whoop] Verified refresh token in keychain (length: \(savedToken.count))")
            } else {
                print("❌ [Whoop] Failed to verify refresh token in keychain")
            }
        } else {
            print("⚠️ [Whoop] No refresh token in response - WHOOP may require 'offline' scope or refresh tokens may not be available")
        }
        
        isAuthenticated = true
        print("✅ [Whoop] Authentication complete, isAuthenticated = true")
    }
    
    // MARK: - Token Management
    
    func getAccessToken(userId: String) -> String? {
        print("🔍 [Whoop] Getting access token for user: \(userId)")
        let token = keychain.getAccessToken(userId: userId)
        if token != nil {
            print("✅ [Whoop] Access token found")
        } else {
            print("⚠️ [Whoop] No access token found")
        }
        return token
    }
    
    func refreshToken(userId: String) async throws {
        print("🔄 [Whoop] Refreshing token for user: \(userId)")
        
        guard let refreshToken = keychain.getRefreshToken(userId: userId) else {
            print("❌ [Whoop] No refresh token available")
            throw WhoopError.noAccessToken
        }
        
        print("✅ [Whoop] Refresh token found, length: \(refreshToken.count)")
        
        guard let session = Clerk.shared.session,
              let clerkToken = try await session.getToken() else {
            print("❌ [Whoop] Failed to get Clerk token for refresh")
            throw WhoopError.authError
        }
        
        guard let url = URL(string: tokenExchangeURL) else {
            print("❌ [Whoop] Invalid refresh URL")
            throw WhoopError.invalidURL
        }
        
        print("📤 [Whoop] Sending refresh request to: \(url.absoluteString)")
        
        let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_KEY") as? String ?? ""
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(clerkToken.jwt)", forHTTPHeaderField: "Authorization")
        request.setValue(supabaseKey, forHTTPHeaderField: "apikey")
        
        let requestBody: [String: Any] = [
            "refresh_token": refreshToken
        ]
        
        print("📤 [Whoop] Refresh request body: \(requestBody)")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid refresh response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Refresh response status: \(httpResponse.statusCode)")
        print("📥 [Whoop] Response data length: \(data.count) bytes")
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Token refresh failed: \(errorMessage)")
            throw WhoopError.tokenExchangeError("Token refresh failed: \(errorMessage)")
        }
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📥 [Whoop] Refresh response JSON: \(jsonString.prefix(200))...")
        }
        
        let tokenResponse = try JSONDecoder().decode(WhoopTokenResponse.self, from: data)
        
        print("✅ [Whoop] Token refresh successful")
        print("✅ [Whoop] New access token length: \(tokenResponse.accessToken.count)")
        print("✅ [Whoop] Has new refresh token: \(tokenResponse.refreshToken != nil)")
        
        try keychain.saveAccessToken(tokenResponse.accessToken, userId: userId)
        if let newRefreshToken = tokenResponse.refreshToken {
            print("💾 [Whoop] Saving new refresh token")
            try keychain.saveRefreshToken(newRefreshToken, userId: userId)
            
            let tokenManager = WhoopTokenManager()
            await tokenManager.syncRefreshTokenIfStoring(userId: userId)
        } else {
            print("⚠️ [Whoop] No new refresh token in refresh response")
        }
    }
    
    func revokeToken(userId: String) async throws {
        print("🗑️ [Whoop] Revoking token for user: \(userId)")
        
        guard let accessToken = getAccessToken(userId: userId) else {
            print("❌ [Whoop] No access token to revoke")
            throw WhoopError.noAccessToken
        }
        
        // WHOOP revoke endpoint: https://api.prod.whoop.com/developer/v2/user/access
        // Returns 204 on success
        guard let url = URL(string: "https://api.prod.whoop.com/developer/v2/user/access") else {
            print("❌ [Whoop] Invalid revoke URL")
            throw WhoopError.invalidURL
        }
        
        print("📤 [Whoop] Sending revoke request to: \(url.absoluteString)")
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid revoke response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Revoke response status: \(httpResponse.statusCode)")
        
        // WHOOP returns 204 on successful revocation
        guard httpResponse.statusCode == 204 else {
            let errorMessage = "Revocation failed with status \(httpResponse.statusCode)"
            print("❌ [Whoop] \(errorMessage)")
            // Still delete tokens locally even if revoke fails
            try keychain.deleteAllTokens(userId: userId)
            isAuthenticated = false
            throw WhoopError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        try keychain.deleteAllTokens(userId: userId)
        isAuthenticated = false
        print("✅ [Whoop] Token revoked and deleted from keychain")
    }
    
    // MARK: - Recovery Data
    
    func fetchRecovery(userId: String, startDate: Date? = nil, endDate: Date? = nil) async throws -> [WhoopRecovery] {
        print("📊 [Whoop] fetchRecovery called for user: \(userId)")
        
        guard let accessToken = getAccessToken(userId: userId) else {
            print("❌ [Whoop] No access token for recovery fetch")
            throw WhoopError.noAccessToken
        }
        
        var components = URLComponents(string: "https://api.prod.whoop.com/developer/v2/recovery")
        print("🔗 [Whoop] Building recovery URL")
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var queryItems: [URLQueryItem] = []
        
        if let startDate = startDate {
            let startString = dateFormatter.string(from: startDate)
            queryItems.append(URLQueryItem(name: "start", value: startString))
            print("📅 [Whoop] Start date: \(startString)")
        }
        
        if let endDate = endDate {
            let endString = dateFormatter.string(from: endDate)
            queryItems.append(URLQueryItem(name: "end", value: endString))
            print("📅 [Whoop] End date: \(endString)")
        }
        
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        
        guard let url = components?.url else {
            print("❌ [Whoop] Failed to build recovery URL")
            throw WhoopError.invalidURL
        }
        
        print("📤 [Whoop] Fetching recovery data from: \(url.absoluteString)")
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid recovery response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Recovery response status: \(httpResponse.statusCode)")
        print("📥 [Whoop] Response data length: \(data.count) bytes")
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Recovery API error (\(httpResponse.statusCode)): \(errorMessage)")
            throw WhoopError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📊 [Whoop] Recovery API response: \(String(jsonString.prefix(500)))...")
        }
        
        do {
            if let array = try? JSONDecoder().decode([WhoopRecovery].self, from: data) {
                print("✅ [Whoop] Parsed \(array.count) recovery records (direct array)")
                return array
            }
            
            let responseData = try JSONDecoder().decode(WhoopDataResponse<WhoopRecovery>.self, from: data)
            print("✅ [Whoop] Parsed \(responseData.records.count) recovery records (wrapped)")
            return responseData.records
        } catch {
            print("❌ [Whoop] Failed to decode recovery data: \(error)")
            if let decodingError = error as? DecodingError {
                print("❌ [Whoop] Decoding error details: \(decodingError)")
            }
            throw error
        }
    }
    
    // MARK: - Sleep Data
    
    func fetchSleep(userId: String, startDate: Date? = nil, endDate: Date? = nil) async throws -> [WhoopSleep] {
        print("📊 [Whoop] fetchSleep called for user: \(userId)")
        
        guard let accessToken = getAccessToken(userId: userId) else {
            print("❌ [Whoop] No access token for sleep fetch")
            throw WhoopError.noAccessToken
        }
        
        var components = URLComponents(string: "https://api.prod.whoop.com/developer/v2/activity/sleep")
        print("🔗 [Whoop] Building sleep URL")
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var queryItems: [URLQueryItem] = []
        
        if let startDate = startDate {
            let startString = dateFormatter.string(from: startDate)
            queryItems.append(URLQueryItem(name: "start", value: startString))
            print("📅 [Whoop] Start date: \(startString)")
        }
        
        if let endDate = endDate {
            let endString = dateFormatter.string(from: endDate)
            queryItems.append(URLQueryItem(name: "end", value: endString))
            print("📅 [Whoop] End date: \(endString)")
        }
        
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        
        guard let url = components?.url else {
            print("❌ [Whoop] Failed to build sleep URL")
            throw WhoopError.invalidURL
        }
        
        print("📤 [Whoop] Fetching sleep data from: \(url.absoluteString)")
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid sleep response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Sleep response status: \(httpResponse.statusCode)")
        print("📥 [Whoop] Response data length: \(data.count) bytes")
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Sleep API error (\(httpResponse.statusCode)): \(errorMessage)")
            throw WhoopError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📊 [Whoop] Sleep API response: \(String(jsonString.prefix(500)))...")
        }
        
        do {
            if let array = try? JSONDecoder().decode([WhoopSleep].self, from: data) {
                print("✅ [Whoop] Parsed \(array.count) sleep records (direct array)")
                return array
            }
            
            let responseData = try JSONDecoder().decode(WhoopDataResponse<WhoopSleep>.self, from: data)
            print("✅ [Whoop] Parsed \(responseData.records.count) sleep records (wrapped)")
            return responseData.records
        } catch {
            print("❌ [Whoop] Failed to decode sleep data: \(error)")
            if let decodingError = error as? DecodingError {
                print("❌ [Whoop] Decoding error details: \(decodingError)")
            }
            throw error
        }
    }
    
    // MARK: - Cycle Data
    
    func fetchCycle(userId: String, startDate: Date? = nil, endDate: Date? = nil) async throws -> [WhoopCycle] {
        print("📊 [Whoop] fetchCycle called for user: \(userId)")
        
        guard let accessToken = getAccessToken(userId: userId) else {
            print("❌ [Whoop] No access token for cycle fetch")
            throw WhoopError.noAccessToken
        }
        
        var components = URLComponents(string: "https://api.prod.whoop.com/developer/v2/cycle")
        print("🔗 [Whoop] Building cycle URL")
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var queryItems: [URLQueryItem] = []
        
        if let startDate = startDate {
            let startString = dateFormatter.string(from: startDate)
            queryItems.append(URLQueryItem(name: "start", value: startString))
            print("📅 [Whoop] Start date: \(startString)")
        }
        
        if let endDate = endDate {
            let endString = dateFormatter.string(from: endDate)
            queryItems.append(URLQueryItem(name: "end", value: endString))
            print("📅 [Whoop] End date: \(endString)")
        }
        
        if !queryItems.isEmpty {
            components?.queryItems = queryItems
        }
        
        guard let url = components?.url else {
            print("❌ [Whoop] Failed to build cycle URL")
            throw WhoopError.invalidURL
        }
        
        print("📤 [Whoop] Fetching cycle data from: \(url.absoluteString)")
        
        var request = URLRequest(url: url)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid cycle response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Cycle response status: \(httpResponse.statusCode)")
        print("📥 [Whoop] Response data length: \(data.count) bytes")
        
        guard httpResponse.statusCode == 200 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Cycle API error (\(httpResponse.statusCode)): \(errorMessage)")
            throw WhoopError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📊 [Whoop] Cycle API response: \(String(jsonString.prefix(500)))...")
        }
        
        do {
            if let array = try? JSONDecoder().decode([WhoopCycle].self, from: data) {
                print("✅ [Whoop] Parsed \(array.count) cycle records (direct array)")
                return array
            }
            
            let responseData = try JSONDecoder().decode(WhoopDataResponse<WhoopCycle>.self, from: data)
            print("✅ [Whoop] Parsed \(responseData.records.count) cycle records (wrapped)")
            return responseData.records
        } catch {
            print("❌ [Whoop] Failed to decode cycle data: \(error)")
            if let decodingError = error as? DecodingError {
                print("❌ [Whoop] Decoding error details: \(decodingError)")
            }
            throw error
        }
    }
    
    // MARK: - Webhook Management
    
    func createWebhookSubscription(
        callbackURL: String,
        verificationToken: String,
        eventType: String,
        userId: String
    ) async throws -> WhoopWebhookSubscription {
        print("🔔 [Whoop] Creating webhook subscription")
        print("🔔 [Whoop] Callback URL: \(callbackURL)")
        print("🔔 [Whoop] Event type: \(eventType)")
        print("🔔 [Whoop] User ID: \(userId)")
        
        guard let session = Clerk.shared.session,
              let clerkToken = try await session.getToken() else {
            print("❌ [Whoop] No Clerk session for webhook subscription")
            throw WhoopError.authError
        }
        
        guard let url = URL(string: "\(supabaseURL)/functions/v1/whoop-webhook-subscription") else {
            print("❌ [Whoop] Invalid webhook subscription URL")
            throw WhoopError.invalidURL
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
            "event_type": eventType
        ]
        
        print("📤 [Whoop] Sending webhook subscription request")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            print("❌ [Whoop] Invalid webhook subscription response")
            throw WhoopError.invalidResponse
        }
        
        print("📥 [Whoop] Webhook subscription response status: \(httpResponse.statusCode)")
        
        // 409 Conflict means subscription already exists - treat as success
        if httpResponse.statusCode == 409 {
            print("ℹ️ [Whoop] Webhook subscription already exists for \(eventType)")
            return WhoopWebhookSubscription(
                id: nil,
                callbackUrl: nil,
                url: nil,
                verificationToken: nil,
                eventType: eventType,
                enabled: true,
                createdAt: nil,
                updatedAt: nil
            )
        }
        
        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("❌ [Whoop] Webhook subscription failed: HTTP \(httpResponse.statusCode)")
            print("❌ [Whoop] Error response: \(errorMessage)")
            throw WhoopError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
        }
        
        if let subscription = try? JSONDecoder().decode(WhoopWebhookSubscription.self, from: data) {
            print("✅ [Whoop] Webhook subscription created successfully")
            return subscription
        } else {
            let rawResponse = String(data: data, encoding: .utf8) ?? "Unable to decode"
            print("⚠️ [Whoop] Webhook subscription created but response format unexpected: \(rawResponse)")
            return WhoopWebhookSubscription(
                id: nil,
                callbackUrl: nil,
                url: nil,
                verificationToken: nil,
                eventType: eventType,
                enabled: true,
                createdAt: nil,
                updatedAt: nil
            )
        }
    }
    
    // MARK: - Combined Daily Data
    
    func fetchDailyData(userId: String, startDate: Date? = nil, endDate: Date? = nil) async throws -> [WhoopDailyData] {
        print("📊 [Whoop] fetchDailyData called for user: \(userId)")
        
        let calendar = Calendar.current
        let now = Date()
        let finalEndDate = endDate ?? now
        
        let finalStartDate: Date
        if let providedStartDate = startDate {
            finalStartDate = providedStartDate
        } else {
            // Default to last 30 days if no dates provided
            finalStartDate = calendar.date(byAdding: .day, value: -30, to: now) ?? now
        }
        
        print("📅 [Whoop] Fetching daily data from \(finalStartDate) to \(finalEndDate)")
        
        async let recoveryData = fetchRecovery(userId: userId, startDate: finalStartDate, endDate: finalEndDate)
        async let sleepData = fetchSleep(userId: userId, startDate: finalStartDate, endDate: finalEndDate)
        async let cycleData = fetchCycle(userId: userId, startDate: finalStartDate, endDate: finalEndDate)
        
        let (recoveries, sleeps, cycles) = try await (recoveryData, sleepData, cycleData)
        
        print("📊 [Whoop] Fetched \(recoveries.count) recovery records, \(sleeps.count) sleep records, \(cycles.count) cycle records")
        
        var combinedData: [WhoopDailyData] = []
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        var dataByDate: [String: (WhoopRecovery?, WhoopSleep?, WhoopCycle?)] = [:]
        
        for recovery in recoveries {
            if let recoveryDate = isoFormatter.date(from: recovery.start) {
                let dateKey = dateFormatter.string(from: recoveryDate)
                if dataByDate[dateKey] == nil {
                    dataByDate[dateKey] = (recovery, nil, nil)
                } else {
                    dataByDate[dateKey] = (recovery, dataByDate[dateKey]?.1, dataByDate[dateKey]?.2)
                }
            }
        }
        
        for sleep in sleeps {
            if let sleepDate = isoFormatter.date(from: sleep.start) {
                let dateKey = dateFormatter.string(from: sleepDate)
                if dataByDate[dateKey] == nil {
                    dataByDate[dateKey] = (nil, sleep, nil)
                } else {
                    dataByDate[dateKey] = (dataByDate[dateKey]?.0, sleep, dataByDate[dateKey]?.2)
                }
            }
        }
        
        for cycle in cycles {
            if let cycleDate = isoFormatter.date(from: cycle.start) {
                let dateKey = dateFormatter.string(from: cycleDate)
                if dataByDate[dateKey] == nil {
                    dataByDate[dateKey] = (nil, nil, cycle)
                } else {
                    dataByDate[dateKey] = (dataByDate[dateKey]?.0, dataByDate[dateKey]?.1, cycle)
                }
            }
        }
        
        for (date, (recovery, sleep, cycle)) in dataByDate {
            let dailyData = WhoopDailyData(recovery: recovery, sleep: sleep, cycle: cycle)
            combinedData.append(dailyData)
        }
        
        combinedData.sort { first, second in
            guard let firstDate = dateFormatter.date(from: first.date),
                  let secondDate = dateFormatter.date(from: second.date) else {
                return false
            }
            return firstDate < secondDate
        }
        
        print("✅ [Whoop] Combined \(combinedData.count) WHOOP daily data records")
        return combinedData
    }
    
    // MARK: - Connection Status
    
    func checkConnectionStatus(userId: String) {
        print("🔍 [Whoop] Checking connection status for user: \(userId)")
        let hasToken = getAccessToken(userId: userId) != nil
        isAuthenticated = hasToken
        print("\(hasToken ? "✅" : "❌") [Whoop] Connection status: \(hasToken ? "Connected" : "Not connected")")
    }
}

// MARK: - Presentation Context Provider

class WhoopPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = WhoopPresentationContextProvider()
    
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return ASPresentationAnchor()
        }
        return window
    }
}

