//
//  OnboardingView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk
import RevenueCatUI

struct OnboardingView: View {
    @State private var pageCounter: Int = 1
    @Bindable var onboardingData: OnboardingData

    var body: some View {
        if pageCounter == 1 {
            OnboardingHeroPage(
                pageCounter: $pageCounter,
                pageIndex: 0,
                totalPages: 4,
                icon: "brain.head.profile",
                secondaryIcon: "exclamationmark.triangle.fill",
                accentColor: .red,
                tagline: "The Mental Block",
                title: "Is your mindset limiting your total?",
                message: "Physical strength isn't enough. Mental fatigue and lack of reflection can stall your progress for months.",
                buttonText: "I Feel This"
            )
        } else if pageCounter == 2 {
            OnboardingHeroPage(
                pageCounter: $pageCounter,
                pageIndex: 1,
                totalPages: 4,
                icon: "book.closed.fill",
                secondaryIcon: "lightbulb.fill",
                accentColor: blueEnergy,
                tagline: "The Solution",
                title: "Turn hard sessions into insights",
                message: "A dedicated space to reflect on every lift. Connect your mind to the bar and take action to improve your performance.",
                buttonText: "I Need This"
            )
        } else if pageCounter == 3 {
            OnboardingHeroPage(
                pageCounter: $pageCounter,
                pageIndex: 2,
                totalPages: 4,
                icon: "heart.circle.fill",
                secondaryIcon: "chart.line.uptrend.xyaxis",
                accentColor: .green,
                tagline: "Track Readiness",
                title: "Know when to push and when to deload",
                message: "Daily check-ins and reflections help you understand how your body is holding up. Listen to your body, don't fight against it.",
                buttonText: "I'm Ready"
            )
        } else if pageCounter == 4 {
            OnboardingHeroPage(
                pageCounter: $pageCounter,
                pageIndex: 3,
                totalPages: 4,
                icon: "trophy.fill",
                secondaryIcon: "star.fill",
                accentColor: gold,
                tagline: "Comp Mindset",
                title: "Analyze the day, own the outcome",
                message: "Post-meet reflections help you process the wins and losses, building bulletproof confidence for your next meet.",
                buttonText: "Let's Do It"
            )
        } else if pageCounter == 5 {
            PainPointDiscoverySection(
                pageCounter: $pageCounter,
                currentTrackingMethod: $onboardingData.currentTrackingMethod,
                biggestFrustration: $onboardingData.biggestFrustration,
                reflectionFrequency: $onboardingData.reflectionFrequency,
                whatHoldingBack: $onboardingData.whatHoldingBack,
                buttonText: "Continue"
            )
        }
        else if pageCounter == 6 {
            UserInfoSection(
                pageCounter: $pageCounter,
                firstName: $onboardingData.firstName,
                lastName: $onboardingData.lastName,
                sport: $onboardingData.sport,
                yearsExperience: $onboardingData.yearsExperience,
                meetsPerYear: $onboardingData.meetsPerYear,
                buttonText: "Next"
            )
        } else if pageCounter == 7 {
            SportingInfoSection(
                pageCounter: $pageCounter,
                goal: $onboardingData.goal,
                biggestStruggle: $onboardingData.biggestStruggle,
                nextComp: $onboardingData.nextComp,
                nextCompDate: $onboardingData.nextCompDate,
                buttonText: "Next",
                sport: $onboardingData.sport
            )
        } else if pageCounter == 8 {
            TrainingDaysSection(
                pageCounter: $pageCounter,
                onboardingData: onboardingData,
                trainingDays: $onboardingData.trainingDays,
                buttonText: "Next"
            )
        } else if pageCounter == 9 {
            CustomizingSection()
        }
    }
}

struct OnboardingHeroPage: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var pageCounter: Int
    var pageIndex: Int
    var totalPages: Int
    var icon: String
    var secondaryIcon: String
    var accentColor: Color
    var tagline: String
    var title: String
    var message: String
    var buttonText: String
    
    @State private var isAnimating: Bool = false
    @State private var iconScale: CGFloat = 0.8
    @State private var orbitRotation: Double = 0
    
    var body: some View {
        VStack(spacing: 0) {
            pageIndicator
                .padding(.top, 16)
            
            Spacer()
            
            heroGraphic
            
            Spacer()
            
            VStack(spacing: 16) {
                Text(tagline)
                    .font(.subheadline.weight(.bold))
                    .tracking(1.5)
                    .textCase(.uppercase)
                    .foregroundStyle(accentColor)
                
                Text(title)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }
            .padding(.horizontal, 24)
            
            Spacer()
            
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    pageCounter += 1
                }
            } label: {
                HStack(spacing: 10) {
                    Text(buttonText)
                        .font(.headline.weight(.semibold))
                    Image(systemName: "arrow.right")
                        .font(.subheadline.weight(.semibold))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: [accentColor, accentColor.opacity(0.85)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: accentColor.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 30)
        }
        .background(
            ZStack {
                colorScheme == .light ? Color.white : Color.black
                
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [accentColor.opacity(0.15), accentColor.opacity(0.02), .clear],
                            center: .center,
                            startRadius: 50,
                            endRadius: 300
                        )
                    )
                    .frame(width: 600, height: 600)
                    .offset(y: -100)
                    .blur(radius: 60)
            }
            .ignoresSafeArea()
        )
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                iconScale = 1.0
            }
            withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
                orbitRotation = 360
            }
            isAnimating = true
        }
    }
    
    private var pageIndicator: some View {
        HStack(spacing: 8) {
            ForEach(0..<totalPages, id: \.self) { index in
                Capsule()
                    .fill(index == pageIndex ? accentColor : accentColor.opacity(0.2))
                    .frame(width: index == pageIndex ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3), value: pageIndex)
            }
        }
    }
    
    private var heroGraphic: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { ring in
                Circle()
                    .stroke(
                        accentColor.opacity(0.1 - Double(ring) * 0.025),
                        lineWidth: 1
                    )
                    .frame(width: 180 + CGFloat(ring) * 60, height: 180 + CGFloat(ring) * 60)
            }
            
            Circle()
                .stroke(
                    LinearGradient(
                        colors: [accentColor.opacity(0.3), accentColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    style: StrokeStyle(lineWidth: 2, dash: [8, 8])
                )
                .frame(width: 220, height: 220)
                .rotationEffect(.degrees(orbitRotation))
            
            ForEach(0..<4, id: \.self) { index in
                Circle()
                    .fill(accentColor.opacity(0.15))
                    .frame(width: 12, height: 12)
                    .offset(y: -110)
                    .rotationEffect(.degrees(Double(index) * 90 + orbitRotation))
            }
            
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.2), accentColor.opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 160, height: 160)
                
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor, accentColor.opacity(0.8)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)
                    .shadow(color: accentColor.opacity(0.4), radius: 20, x: 0, y: 10)
                
                Image(systemName: icon)
                    .font(.system(size: 48, weight: .medium))
                    .foregroundStyle(.white)
                    .scaleEffect(iconScale)
            }
            
            Image(systemName: secondaryIcon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(accentColor)
                .padding(12)
                .background(
                    Circle()
                        .fill(colorScheme == .light ? .white : Color(white: 0.15))
                        .shadow(color: accentColor.opacity(0.2), radius: 8, x: 0, y: 4)
                )
                .offset(x: 70, y: -60)
                .scaleEffect(isAnimating ? 1.0 : 0.5)
                .opacity(isAnimating ? 1.0 : 0)
                .animation(.spring(response: 0.6, dampingFraction: 0.6).delay(0.3), value: isAnimating)
        }
        .frame(height: 260)
    }
}

struct UserInfoSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var pageCounter: Int
    @Binding var firstName: String
    @Binding var lastName: String
    @Binding var sport: String
    @Binding var yearsExperience: Int
    @Binding var meetsPerYear: Int
    var buttonText: String
    
    let sports: [String] = ["Olympic Weightlifting", "Powerlifting"]
    
    var isEnabled: Bool {
        !firstName.isEmpty && !lastName.isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
                        OnboardingInputSection(
                            title: "What's your first name?",
                            placeholder: "First Name",
                            text: $firstName,
                            icon: "person.fill"
                        )
                        
                        OnboardingInputSection(
                            title: "What's your last name?",
                            placeholder: "Last Name",
                            text: $lastName,
                            icon: "person.fill"
                        )
                        
                        MultipleChoiceSection(colorScheme: colorScheme, title: "What's your sport?", arrayOptions: sports, selected: $sport)
                        
                        SliderSection(colorScheme: colorScheme, title: "How many years have you been training?", value: $yearsExperience, minString: "0", maxString: "10+", minValue: 0, maxValue: 10, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How many meets do you do per year?", value: $meetsPerYear, minString: "0", maxString: "10+", minValue: 0, maxValue: 10, inverseColorRating: false)
                        
                        OnboardingNextButton(
                            title: buttonText,
                            isEnabled: isEnabled
                        ) {
                            pageCounter += 1
                        }
                    }
                }
            }
            .navigationTitle("Building Your Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct SportingInfoSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var pageCounter: Int
    @Binding var goal: String
    @Binding var biggestStruggle: String
    @Binding var nextComp: String
    @Binding var nextCompDate: Date
    var buttonText: String
    @Binding var sport: String
    
    var sportName: String {
        if sport == "Olympic Weightlifting" {
            return "Weightlifting"
        } else {
            return "Powerlifting"
        }
    }
    
    let struggleOptions: [String] = [
        "Confidence", "Focus", "Self Talk", "Fear", "Comparison", "Pressure", "Consistency"
    ]
    
    var isEnabled: Bool {
        !goal.isEmpty && !nextComp.isEmpty
    }
        
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
                        TextFieldSection(field: $goal, title: "What's your next 6-12 month goal?", colorScheme: colorScheme, keyword: "goal")
                        
                        MultipleChoiceSection(colorScheme: colorScheme, title: "What is the hardest part of \(sportName) mentally for you?", arrayOptions: struggleOptions, selected: $biggestStruggle)
                        
                        TextFieldSection(field: $nextComp, title: "What's your next meet?", colorScheme: colorScheme, keyword: "next meet name")
                        
                        DatePickerSection(title: "Next meet date?", selectedDate: $nextCompDate)
                        
                        OnboardingNextButton(
                            title: buttonText,
                            isEnabled: isEnabled
                        ) {
                            pageCounter += 1
                        }
                    }
                }
            }
            .navigationTitle("Building Your Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct TrainingDaysSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var pageCounter: Int
    
    @State private var showingTimePicker: String? = nil
    
    var onboardingData: OnboardingData
    @Binding var trainingDays: [String: String]
    var buttonText: String
    
    let daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    let timeOptions = [
        "4:00 AM", "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ]
    
    func isDaySelected(_ day: String) -> Bool {
        return trainingDays[day] != nil
    }
    
    var isEnabled: Bool {
        return !trainingDays.isEmpty
    }

    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 16) {
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
                                    .frame(width: 48, height: 48)
                                
                                Image(systemName: "calendar")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundStyle(blueEnergy)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("When do you train?")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(colorScheme == .light ? .black : .white)
                                Text("Select your training days and times")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            
                            Spacer()
                        }
                        .padding(.bottom, 8)
                        
                        ForEach(daysOfWeek, id: \.self) { day in
                            HStack(spacing: 12) {
                                Button {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        if isDaySelected(day) {
                                            trainingDays.removeValue(forKey: day)
                                            showingTimePicker = nil
                                        } else {
                                            trainingDays[day] = timeOptions[0]
                                        }
                                    }
                                } label: {
                                    Text(day)
                                        .font(.subheadline.weight(.semibold))
                                        .frame(width: 140)
                                        .padding(.vertical, 12)
                                        .foregroundStyle(isDaySelected(day) ? .white : blueEnergy)
                                        .background(
                                            Capsule()
                                                .fill(
                                                    isDaySelected(day)
                                                    ? LinearGradient(
                                                        colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                    : LinearGradient(
                                                        colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.08)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                        )
                                        .overlay(
                                            Capsule()
                                                .stroke(
                                                    isDaySelected(day) ? Color.clear : blueEnergy.opacity(0.3),
                                                    lineWidth: 1
                                                )
                                        )
                                }
                                .buttonStyle(.plain)
                                
                                if isDaySelected(day) {
                                    Button {
                                        showingTimePicker = day
                                    } label: {
                                        Text(trainingDays[day] ?? timeOptions[0])
                                            .font(.subheadline.weight(.medium))
                                            .padding(.vertical, 12)
                                            .frame(maxWidth: .infinity)
                                            .foregroundStyle(blueEnergy)
                                            .background(
                                                Capsule()
                                                    .fill(
                                                        LinearGradient(
                                                            colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.08)],
                                                            startPoint: .topLeading,
                                                            endPoint: .bottomTrailing
                                                        )
                                                    )
                                            )
                                            .overlay(
                                                Capsule()
                                                    .stroke(blueEnergy.opacity(0.3), lineWidth: 1)
                                            )
                                    }
                                    .buttonStyle(.plain)
                                    .sheet(isPresented: Binding(
                                        get: { showingTimePicker == day },
                                        set: { if !$0 { showingTimePicker = nil } }
                                    )) {
                                        OnboardingTimePickerSheet(
                                            selectedTime: Binding(
                                                get: { trainingDays[day] ?? timeOptions[0] },
                                                set: { trainingDays[day] = $0 }
                                            ),
                                            timeOptions: timeOptions,
                                            onDone: { showingTimePicker = nil }
                                        )
                                    }
                                } else {
                                    Text("Select time")
                                        .font(.subheadline)
                                        .padding(.vertical, 12)
                                        .frame(maxWidth: .infinity)
                                        .foregroundStyle(.tertiary)
                                        .background(
                                            Capsule()
                                                .fill(Color.gray.opacity(0.1))
                                        )
                                }
                            }
                        }
                    }
                    .padding(18)
                    .background(
                        RoundedRectangle(cornerRadius: 20)
                            .fill(colorScheme == .light ? .white : Color(white: 0.1))
                            .shadow(color: blueEnergy.opacity(0.08), radius: 12, x: 0, y: 4)
                            .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(
                                LinearGradient(
                                    colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.05)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
                    .padding(.horizontal)
                    .padding(.bottom, 12)
                    
                    OnboardingNextButton(
                        title: buttonText,
                        isEnabled: isEnabled
                    ) {
                        pageCounter += 1
                    }
                }
            }
            .navigationTitle("Building Your Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct PainPointDiscoverySection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var pageCounter: Int
    @Binding var currentTrackingMethod: String
    @Binding var biggestFrustration: String
    @Binding var reflectionFrequency: String
    @Binding var whatHoldingBack: String
    var buttonText: String
    
    let mentalBlockOptions: [String] = [
        "I just push through it",
        "Talk to my coach",
        "Take a break",
        "Journal or write about it",
        "Use breathing techniques",
        "I don't have a strategy"
    ]
    
    let reflectionOptions: [String] = [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "After every session"
    ]
    
    var isEnabled: Bool {
        !currentTrackingMethod.isEmpty && !biggestFrustration.isEmpty && !reflectionFrequency.isEmpty && !whatHoldingBack.isEmpty
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
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
                                    .frame(width: 48, height: 48)
                                
                                Image(systemName: "sparkles")
                                    .font(.system(size: 20, weight: .semibold))
                                    .foregroundStyle(blueEnergy)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Understanding You")
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(colorScheme == .light ? .black : .white)
                                Text("These questions help personalize your experience")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            
                            Spacer()
                        }
                        .cardStyling()
                        
                        MultipleChoiceSection(
                            colorScheme: colorScheme,
                            title: "How do you currently work through mental blocks?",
                            arrayOptions: mentalBlockOptions,
                            selected: $currentTrackingMethod
                        )
                        
                        TextFieldSection(
                            field: $biggestFrustration,
                            title: "What's been your biggest frustration with training lately?",
                            colorScheme: colorScheme,
                            keyword: "frustration"
                        )
                        
                        MultipleChoiceSection(
                            colorScheme: colorScheme,
                            title: "How often do you reflect on your training sessions?",
                            arrayOptions: reflectionOptions,
                            selected: $reflectionFrequency
                        )
                        
                        TextFieldSection(
                            field: $whatHoldingBack,
                            title: "What do you think is holding you back from your best performance?",
                            colorScheme: colorScheme,
                            keyword: "barrier"
                        )
                        
                        OnboardingNextButton(
                            title: buttonText,
                            isEnabled: isEnabled
                        ) {
                            pageCounter += 1
                        }
                    }
                }
            }
            .navigationTitle("Understanding You")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct CustomizingSection: View {
    @Environment(\.colorScheme) var colorScheme
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @State private var progress: CGFloat = 0.0
    @State private var showButton: Bool = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                VStack(spacing: 32) {
                    Spacer()
                    
                    VStack(spacing: 24) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.05)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 120, height: 120)
                            
                            Image(systemName: "sparkles")
                                .font(.system(size: 50))
                                .foregroundStyle(blueEnergy)
                                .symbolEffect(.pulse, options: .repeating)
                        }
                        
                        VStack(spacing: 12) {
                            Text("Customizing Your Experience")
                                .font(.title2.weight(.bold))
                                .foregroundStyle(colorScheme == .light ? .black : .white)
                                .multilineTextAlignment(.center)
                            
                            Text("We're setting up your personalized journal based on your preferences")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                    }
                    
                    VStack(spacing: 12) {
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(
                                        LinearGradient(
                                            colors: [blueEnergy.opacity(0.15), blueEnergy.opacity(0.08)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(height: 12)
                                
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(
                                        LinearGradient(
                                            colors: [blueEnergy, blueEnergy.opacity(0.8)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .frame(width: max(0, geometry.size.width * progress), height: 12)
                            }
                        }
                        .frame(height: 12)
                        
                        HStack {
                            Text("\(Int(progress * 100))%")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(blueEnergy)
                            Spacer()
                            if progress >= 1.0 {
                                HStack(spacing: 6) {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.green)
                                    Text("Complete")
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(.green)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 32)
                    
                    Spacer()
                    
                    if showButton {
                        Button {
                            AnalyticsManager.shared.trackOnboardingCompleted()
                            hasSeenOnboarding = true
                        } label: {
                            HStack(spacing: 10) {
                                Text("Let's get started!")
                                    .font(.headline.weight(.semibold))
                                Image(systemName: "arrow.right")
                                    .font(.subheadline.weight(.semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .foregroundStyle(.white)
                            .background(
                                LinearGradient(
                                    colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .shadow(color: blueEnergy.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .padding(.horizontal, 24)
                        .padding(.bottom, 50)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }
                }
            }
            .navigationTitle("Setting Up")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                withAnimation(.linear(duration: 2.5)) {
                    progress = 1.0
                }
                
                try? await Task.sleep(nanoseconds: 2_600_000_000)
                withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                    showButton = true
                }
            }
        }
    }
}

struct OnboardingInputSection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var placeholder: String
    @Binding var text: String
    var icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(blueEnergy)
                
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
            }
            
            TextField(placeholder, text: $text)
                .font(.body)
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [blueEnergy.opacity(0.08), blueEnergy.opacity(0.04)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(blueEnergy.opacity(0.15), lineWidth: 1)
                )
        }
        .cardStyling()
    }
}

struct OnboardingNextButton: View {
    var title: String
    var isEnabled: Bool
    var action: () -> Void
    
    var body: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                action()
            }
        } label: {
            HStack(spacing: 10) {
                Text(title)
                    .font(.headline.weight(.semibold))
                Image(systemName: "arrow.right")
                    .font(.subheadline.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .foregroundStyle(.white)
            .background(
                LinearGradient(
                    colors: isEnabled
                        ? [blueEnergy, blueEnergy.opacity(0.85)]
                        : [Color.gray.opacity(0.5), Color.gray.opacity(0.4)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: isEnabled ? blueEnergy.opacity(0.3) : Color.clear, radius: 8, x: 0, y: 4)
        }
        .disabled(!isEnabled)
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 30)
    }
}

struct OnboardingTimePickerSheet: View {
    @Binding var selectedTime: String
    var timeOptions: [String]
    var onDone: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Text("Select Time")
                .font(.headline.weight(.semibold))
                .padding(.top, 20)
                .padding(.bottom, 8)
            
            Picker("Time", selection: $selectedTime) {
                ForEach(timeOptions, id: \.self) { time in
                    Text(time).tag(time)
                }
            }
            .pickerStyle(.wheel)
            .padding(.horizontal)
            
            Button {
                onDone()
            } label: {
                Text("Done")
                    .font(.headline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(
                        LinearGradient(
                            colors: [blueEnergy, blueEnergy.opacity(0.85)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding()
        }
        .presentationDetents([.height(350)])
    }
}

#Preview {
    OnboardingView(onboardingData: OnboardingData())
}
