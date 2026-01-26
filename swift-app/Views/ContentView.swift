//
//  ContentView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk
import RevenueCatUI

struct ContentView: View {
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @Environment(\.clerk) private var clerk
    @State private var customerManager = CustomerInfoManager()
    @State private var selectedTab: String = "Home"
    @State private var showPaywall: Bool = false
    @State private var onboardingData = OnboardingData()
    
    var body: some View {
        Group {
            // Hasn't completed onboarding yet
            if !hasSeenOnboarding {
                OnboardingView(onboardingData: onboardingData)
                    .environment(customerManager)
            
            // Logged out (show auth first)
            } else if clerk.user == nil {
                AuthView()
            
            // Logged in + has subscription = show tabs
            } else if customerManager.hasProAccess {
                mainTabView
            
            // Logged in + no subscription = show paywall
            } else {
                Color.clear
                    .onAppear {
                        if !customerManager.hasProAccess {
                            showPaywall = true
                        }
                    }
            }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            PaywallView()
                .onPurchaseCompleted { _ in
                    Task {
                        await customerManager.fetchCustomerInfo()
                    }
                    showPaywall = false
                }
                .onRestoreCompleted { _ in
                    Task {
                        await customerManager.fetchCustomerInfo()
                    }
                    showPaywall = false
                }
        }
        .task {
            customerManager.setupDelegate()
            if clerk.user != nil {
                await customerManager.fetchCustomerInfo()
            }
        }
        .onChange(of: customerManager.hasProAccess) { _, newValue in
            if newValue {
                showPaywall = false
            }
        }
        .onChange(of: clerk.user?.id) { oldValue, newValue in
            if newValue == nil && oldValue != nil {
                UserDefaults.standard.removeObject(forKey: "cachedHasProAccess")
            } else if newValue != nil && newValue != oldValue {
                Task {
                    await customerManager.fetchCustomerInfo()
                }
            }
        }
    }
    
    private var mainTabView: some View {
        TabView(selection: $selectedTab) {
            Tab("", systemImage: "house", value: "Home") {
                HomeView(onboardingData: onboardingData)
            }
            Tab("", systemImage: "brain", value: "Exercises") {
                MentalExercisesView()
            }
            Tab("", systemImage: "chart.bar", value: "Trends") {
                TrendsView()
            }
            Tab("", systemImage: "gearshape", value: "Settings") {
                SettingsView()
            }
        }
        .onChange(of: selectedTab) { oldValue, newValue in
            AnalyticsManager.shared.trackTabSwitched(fromTab: oldValue, toTab: newValue)
        }
    }
}

#Preview {
    ContentView()
}
