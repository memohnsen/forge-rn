//
//  ConnectedAppsView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import SwiftUI
import Clerk

struct ConnectedAppsView: View {
    @Environment(\.clerk) private var clerk
    @Environment(\.colorScheme) var colorScheme
    @State private var vm = ViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ConnectedAppRow(
                            name: "Oura",
                            icon: "circle.fill",
                            isConnected: vm.ouraService.isAuthenticated,
                            isLoading: vm.ouraService.isLoading,
                            onTap: {
                                vm.connectOura(userId: clerk.user?.id)
                            }
                        )
                        
                        ConnectedAppRow(
                            name: "Whoop",
                            icon: "circle.fill",
                            isConnected: vm.whoopService.isAuthenticated,
                            isLoading: vm.whoopService.isLoading,
                            onTap: {
                                vm.connectWhoop(userId: clerk.user?.id)
                            }
                        )
                        
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [blueEnergy.opacity(0.25), blueEnergy.opacity(0.1)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 44, height: 44)
                                
                                Image(systemName: "externaldrive.fill")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(blueEnergy)
                            }
                            
                            Toggle("Store Data For Reports", isOn: $vm.storeToken)
                                .font(.subheadline.weight(.semibold))
                                .tint(blueEnergy)
                                .onChange(of: vm.storeToken) { oldValue, newValue in
                                    vm.storeTokenForReport(newValue: newValue, user: clerk.user?.id)
                                }
                        }
                        .cardStyling()
                        
                        privacyNoticeSection
                    }
                    .padding(.top)
                    .padding(.bottom, 30)
                }
            }
            .navigationTitle("Connected Apps")
            .toolbarTitleDisplayMode(.inlineLarge)
            .toolbarVisibility(.hidden, for: .tabBar)
            .task {
                await vm.checkConnection(user: clerk.user?.id)
            }
            .alert("Oura Connection", isPresented: $vm.showOuraConnectionAlert) {
                Button("OK") {}
            } message: {
                Text(vm.ouraConnectionMessage)
            }
            .alert("WHOOP Connection", isPresented: $vm.showWhoopConnectionAlert) {
                Button("OK") {}
            } message: {
                Text(vm.whoopConnectionMessage)
            }
        }
    }
    
    private var privacyNoticeSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.orange.opacity(0.25), Color.orange.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.orange)
                }
                
                Text("Privacy Notice")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
            }
            
            Text("By connecting to these apps you are agreeing to letting the app access your personal data.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            
            privacyBulletPoints
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? Color.orange.opacity(0.06) : Color.orange.opacity(0.1))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [Color.orange.opacity(0.25), Color.orange.opacity(0.1)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
    }
    
    private var privacyBulletPoints: some View {
        VStack(alignment: .leading, spacing: 10) {
            PrivacyBulletPoint(
                text: "This data is used to give deeper insights to your check-ins and reflections.",
                textColor: .secondary,
                accentColor: .orange
            )
            
            PrivacyBulletPoint(
                text: "All this data is only ever accessed on the app. It is not saved to any external database, meaning no one can see your data besides yourself and whomever you decide to share it with.",
                textColor: .secondary,
                accentColor: .orange
            )
            
            PrivacyBulletPoint(
                text: "As such, the Export Data button will include your Oura and WHOOP data from the date of your login to the app. However, the Auto-Send Weekly Results will NOT include this data unless you turn on the toggle allowing us to store your data.",
                textColor: .secondary,
                accentColor: .orange
            )
        }
    }
}

struct ConnectedAppRow: View {
    @Environment(\.colorScheme) var colorScheme
    let name: String
    let icon: String
    let isConnected: Bool
    let isLoading: Bool
    var isDisabled: Bool = false
    let onTap: () -> Void
    
    private var statusColor: Color {
        isConnected ? .green : .secondary
    }
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [statusColor.opacity(0.25), statusColor.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(statusColor)
                }
                
                Text(name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                Spacer()
                
                if isLoading {
                    ProgressView()
                        .scaleEffect(0.8)
                } else if isConnected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                } else if isDisabled {
                    Text("Coming Soon")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .disabled(isDisabled || isLoading)
        .buttonStyle(.plain)
        .cardStyling()
        .padding(.bottom, -12)
    }
}

#Preview {
    ConnectedAppsView()
}
