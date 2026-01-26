//
//  MeetJournalApp.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk
import RevenueCat

@main
struct MeetJournalApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var clerk = Clerk.shared
    @State private var customerManager = CustomerInfoManager()
    @State private var showSplash = true
    var hasProAccess: Bool { customerManager.hasProAccess }
    
    let revenuecatKey = Bundle.main.object(forInfoDictionaryKey: "REVENUECAT_API_KEY") as! String

    init() {
        Purchases.configure(withAPIKey: revenuecatKey)
    }

    var body: some Scene {
        WindowGroup {
            ZStack {
                ContentView()
                    .environment(\.clerk, clerk)
                    .onOpenURL { url in
                        if url.scheme == "forge" && url.host == "oauth" {
                        }
                    }
                    .task {
                        let clerkKey = Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as! String
                        clerk.configure(publishableKey: clerkKey)
                        try? await clerk.load()
                        
                        if let userId = clerk.user?.id {
                            Purchases.shared.logIn(userId) { customerInfo, created, error in
                                if let error = error {
                                    print("Error logging in to RevenueCat: \(error)")
                                } else {
                                    print("Logged in to RevenueCat with user ID: \(userId)")
                                    print("New user created: \(created)")
                                }
                            }
                        }
                        
                        customerManager.setupDelegate()
                        await customerManager.fetchCustomerInfo()
                    }
                
                if showSplash {
                    SplashScreenView(isActive: $showSplash)
                        .transition(.opacity)
                        .zIndex(1)
                }
            }
        }
    }
}
