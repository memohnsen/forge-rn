//
//  WhoopKeychain.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import SimpleKeychain

class WhoopKeychain {
    static let shared = WhoopKeychain()
    private let keychain: SimpleKeychain
    private let service = "com.memohnsen.forge.whoop"
    
    private init() {
        keychain = SimpleKeychain(service: service)
        print("🔐 WhoopKeychain initialized with service: \(service)")
    }
    
    func saveAccessToken(_ token: String, userId: String) throws {
        let key = "access_token_\(userId)"
        print("💾 [WhoopKeychain] Attempting to save access token for user: \(userId)")
        print("💾 [WhoopKeychain] Token length: \(token.count) characters")
        print("💾 [WhoopKeychain] Key: \(key)")
        try keychain.set(token, forKey: key)
        print("✅ [WhoopKeychain] Successfully saved access token for user: \(userId)")
    }
    
    func getAccessToken(userId: String) -> String? {
        let key = "access_token_\(userId)"
        print("🔍 [WhoopKeychain] Attempting to retrieve access token for user: \(userId)")
        print("🔍 [WhoopKeychain] Key: \(key)")
        if let token = try? keychain.string(forKey: key) {
            print("✅ [WhoopKeychain] Found access token for user: \(userId) (length: \(token.count))")
            return token
        } else {
            print("⚠️ [WhoopKeychain] No access token found for user: \(userId)")
            return nil
        }
    }
    
    func deleteAccessToken(userId: String) throws {
        let key = "access_token_\(userId)"
        print("🗑️ [WhoopKeychain] Attempting to delete access token for user: \(userId)")
        print("🗑️ [WhoopKeychain] Key: \(key)")
        if (try? keychain.string(forKey: key)) != nil {
            try keychain.deleteItem(forKey: key)
            print("✅ [WhoopKeychain] Successfully deleted access token for user: \(userId)")
        } else {
            print("🔑 [WhoopKeychain] No access token to delete for user: \(userId)")
        }
    }
    
    func saveRefreshToken(_ token: String, userId: String) throws {
        let key = "refresh_token_\(userId)"
        print("💾 [WhoopKeychain] Attempting to save refresh token for user: \(userId)")
        print("💾 [WhoopKeychain] Token length: \(token.count) characters")
        print("💾 [WhoopKeychain] Key: \(key)")
        try keychain.set(token, forKey: key)
        print("✅ [WhoopKeychain] Successfully saved refresh token for user: \(userId)")
    }
    
    func getRefreshToken(userId: String) -> String? {
        let key = "refresh_token_\(userId)"
        print("🔍 [WhoopKeychain] Attempting to retrieve refresh token for user: \(userId)")
        print("🔍 [WhoopKeychain] Key: \(key)")
        if let token = try? keychain.string(forKey: key) {
            print("✅ [WhoopKeychain] Found refresh token for user: \(userId) (length: \(token.count))")
            return token
        } else {
            print("⚠️ [WhoopKeychain] No refresh token found for user: \(userId)")
            return nil
        }
    }
    
    func deleteRefreshToken(userId: String) throws {
        let key = "refresh_token_\(userId)"
        print("🗑️ [WhoopKeychain] Attempting to delete refresh token for user: \(userId)")
        print("🗑️ [WhoopKeychain] Key: \(key)")
        if (try? keychain.string(forKey: key)) != nil {
            try keychain.deleteItem(forKey: key)
            print("✅ [WhoopKeychain] Successfully deleted refresh token for user: \(userId)")
        } else {
            print("🔑 [WhoopKeychain] No refresh token to delete for user: \(userId)")
        }
    }
    
    func deleteAllTokens(userId: String) throws {
        print("🗑️ [WhoopKeychain] Attempting to delete all tokens for user: \(userId)")
        do {
            try deleteAccessToken(userId: userId)
        } catch {
            print("⚠️ [WhoopKeychain] Error deleting access token (may not exist): \(error.localizedDescription)")
        }
        
        do {
            try deleteRefreshToken(userId: userId)
        } catch {
            print("⚠️ [WhoopKeychain] Error deleting refresh token (may not exist): \(error.localizedDescription)")
        }
        
        print("✅ [WhoopKeychain] Successfully deleted all tokens for user: \(userId)")
    }
}

