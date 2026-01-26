//
//  CheckInView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk

struct CheckInView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.clerk) private var clerk

    @Bindable var checkInScore: CheckInScore
    @State private var vm = ViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
            
                ScrollView {
                    VStack(spacing: 0) {
                        DatePickerSection(title: "Session date:", selectedDate: $checkInScore.checkInDate)
                        
                        MultipleChoiceSection(
                            colorScheme: colorScheme,
                            title: "What's the main movement for the session?",
                            arrayOptions: vm.liftOptions,
                            selected: $vm.selectedLift
                        )
                        
                        MultipleChoiceSection(
                            colorScheme: colorScheme,
                            title: "What's the intensity for the session?",
                            arrayOptions: vm.intensityOptions,
                            selected: $vm.selectedIntensity
                        )
                        
                        TextFieldSection(
                            field: $checkInScore.goal,
                            title: "What would make today feel like a successful session for you?",
                            colorScheme: colorScheme,
                            keyword: "goal"
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How strong does your body feel?",
                            value: $checkInScore.physicalStrength,
                            minString: "Weak",
                            maxString: "Strong",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How recovered do you feel?",
                            value: $checkInScore.recovered,
                            minString: "Not At All",
                            maxString: "Very",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How energized do you feel?",
                            value: $checkInScore.energy,
                            minString: "Low",
                            maxString: "High",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How sore does your body feel?",
                            value: $checkInScore.soreness,
                            minString: "None",
                            maxString: "Extreme",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: true
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How connected do you feel to your body?",
                            value: $checkInScore.bodyConnection,
                            minString: "Disconnected",
                            maxString: "Very Connected",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How strong does your mind feel?",
                            value: $checkInScore.mentalStrength,
                            minString: "Weak",
                            maxString: "Strong",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How confident do you feel?",
                            value: $checkInScore.confidence,
                            minString: "Not At All",
                            maxString: "Very",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How focused do you feel?",
                            value: $checkInScore.focus,
                            minString: "Distracted",
                            maxString: "Very Focused",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How stressed do you feel?",
                            value: $checkInScore.stress,
                            minString: "Extreme",
                            maxString: "Relaxed",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How ready do you feel to train?",
                            value: $checkInScore.readiness,
                            minString: "Not Ready",
                            maxString: "Very Ready",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "How excited do you feel about today's session?",
                            value: $checkInScore.excitement,
                            minString: "Not Excited",
                            maxString: "Very Excited",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        SliderSection(
                            colorScheme: colorScheme,
                            title: "Rate last night's sleep quality",
                            value: $checkInScore.sleep,
                            minString: "Poor",
                            maxString: "Great",
                            minValue: 1,
                            maxValue: 5,
                            inverseColorRating: false
                        )
                        
                        TextFieldSection(
                            field: $checkInScore.concerns,
                            title: "What concerns or worries do you have going into today's session?",
                            colorScheme: colorScheme,
                            keyword: "concerns"
                        )
                        
                        FormSubmitButton(
                            title: "Submit Check-In",
                            icon: "checkmark.circle.fill",
                            isLoading: vm.isLoading,
                            isEnabled: checkInScore.hasCompletedForm
                        ) {
                            Task {
                                let success = await vm.submitCheckIn(
                                    checkInScore: checkInScore,
                                    selectedLift: vm.selectedLift,
                                    selectedIntensity: vm.selectedIntensity,
                                    userId: clerk.user?.id ?? ""
                                )
                                
                                if success {
                                    AnalyticsManager.shared.trackCheckInSubmitted(lift: vm.selectedLift, intensity: vm.selectedIntensity, overallScore: checkInScore.overallScore)
                                    vm.navigateToConfirmation = true
                                }
                            }
                        }
                    }
                }
            }
            .navigationDestination(isPresented: $vm.navigateToConfirmation) {
                CheckinConfirmation(checkInScore: checkInScore, selectedLift: $vm.selectedLift, selectedIntensity: $vm.selectedIntensity)
            }
            .navigationTitle("Daily Check-In")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                AnalyticsManager.shared.trackScreenView("CheckInView")
            }
        }
    }
}

struct FormSubmitButton: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var icon: String
    var isLoading: Bool
    var isEnabled: Bool
    var accentColor: Color = blueEnergy
    var action: () -> Void
    
    var body: some View {
        Button {
            action()
        } label: {
            HStack(spacing: 10) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: icon)
                        .font(.subheadline.weight(.semibold))
                    Text(title)
                        .font(.headline.weight(.semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .foregroundStyle(.white)
            .background(
                LinearGradient(
                    colors: isEnabled
                        ? [accentColor, accentColor.opacity(0.85)]
                        : [Color.gray.opacity(0.5), Color.gray.opacity(0.4)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: isEnabled ? accentColor.opacity(0.3) : Color.clear, radius: 8, x: 0, y: 4)
        }
        .disabled(!isEnabled || isLoading)
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 30)
    }
}

#Preview {
    struct CheckInView_PreviewContainer: View {
        @State private var checkInScore = CheckInScore()
        
        var body: some View {
            CheckInView(checkInScore: checkInScore)
        }
    }
    
    return CheckInView_PreviewContainer()
}
