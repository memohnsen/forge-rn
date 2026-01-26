//
//  WriteWhoopToken.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import Supabase

@MainActor @Observable
class WhoopTokenManager {
    var isLoading: Bool = false
    var error: Error?
    
    func updateWhoopToken(userId: String, refreshToken: String?) async {
        print("💾 [WhoopTokenManager] updateWhoopToken called for user: \(userId)")
        print("💾 [WhoopTokenManager] Refresh token present: \(refreshToken != nil)")
        if let token = refreshToken {
            print("💾 [WhoopTokenManager] Token length: \(token.count)")
        }
        
        isLoading = true
        error = nil
        
        do {
            print("📤 [WhoopTokenManager] Updating whoop_refresh_token in database")
            try await supabase
                .from("journal_users")
                .update([
                    "whoop_refresh_token": refreshToken
                ])
                .eq("user_id", value: userId)
                .execute()
            
            print("✅ [WhoopTokenManager] Successfully updated whoop_refresh_token")
        } catch let DecodingError.keyNotFound(key, context) {
            print("❌ [WhoopTokenManager] Key '\(key.stringValue)' not found:", context.debugDescription)
            print("❌ [WhoopTokenManager] codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.typeMismatch(type, context) {
            print("❌ [WhoopTokenManager] Type '\(type)' mismatch:", context.debugDescription)
            print("❌ [WhoopTokenManager] codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.valueNotFound(value, context) {
            print("❌ [WhoopTokenManager] Value '\(value)' not found:", context.debugDescription)
            print("❌ [WhoopTokenManager] codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.dataCorrupted(context) {
            print("❌ [WhoopTokenManager] Data corrupted:", context.debugDescription)
            self.error = error
        } catch {
            print("❌ [WhoopTokenManager] Error updating Whoop token: \(error.localizedDescription)")
            print("❌ [WhoopTokenManager] Full error: \(error)")
            self.error = error
        }
        
        isLoading = false
        print("🏁 [WhoopTokenManager] updateWhoopToken completed, isLoading = false")
    }
    
    func syncRefreshTokenIfStoring(userId: String) async {
        print("🔄 [WhoopTokenManager] syncRefreshTokenIfStoring called for user: \(userId)")
        
        do {
            print("🔍 [WhoopTokenManager] Checking store_token preference")
            let response = try await supabase
                .from("journal_users")
                .select("store_token")
                .eq("user_id", value: userId)
                .single()
                .execute()
            
            if let json = try JSONSerialization.jsonObject(with: response.data) as? [String: Any],
               let shouldStore = json["store_token"] as? Bool,
               shouldStore {
                print("✅ [WhoopTokenManager] store_token is true, syncing refresh token")
                let keychain = WhoopKeychain.shared
                if let refreshToken = keychain.getRefreshToken(userId: userId) {
                    print("💾 [WhoopTokenManager] Found refresh token in keychain, updating database")
                    await updateWhoopToken(userId: userId, refreshToken: refreshToken)
                } else {
                    print("⚠️ [WhoopTokenManager] No refresh token found in keychain")
                }
            } else {
                print("ℹ️ [WhoopTokenManager] store_token is false or not set, skipping sync")
            }
        } catch {
            print("❌ [WhoopTokenManager] Error syncing refresh token: \(error.localizedDescription)")
            print("❌ [WhoopTokenManager] Full error: \(error)")
        }
    }
    
    func loadToggleState(userId: String) async -> Bool {
        print("🔍 [WhoopTokenManager] loadToggleState called for user: \(userId)")
        
        do {
            let response = try await supabase
                .from("journal_users")
                .select("store_token")
                .eq("user_id", value: userId)
                .single()
                .execute()
            
            if let json = try JSONSerialization.jsonObject(with: response.data) as? [String: Any],
               let shouldStore = json["store_token"] as? Bool {
                print("✅ [WhoopTokenManager] Loaded store_token: \(shouldStore)")
                return shouldStore
            }
            print("⚠️ [WhoopTokenManager] store_token not found, returning false")
            return false
        } catch {
            print("❌ [WhoopTokenManager] Error loading toggle state: \(error.localizedDescription)")
            print("❌ [WhoopTokenManager] Full error: \(error)")
            return false
        }
    }
}

