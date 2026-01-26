//
//  AppsViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/10/26.
//

import Foundation


extension ConnectedAppsView {
    @Observable
    class ViewModel {
        var ouraService = Oura()
        var ouraTokenManager = OuraTokenManager()
        var whoopService = Whoop()
        var whoopTokenManager = WhoopTokenManager()
        var showOuraConnectionAlert: Bool = false
        var ouraConnectionMessage: String = ""
        var showWhoopConnectionAlert: Bool = false
        var whoopConnectionMessage: String = ""
        var storeToken: Bool = false
        var isLoadingToggle: Bool = false
        
        func connectOura(userId: String?) {
            Task {
                if ouraService.isAuthenticated {
                    // Disconnect
                    if let user = userId {
                        do {
                            try await ouraService.revokeToken(userId: user)
                            await ouraTokenManager.updateOuraToken(userId: user, refreshToken: nil)
                            ouraConnectionMessage = "Oura account disconnected successfully."
                            showOuraConnectionAlert = true
                        } catch {
                            ouraConnectionMessage = "Failed to disconnect Oura account: \(error.localizedDescription)"
                            showOuraConnectionAlert = true
                        }
                    }
                } else {
                    // Connect
                    do {
                        try await ouraService.authenticate()
                        if let user = userId {
                            await createWebhookSubscriptions(userId: user)
                            
                            if storeToken {
                                let keychain = OuraKeychain.shared
                                if let refreshToken = keychain.getRefreshToken(userId: user) {
                                    await ouraTokenManager.updateOuraToken(userId: user, refreshToken: refreshToken)
                                }
                            }
                        }
                        ouraConnectionMessage = "Oura account connected successfully!"
                        showOuraConnectionAlert = true
                    } catch {
                        ouraConnectionMessage = "Failed to connect Oura account: \(error.localizedDescription)"
                        showOuraConnectionAlert = true
                    }
                }
            }
        }
        
        func connectWhoop(userId: String?) {
            Task {
                print("🔔 [ConnectedAppsView] WHOOP connection tapped")
                if whoopService.isAuthenticated {
                    // Disconnect
                    print("🔔 [ConnectedAppsView] Disconnecting WHOOP")
                    if let user = userId {
                        do {
                            try await whoopService.revokeToken(userId: user)
                            await whoopTokenManager.updateWhoopToken(userId: user, refreshToken: nil)
                            whoopConnectionMessage = "WHOOP account disconnected successfully."
                            showWhoopConnectionAlert = true
                            print("✅ [ConnectedAppsView] WHOOP disconnected successfully")
                        } catch {
                            whoopConnectionMessage = "Failed to disconnect WHOOP account: \(error.localizedDescription)"
                            showWhoopConnectionAlert = true
                            print("❌ [ConnectedAppsView] WHOOP disconnect failed: \(error.localizedDescription)")
                        }
                    }
                } else {
                    // Connect
                    print("🔔 [ConnectedAppsView] Connecting WHOOP")
                    do {
                        try await whoopService.authenticate()
                        if let user = userId {
                            // Note: WHOOP webhooks are configured in the WHOOP Developer Dashboard,
                            // not via API. See: https://developer.whoop.com/docs/developing/webhooks/
                            try await Task.sleep(nanoseconds: 100_000_000)
                            
                            if storeToken {
                                print("💾 [ConnectedAppsView] storeToken is true, saving WHOOP refresh token")
                                let keychain = WhoopKeychain.shared
                                
                                var refreshToken: String? = nil
                                for attempt in 1...3 {
                                    refreshToken = keychain.getRefreshToken(userId: user)
                                    if refreshToken != nil {
                                        print("✅ [ConnectedAppsView] Found refresh token in keychain on attempt \(attempt)")
                                        break
                                    }
                                    if attempt < 3 {
                                        print("⚠️ [ConnectedAppsView] Refresh token not found, retrying... (attempt \(attempt))")
                                        try await Task.sleep(nanoseconds: 100_000_000)
                                    }
                                }
                                
                                if let refreshToken = refreshToken {
                                    print("💾 [ConnectedAppsView] Saving refresh token to database (length: \(refreshToken.count))")
                                    await whoopTokenManager.updateWhoopToken(userId: user, refreshToken: refreshToken)
                                    print("✅ [ConnectedAppsView] WHOOP refresh token saved to database")
                                } else {
                                    print("⚠️ [ConnectedAppsView] No WHOOP refresh token found in keychain after multiple attempts")
                                    print("⚠️ [ConnectedAppsView] This might indicate:")
                                    print("⚠️ [ConnectedAppsView] 1. WHOOP didn't return a refresh token in the token exchange")
                                    print("⚠️ [ConnectedAppsView] 2. The refresh token wasn't saved to keychain properly")
                                    print("⚠️ [ConnectedAppsView] 3. WHOOP requires 'offline' scope for refresh tokens (not available in their scope list)")
                                }
                            } else {
                                print("ℹ️ [ConnectedAppsView] storeToken is false, not saving WHOOP refresh token")
                            }
                        }
                        whoopConnectionMessage = "WHOOP account connected successfully!"
                        showWhoopConnectionAlert = true
                        print("✅ [ConnectedAppsView] WHOOP connected successfully")
                    } catch {
                        whoopConnectionMessage = "Failed to connect WHOOP account: \(error.localizedDescription)"
                        showWhoopConnectionAlert = true
                        print("❌ [ConnectedAppsView] WHOOP connection failed: \(error.localizedDescription)")
                    }
                }
            }
        }
        
        func storeTokenForReport(newValue: Bool, user: String?) {
            Task {
                print("🔄 [ConnectedAppsView] Store token toggle changed: \(newValue)")
                if let userId = user {
                    await ouraTokenManager.updateStoreTokenPreference(userId: userId, shouldStore: newValue)
                    
                    if newValue {
                        print("💾 [ConnectedAppsView] Saving tokens for both services")
                        let ouraKeychain = OuraKeychain.shared
                        if let ouraRefreshToken = ouraKeychain.getRefreshToken(userId: userId) {
                            await ouraTokenManager.updateOuraToken(userId: userId, refreshToken: ouraRefreshToken)
                            print("✅ [ConnectedAppsView] Oura refresh token saved")
                        } else {
                            print("ℹ️ [ConnectedAppsView] No Oura refresh token to save")
                        }
                        
                        let whoopKeychain = WhoopKeychain.shared
                        if let whoopRefreshToken = whoopKeychain.getRefreshToken(userId: userId) {
                            await whoopTokenManager.updateWhoopToken(userId: userId, refreshToken: whoopRefreshToken)
                            print("✅ [ConnectedAppsView] WHOOP refresh token saved")
                        } else {
                            print("ℹ️ [ConnectedAppsView] No WHOOP refresh token to save")
                        }
                    } else {
                        print("🗑️ [ConnectedAppsView] Clearing tokens for both services")
                        await ouraTokenManager.updateOuraToken(userId: userId, refreshToken: nil)
                        await whoopTokenManager.updateWhoopToken(userId: userId, refreshToken: nil)
                    }
                }
            }
        }
        
        func checkConnection(user: String?) async {
            print("🚀 [ConnectedAppsView] View appeared, checking connection status")
            if let userId = user {
                print("👤 [ConnectedAppsView] User ID: \(userId)")
                ouraService.checkConnectionStatus(userId: userId)
                whoopService.checkConnectionStatus(userId: userId)
                storeToken = await ouraTokenManager.loadToggleState(userId: userId)
                print("💾 [ConnectedAppsView] Store token state: \(storeToken)")
            }
        }
        
        func createWebhookSubscriptions(userId: String) async {
            guard let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String else {
                return
            }
            
            let webhookURL = "\(supabaseURL)/functions/v1/oura-webhook"
            let verificationToken = "oura-webhook-verification-token"
            
            let eventTypes = ["create", "update", "delete"]
            let dataTypes: [OuraDataType] = [.sleep, .activity, .readiness]
            
            var successCount = 0
            var failureCount = 0
            
            for eventType in eventTypes {
                for dataType in dataTypes {
                    do {
                        _ = try await ouraService.createWebhookSubscription(
                            callbackURL: webhookURL,
                            verificationToken: verificationToken,
                            eventType: eventType,
                            dataType: dataType.rawValue,
                            userId: userId
                        )
                        successCount += 1
                        print("✅ Webhook subscription ready: \(eventType)/\(dataType.rawValue)")
                    } catch {
                        if let ouraError = error as? OuraError,
                           case .apiError(let statusCode, _) = ouraError,
                           statusCode == 409 {
                            successCount += 1
                            print("ℹ️ Webhook subscription already exists: \(eventType)/\(dataType.rawValue)")
                        } else {
                            failureCount += 1
                            print("❌ Failed to create webhook subscription for \(eventType)/\(dataType.rawValue): \(error)")
                        }
                    }
                }
            }
            
            print("📊 [ConnectedAppsView] Oura webhook subscriptions: \(successCount) ready, \(failureCount) failed")
        }
    }
}
