//
//  WriteOuraToken.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation
import Supabase

@MainActor @Observable
class OuraTokenManager {
    var isLoading: Bool = false
    var error: Error?
    
    func updateOuraToken(userId: String, refreshToken: String?) async {
        isLoading = true
        error = nil
        
        do {
            try await supabase
                .from("journal_users")
                .update([
                    "oura_refresh_token": refreshToken
                ])
                .eq("user_id", value: userId)
                .execute()
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch {
            print("Error updating Oura token: \(error.localizedDescription)")
            print("Full error: \(error)")
            self.error = error
        }
        
        isLoading = false
    }
    
    func updateStoreTokenPreference(userId: String, shouldStore: Bool) async {
        isLoading = true
        error = nil
        
        do {
            try await supabase
                .from("journal_users")
                .update([
                    "store_token": shouldStore
                ])
                .eq("user_id", value: userId)
                .execute()
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
            self.error = error
        } catch {
            print("Error updating store token preference: \(error.localizedDescription)")
            print("Full error: \(error)")
            self.error = error
        }
        
        isLoading = false
    }
    
    func syncRefreshTokenIfStoring(userId: String) async {
        do {
            let response = try await supabase
                .from("journal_users")
                .select("store_token")
                .eq("user_id", value: userId)
                .single()
                .execute()
            
            if let json = try JSONSerialization.jsonObject(with: response.data) as? [String: Any],
               let shouldStore = json["store_token"] as? Bool,
               shouldStore {
                let keychain = OuraKeychain.shared
                if let refreshToken = keychain.getRefreshToken(userId: userId) {
                    await updateOuraToken(userId: userId, refreshToken: refreshToken)
                }
            }
        } catch {
            print("Error syncing refresh token: \(error.localizedDescription)")
        }
    }
    
    func loadToggleState(userId: String) async -> Bool {
        do {
            let response = try await supabase
                .from("journal_users")
                .select("store_token")
                .eq("user_id", value: userId)
                .single()
                .execute()
            
            if let json = try JSONSerialization.jsonObject(with: response.data) as? [String: Any],
               let shouldStore = json["store_token"] as? Bool {
                return shouldStore
            }
            return false
        } catch {
            print("Error loading toggle state: \(error.localizedDescription)")
            return false
        }
    }
}

