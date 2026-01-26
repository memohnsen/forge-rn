//
//  SettingsView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/26/25.
//

import SwiftUI
import RevenueCatUI
import RevenueCat
import Clerk

private let settingsBlue = Color(red: 100/255, green: 160/255, blue: 220/255)
private let settingsGreen = Color(red: 90/255, green: 180/255, blue: 140/255)
private let settingsOrange = Color(red: 255/255, green: 160/255, blue: 80/255)
private let settingsPurple = Color(red: 140/255, green: 100/255, blue: 200/255)
private let settingsRed = Color(red: 220/255, green: 90/255, blue: 90/255)

struct SettingsView: View {
    @Environment(\.clerk) private var clerk
    @Environment(\.colorScheme) var colorScheme
    @State private var vm = SettingsViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        NavigationLink(destination: NotificationSettingsView()) {
                            SettingsRow(
                                icon: "bell.fill",
                                title: "Notifications",
                                accentColor: settingsOrange,
                                colorScheme: colorScheme
                            )
                        }
                        .buttonStyle(.plain)
                        
                        NavigationLink(destination: ConnectedAppsView()) {
                            SettingsRow(
                                icon: "link",
                                title: "Connected Apps",
                                accentColor: settingsGreen,
                                colorScheme: colorScheme
                            )
                        }
                        .buttonStyle(.plain)
                        
                        Button {
                            vm.isExporting = true
                            Task {
                                if let userId = clerk.user?.id,
                                   let fileURL = await vm.createCSVFile(userId: userId) {
                                    vm.csvFileURL = fileURL
                                    vm.showShareSheet = true
                                }
                                vm.isExporting = false
                            }
                        } label: {
                            SettingsRow(
                                icon: "square.and.arrow.up",
                                title: vm.isExporting ? "Exporting Data..." : "Export My Data",
                                accentColor: settingsBlue,
                                colorScheme: colorScheme,
                                isLoading: vm.isExporting
                            )
                        }
                        .buttonStyle(.plain)
                        .disabled(vm.isExporting)
                        
                        Button {
                            vm.showCoachEmailSheet = true
                        } label: {
                            SettingsRow(
                                icon: "envelope.fill",
                                title: "Auto-Send Results",
                                accentColor: settingsPurple,
                                colorScheme: colorScheme
                            )
                        }
                        .buttonStyle(.plain)
                        
                        Button {
                            vm.showCustomerCenter = true
                            AnalyticsManager.shared.trackCustomerCenterViewed()
                        } label: {
                            SettingsRow(
                                icon: "questionmark.circle.fill",
                                title: "Customer Support",
                                accentColor: settingsBlue,
                                colorScheme: colorScheme
                            )
                        }
                        .buttonStyle(.plain)
                        
                        if let userId = clerk.user?.id,
                           let url = vm.mailtoUrl(userId: userId) {
                            Link(destination: url) {
                                SettingsRow(
                                    icon: "bubble.left.fill",
                                    title: "Submit Feedback",
                                    accentColor: settingsGreen,
                                    colorScheme: colorScheme
                                )
                            }
                        }
                        
                        HStack(spacing: 8) {
                            Circle()
                                .fill(settingsRed.opacity(0.6))
                                .frame(width: 6, height: 6)
                            
                            Text("DANGER ZONE")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 16)
                        .padding(.bottom, 4)
                        
                        Button {
                            vm.alertShown = true
                        } label: {
                            SettingsRow(
                                icon: "trash.fill",
                                title: "Delete All Data",
                                accentColor: settingsRed,
                                colorScheme: colorScheme,
                                isDanger: true
                            )
                        }
                        .buttonStyle(.plain)
                        
                        VStack(spacing: 12) {
                            HStack(spacing: 8) {
                                Link("Privacy Policy", destination: URL(string: "https://www.meetcal.app/forge-privacy")!)
                                Text("•")
                                    .foregroundStyle(.secondary)
                                Link("Terms of Use", destination: URL(string: "https://www.meetcal.app/forge-terms")!)
                                Text("•")
                                    .foregroundStyle(.secondary)
                                Link("EULA", destination: URL(string: "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/")!)
                            }
                            .font(.caption)
                            
                            Text("Forge Version \(vm.appVersion ?? "1.0.0")")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 24)
                    }
                    .padding(.top, 16)
                    .padding(.bottom, 30)
                }
            }
            .navigationTitle("Settings")
            .toolbarTitleDisplayMode(.inlineLarge)
            .sheet(isPresented: $vm.showCustomerCenter) {
                CustomerCenterView()
            }
            .sheet(isPresented: $vm.showShareSheet) {
                if let fileURL = vm.csvFileURL {
                    ShareSheet(items: [fileURL])
                }
            }
            .sheet(isPresented: $vm.showCoachEmailSheet) {
                CoachEmailSheet(
                    coachEmail: vm.users.first?.coach_email ?? "",
                    onSave: { email in
                        Task {
                            if let userId = clerk.user?.id {
                                await vm.updateCoachEmail(
                                    userId: userId,
                                    email: email.isEmpty ? nil : email
                                )
                                // Refresh user data to get updated coach_email
                                await vm.fetchUsers(user_id: userId)
                                vm.showCoachEmailSavedAlert = true
                            }
                        }
                        vm.showCoachEmailSheet = false
                    },
                    onCancel: {
                        vm.showCoachEmailSheet = false
                    }
                )
                .presentationDetents([.fraction(0.7)])
            }
            .task {
                await vm.fetchUsers(user_id: clerk.user?.id ?? "")
                AnalyticsManager.shared.trackScreenView("SettingsView")
            }
            .alert("Coach Email Saved", isPresented: $vm.showCoachEmailSavedAlert) {
                Button("OK") {}
            } message: {
                Text("Your coach email has been saved. Weekly reports will be sent automatically every Sunday.")
            }
            .alert("Are you sure you want to delete all your data?", isPresented: $vm.alertShown) {
                Button("Delete", role: .destructive) {
                    Task {
                        await vm.removeAllCheckIns(userId: clerk.user?.id ?? "")
                        await vm.removeAllMeets(userId: clerk.user?.id ?? "")
                        await vm.removeAllWorkouts(userId: clerk.user?.id ?? "")
                        AnalyticsManager.shared.trackAllDataDeleted()
                    }
                    vm.alertDeletedShown = true
                }
            } message: {
                Text("There is no way to recover this.")
            }
            .alert("Deletion Successfull", isPresented: $vm.alertDeletedShown) {
                Button("OK") {}
            } message: {
                Text("All your data has been deleted.")
            }
        }
    }
}

struct CoachEmailSheet: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var emailText: String
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    
    let onSave: (String) -> Void
    let onCancel: () -> Void
    
    init(coachEmail: String, onSave: @escaping (String) -> Void, onCancel: @escaping () -> Void) {
        _emailText = State(initialValue: coachEmail)
        self.onSave = onSave
        self.onCancel = onCancel
    }
    
    private var textColor: Color {
        colorScheme == .light ? .black : .white
    }
    
    private var textColorSecondary: Color {
        colorScheme == .light ? .black.opacity(0.8) : .white.opacity(0.8)
    }
    
    private var fieldBackground: Color {
        colorScheme == .light ? Color.white.opacity(0.6) : Color.black.opacity(0.2)
    }
    
    private var noticeBackground: Color {
        colorScheme == .light ? Color.orange.opacity(0.1) : Color.orange.opacity(0.2)
    }
    
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }
    
    private func handleSave() {
        let trimmedEmail = emailText.trimmingCharacters(in: .whitespacesAndNewlines)
        
        if trimmedEmail.isEmpty {
            onSave("")
            return
        }
        
        if !isValidEmail(trimmedEmail) {
            showError = true
            errorMessage = "Please enter a valid email address"
            return
        }
        
        onSave(trimmedEmail)
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        emailInputSection
                        privacyNoticeSection
                        Spacer()
                    }
                    .padding(.top)
                }
            }
            .navigationTitle("Auto-Send Results")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", role: .cancel) {
                        showError = false
                        onCancel()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if #available(iOS 26.0, *) {
                        Button("Save", role: .confirm) {
                            showError = false
                            handleSave()
                        }
                        .fontWeight(.semibold)
                    } else {
                        Button("Save") {
                            showError = false
                            handleSave()
                        }
                        .fontWeight(.semibold)
                    }
                }
            }
        }
    }
    
    private var emailInputSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Coach Email Address")
                .font(.headline.bold())
                .foregroundStyle(textColor)
            
            TextField("coach@example.com", text: $emailText)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .autocorrectionDisabled()
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(fieldBackground)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(showError ? Color.red : Color.clear, lineWidth: 1)
                )
            
            if showError {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal)
    }
    
    private var privacyNoticeSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Text("Privacy Notice")
                    .font(.headline.bold())
                    .foregroundStyle(textColor)
            }
            
            Text("By entering a coach email address, you acknowledge and accept that:")
                .font(.subheadline)
                .foregroundStyle(textColorSecondary)
            
            privacyBulletPoints
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(noticeBackground)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                )
        )
        .padding(.horizontal)
    }
    
    private var privacyBulletPoints: some View {
        VStack(alignment: .leading, spacing: 8) {
            PrivacyBulletPoint(
                text: "Your private performance data (check-ins, competition reports, and session reports) and wearable data (Oura/Whoop if you have agreed to store this) will be automatically shared with the email address you provide.",
                textColor: textColorSecondary
            )
            
            PrivacyBulletPoint(
                text: "Data will be sent weekly on Sunday morning via email.",
                textColor: textColorSecondary
            )
            
            PrivacyBulletPoint(
                text: "You are responsible for ensuring the email address is correct and that the recipient is authorized to receive your data.",
                textColor: textColorSecondary
            )
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]
    
    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
        return controller
    }
    
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

struct SettingsRow: View {
    var icon: String
    var title: String
    var accentColor: Color
    var colorScheme: ColorScheme
    var isLoading: Bool = false
    var isDanger: Bool = false
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.25), accentColor.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 40, height: 40)
                
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(accentColor)
            }
            
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(isDanger ? settingsRed : (colorScheme == .light ? .black : .white))
            
            Spacer()
            
            if isLoading {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: (isDanger ? settingsRed : accentColor).opacity(0.06), radius: 8, x: 0, y: 2)
                .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    LinearGradient(
                        colors: [(isDanger ? settingsRed : accentColor).opacity(0.15), (isDanger ? settingsRed : accentColor).opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
    }
}

#Preview {
    SettingsView()
}
