//
//  HomeView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk
import RevenueCatUI

struct HomeView: View {
    @AppStorage("hasWrittenUserToDB") private var hasWrittenUserToDB: Bool = false
    @AppStorage("userSport") private var userSport: String = ""
    @AppStorage("hasPromptedForNotifications") private var hasPromptedForNotifications: Bool = false
    @AppStorage("trainingDaysStored") private var trainingDaysStored: Bool = false
    
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.clerk) private var clerk
    
    @State private var vm = HomeViewModel()
    @State private var checkInScore = CheckInScore()
    @State private var notificationManager = NotificationManager.shared
    @Bindable var onboardingData: OnboardingData
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .top) {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 16) {
                        MeetCountdownCard(
                            meetName: vm.meetNameDisplay,
                            daysUntilMeet: vm.daysUntilMeet,
                            daysUntilMeetText: vm.daysUntilMeetText,
                            meetDate: dateFormat(vm.users.first?.next_competition_date ?? "") ?? "N/A",
                            sessionsLeftText: vm.sessionsLeftText,
                            colorScheme: colorScheme
                        )
                        .onTapGesture {
                            vm.newMeetName = vm.users.first?.next_competition ?? ""
                            if let dateString = vm.users.first?.next_competition_date {
                                let formatter = DateFormatter()
                                formatter.dateFormat = "yyyy-MM-dd"
                                if let date = formatter.date(from: dateString) {
                                    vm.newMeetDate = date
                                }
                            }
                            vm.editMeetSheetShown = true
                        }
                        
                        DailyCheckInSection(
                            colorScheme: colorScheme,
                            checkInScore: checkInScore,
                            streakCount: vm.streakDisplayText,
                            streakLabel: vm.streakLabelText,
                            streakStatus: vm.streakStatusText,
                            streakColor: vm.streakColor,
                            streakIcon: vm.streakIconName
                        )
                        
                        ReflectionSection()
                        
                        HistorySection(checkins: vm.checkIns, isLoading: vm.loadingHistory)
                    }
                    .padding(.top, 80)
                    .padding(.bottom, 20)
                }
                .refreshable {
                    await vm.fetchCheckins(user_id: clerk.user?.id ?? "")
                    await vm.fetchSessionReports(user_id: clerk.user?.id ?? "")
                    vm.calculateStreak()
                }
                
                if #available(iOS 26.0, * ) {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(vm.date.formatted(date: .complete, time: .omitted))")
                                .foregroundStyle(.secondary)
                            
                            if !vm.users.isEmpty {
                                Text("Ready to train, \(vm.users.first?.first_name ?? "")?")
                                    .font(.headline.bold())
                            }
                        }
                        
                        Spacer()
                        
                        
                        Button {
                            vm.userProfileShown = true
                        } label: {
                            if clerk.user == nil {
                                Image(systemName: "person")
                                    .resizable()
                                    .scaledToFit()
                                    .padding()
                                    .frame(width: 50)
                                    .foregroundStyle(colorScheme == .light ? .black : .white)
                                    .overlay(
                                        Circle()
                                            .frame(width: 60)
                                            .foregroundStyle(colorScheme == .light ? .gray.opacity(0.3) : .gray.opacity(0.2))
                                    )
                            } else {
                                UserButton()
                                    .frame(width: 50, height: 50)
                            }
                        }
                    }
                    .padding([.horizontal, .bottom])
                    .padding(.top, 70)
                    .glassEffect(in: .rect(cornerRadius: 32))
                    .padding(.top, -70)
                } else {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(vm.date.formatted(date: .complete, time: .omitted))")
                                .foregroundStyle(.secondary)
                            
                            if !vm.users.isEmpty {
                                Text("Ready to train, \(vm.users.first?.first_name ?? "")?")
                                    .font(.headline.bold())
                            }
                        }
                        
                        Spacer()
                        
                        
                        Button {
                            vm.userProfileShown = true
                        } label: {
                            if clerk.user == nil {
                                Image(systemName: "person")
                                    .resizable()
                                    .scaledToFit()
                                    .padding()
                                    .frame(width: 50)
                                    .foregroundStyle(colorScheme == .light ? .black : .white)
                                    .overlay(
                                        Circle()
                                            .frame(width: 60)
                                            .foregroundStyle(colorScheme == .light ? .gray.opacity(0.3) : .gray.opacity(0.2))
                                    )
                            } else {
                                UserButton()
                                    .frame(width: 50, height: 50)
                            }
                        }
                    }
                    .padding([.horizontal, .bottom])
                    .padding(.top, 70)
                    .background(
                        RoundedRectangle(cornerRadius: 32)
                            .fill(.ultraThinMaterial)
                    )
                    .padding(.top, -70)
                }
            }
        }
        .task {
            if !hasWrittenUserToDB && clerk.user != nil && !onboardingData.firstName.isEmpty {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                let formattedDate = dateFormatter.string(from: onboardingData.nextCompDate)
                let createdAtDate = dateFormatter.string(from: Date())
                
                let newUser = Users(
                    user_id: clerk.user?.id ?? "",
                    first_name: onboardingData.firstName,
                    last_name: onboardingData.lastName,
                    sport: onboardingData.sport,
                    years_of_experience: onboardingData.yearsExperience,
                    meets_per_year: onboardingData.meetsPerYear,
                    goal: onboardingData.goal,
                    biggest_struggle: onboardingData.biggestStruggle,
                    training_days: onboardingData.trainingDays,
                    next_competition: onboardingData.nextComp,
                    next_competition_date: formattedDate,
                    current_tracking_method: onboardingData.currentTrackingMethod,
                    biggest_frustration: onboardingData.biggestFrustration,
                    reflection_frequency: onboardingData.reflectionFrequency,
                    what_holding_back: onboardingData.whatHoldingBack,
                    created_at: createdAtDate
                )
                
                await vm.submitUserProfile(user: newUser)
                hasWrittenUserToDB = true
            }
            
            await vm.fetchUsers(user_id: clerk.user?.id ?? "")
            
            if let sport = vm.users.first?.sport {
                userSport = sport
            }
            
            if let userId = clerk.user?.id,
               let user = vm.users.first,
               user.store_token == true {
                let tokenManager = OuraTokenManager()
                await tokenManager.syncRefreshTokenIfStoring(userId: userId)
            }
            
            if !trainingDaysStored, let user = vm.users.first {
                notificationManager.storeTrainingDays(user.training_days)
                notificationManager.storeMeetData(
                    meetDate: user.next_competition_date,
                    meetName: user.next_competition
                )
                trainingDaysStored = true
                
                // Request notification permission after onboarding
                if !hasPromptedForNotifications {
                    Task {
                        let granted = await notificationManager.requestPermission()
                        if granted {
                            notificationManager.scheduleNotifications()
                        }
                        hasPromptedForNotifications = true
                    }
                }
            }
            
            // Reschedule notifications on app launch if enabled
            if notificationManager.isEnabled {
                notificationManager.scheduleNotifications()
            }
            
            // Update widget with meet data
            if let user = vm.users.first {
                let sharedDefaults = UserDefaults(suiteName: "group.com.memohnsen.forge.JournalWidget")
                sharedDefaults?.set(user.next_competition, forKey: "meetName")
                sharedDefaults?.set(user.next_competition_date, forKey: "meetDate")
                sharedDefaults?.set(vm.daysUntilMeet, forKey: "daysUntilMeet")
                sharedDefaults?.set(vm.sessionsLeft, forKey: "sessionsLeft")
            }
            
            await vm.fetchCheckins(user_id: clerk.user?.id ?? "")
            await vm.fetchSessionReports(user_id: clerk.user?.id ?? "")
            vm.calculateStreak()
            AnalyticsManager.shared.trackScreenView("HomeView")
        }
        .onAppear {
            Task {
                await vm.fetchCheckins(user_id: clerk.user?.id ?? "")
                await vm.fetchSessionReports(user_id: clerk.user?.id ?? "")
                vm.calculateStreak()
            }
        }
        .sheet(isPresented: $vm.userProfileShown) {
            if clerk.user != nil {
                UserProfileView()
            } else {
                AuthView()
            }
        }
        .sheet(isPresented: $vm.editMeetSheetShown) {
            NavigationStack {
                Form {
                    Section {
                        TextField("Meet Name", text: $vm.newMeetName)

                        DatePicker("Meet Date", selection: $vm.newMeetDate, displayedComponents: .date)
                    } header: {
                        Text("Update Next Meet")
                    }
                }
                .navigationTitle("Edit Meet")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel", role: .cancel) {
                            vm.editMeetSheetShown = false
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        if #available(iOS 26.0, *) {
                            Button("Save", role: .confirm) {
                                Task {
                                    let dateFormatter = DateFormatter()
                                    dateFormatter.dateFormat = "yyyy-MM-dd"
                                    let formattedDate = dateFormatter.string(from: vm.newMeetDate)

                                    await vm.updateUserMeet(
                                        userId: clerk.user?.id ?? "",
                                        meetName: vm.newMeetName,
                                        meetDate: formattedDate
                                    )

                                    await vm.fetchUsers(user_id: clerk.user?.id ?? "")

                                    notificationManager.storeMeetData(
                                        meetDate: formattedDate,
                                        meetName: vm.newMeetName
                                    )

                                    if notificationManager.isEnabled {
                                        notificationManager.scheduleNotifications()
                                    }

                                    vm.editMeetSheetShown = false
                                }
                            }
                        } else {
                            Button("Save") {
                                Task {
                                    let dateFormatter = DateFormatter()
                                    dateFormatter.dateFormat = "yyyy-MM-dd"
                                    let formattedDate = dateFormatter.string(from: vm.newMeetDate)

                                    await vm.updateUserMeet(
                                        userId: clerk.user?.id ?? "",
                                        meetName: vm.newMeetName,
                                        meetDate: formattedDate
                                    )

                                    await vm.fetchUsers(user_id: clerk.user?.id ?? "")

                                    notificationManager.storeMeetData(
                                        meetDate: formattedDate,
                                        meetName: vm.newMeetName
                                    )

                                    if notificationManager.isEnabled {
                                        notificationManager.scheduleNotifications()
                                    }

                                    vm.editMeetSheetShown = false
                                }
                            }
                        }
                    }
                }
                .presentationDetents([.fraction(0.4)])
            }
        }
    }
}

private let checkInOrange = Color(red: 255/255, green: 160/255, blue: 80/255)

struct DailyCheckInSection: View {
    var colorScheme: ColorScheme
    @Bindable var checkInScore: CheckInScore
    var streakCount: String
    var streakLabel: String
    var streakStatus: String
    var streakColor: Color
    var streakIcon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [checkInOrange.opacity(0.3), checkInOrange.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 52, height: 52)
                    
                    Image(systemName: "sun.max.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [checkInOrange, Color(red: 255/255, green: 200/255, blue: 100/255)],
                                startPoint: .bottomLeading,
                                endPoint: .topTrailing
                            )
                        )
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 4) {
                        Image(systemName: streakIcon)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(streakColor)
                        
                        Text("\(streakCount) \(streakLabel) \(streakStatus)")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(streakColor)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        Capsule()
                            .fill(streakColor.opacity(colorScheme == .light ? 0.12 : 0.2))
                    )
                    
                    Text("Daily Check-In")
                        .font(.title3.bold())
                }
                
                Spacer()
            }
            .padding(.bottom, 14)
            
            Text("How is your body feeling before today's session? Track your readiness to optimize your training.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .padding(.bottom, 18)
            
            NavigationLink(destination: CheckInView(checkInScore: checkInScore)) {
                HStack(spacing: 8) {
                    Text("Start Check-In")
                        .font(.subheadline.weight(.semibold))
                    
                    Image(systemName: "arrow.right")
                        .font(.subheadline.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundStyle(.white)
                .background(
                    LinearGradient(
                        colors: [checkInOrange, checkInOrange.opacity(0.85)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(.rect(cornerRadius: 12))
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: checkInOrange.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [checkInOrange.opacity(0.25), checkInOrange.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
    }
}

struct ReflectionSection: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        HStack(spacing: 12) {
            NavigationLink(destination: WorkoutReflectionView()) {
                ReflectionCard(
                    icon: "figure.strengthtraining.traditional",
                    title: "Session\nReflection",
                    accentColor: blueEnergy,
                    colorScheme: colorScheme
                )
            }
            
            NavigationLink(destination: CompReflectionView()) {
                ReflectionCard(
                    icon: "trophy.fill",
                    title: "Competition\nAnalysis",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
            }
        }
        .padding(.horizontal)
    }
}

struct ReflectionCard: View {
    var icon: String
    var title: String
    var accentColor: Color
    var colorScheme: ColorScheme
    
    var body: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.25), accentColor.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 56, height: 56)
                
                Image(systemName: icon)
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(accentColor)
            }
            
            Text(title)
                .font(.subheadline.weight(.semibold))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 12)
        .foregroundStyle(colorScheme == .light ? .black : .white)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: accentColor.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [accentColor.opacity(0.2), accentColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
    }
}

struct HistorySection: View {
    @Environment(\.colorScheme) var colorScheme
    var checkins: [DailyCheckIn]
    var isLoading: Bool
    
    private let historyPurple = Color(red: 140/255, green: 120/255, blue: 200/255)

    var body: some View {
        if isLoading {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("RECENT ACTIVITY")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)
                    
                    Spacer()
                    
                    NavigationLink(destination: HistoryView()) {
                        Text("View All")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(blueEnergy)
                    }
                }
                
                CustomProgressView(maxNum: 3)
            }
            .padding(.horizontal)
            .padding(.top, 8)
        } else if !checkins.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("RECENT ACTIVITY")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 4)
                    
                    Spacer()
                    
                    NavigationLink(destination: HistoryView()) {
                        HStack(spacing: 4) {
                            Text("View All")
                                .font(.caption.weight(.semibold))
                            Image(systemName: "chevron.right")
                                .font(.caption2.weight(.semibold))
                        }
                        .foregroundStyle(blueEnergy)
                    }
                }
                
                ForEach(Array(checkins.prefix(5).enumerated()), id: \.element.id) { index, checkin in
                    NavigationLink(destination: HistoryDetailsView(title: checkin.selected_lift, searchTerm: checkin.selected_lift, selection: "Check-Ins", date: checkin.check_in_date)) {
                        HistoryItemCard(
                            intensity: checkin.selected_intensity,
                            lift: checkin.selected_lift,
                            date: dateFormat(checkin.check_in_date) ?? checkin.check_in_date,
                            score: checkin.overall_score,
                            colorScheme: colorScheme
                        )
                    }
                }
            }
            .padding(.horizontal)
            .padding(.top, 8)
        }
    }
}

struct HistoryItemCard: View {
    var intensity: String
    var lift: String
    var date: String
    var score: Int
    var colorScheme: ColorScheme
    
    private var scoreColor: Color {
        if score >= 80 {
            return Color(red: 90/255, green: 180/255, blue: 140/255)
        } else if score >= 60 {
            return Color(red: 255/255, green: 180/255, blue: 80/255)
        } else {
            return Color(red: 220/255, green: 100/255, blue: 100/255)
        }
    }
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [scoreColor.opacity(0.4), scoreColor.opacity(0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 3
                    )
                    .frame(width: 48, height: 48)
                
                Text("\(score)")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(scoreColor)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text("\(intensity) \(lift)")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                    .lineLimit(1)
                
                Text(date)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    colorScheme == .light ? Color.black.opacity(0.04) : Color.white.opacity(0.06),
                    lineWidth: 1
                )
        )
    }
}

struct MeetCountdownCard: View {
    var meetName: String
    var daysUntilMeet: Int
    var daysUntilMeetText: String
    var meetDate: String
    var sessionsLeftText: String
    var colorScheme: ColorScheme
    
    private var countdownColor: Color {
        if daysUntilMeet < 0 {
            return Color(red: 90/255, green: 180/255, blue: 140/255)
        } else if daysUntilMeet <= 7 {
            return Color(red: 220/255, green: 100/255, blue: 100/255)
        } else if daysUntilMeet <= 14 {
            return Color(red: 255/255, green: 160/255, blue: 80/255)
        } else {
            return blueEnergy
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "flag.checkered")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(gold)
                        
                        Text(meetName)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                    }
                    
                    Text(sessionsLeftText)
                        .font(.title2.bold())
                        .foregroundStyle(countdownColor)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 8) {
                    Text(meetDate)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    
                    Text(daysUntilMeetText)
                        .font(.title2.bold())
                        .foregroundStyle(gold)
                }
            }
            
            if daysUntilMeet <= 0 {
                Divider()
                    .padding(.vertical, 14)
                
                HStack(spacing: 0) {
                    Image(systemName: "pencil")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                    
                    Text("Tap to edit meet details")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.leading, 6)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.tertiary)
                }
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: countdownColor.opacity(0.1), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [countdownColor.opacity(0.2), countdownColor.opacity(0.05)],
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
    HomeView(onboardingData: OnboardingData())
}
