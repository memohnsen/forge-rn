//
//  WorkoutReflectionView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk

struct WorkoutReflectionView: View {
    @AppStorage("userSport") private var userSport: String = ""
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    @Environment(\.clerk) private var clerk
    @State private var vm = ViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
                        DatePickerSection(title: "Session Date:", selectedDate: $vm.sessionDate)
                        
                        MultipleChoiceSection(colorScheme: colorScheme, title: "What time of day did you train?", arrayOptions: vm.timesOfDay, selected: $vm.timeOfDay)
                        
                        if userSport == "Olympic Weightlifting" {
                            MultipleChoiceSection(
                                colorScheme: colorScheme,
                                title: "What was the main movement for the session?",
                                arrayOptions: vm.liftOptionsWL,
                                selected: $vm.selectedLift
                            )
                        } else {
                            MultipleChoiceSection(
                                colorScheme: colorScheme,
                                title: "What was the main movement for the session?",
                                arrayOptions: vm.liftOptionsPL,
                                selected: $vm.selectedLift
                            )
                        }
                        
                        MultipleChoiceSection(
                            colorScheme: colorScheme,
                            title: "What was the intensity for the session?",
                            arrayOptions: vm.intensityOptions,
                            selected: $vm.selectedIntensity
                        )
                        
                        SliderSection(colorScheme: colorScheme, title: "How hard did this session feel?", value: $vm.sessionRPE, minString: "Easy", maxString: "Almost Died", minValue: 1, maxValue: 5, inverseColorRating: true)
                        
                        SliderSection(colorScheme: colorScheme, title: "How did your movement quality feel?", value: $vm.movementQuality, minString: "Poor", maxString: "Excellent", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How was your focus during the session?", value: $vm.focus, minString: "Distracted", maxString: "Locked In", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        MultipleChoiceSection(colorScheme: colorScheme, title: "How many lifts did you miss?", arrayOptions: vm.missQuantity, selected: $vm.misses)
                        
                        TextFieldSection(field: $vm.cues, title: "What cues made a difference?", colorScheme: colorScheme, keyword: "cues")
                        
                        SliderSection(colorScheme: colorScheme, title: "How does your body feel now?", value: $vm.feeling, minString: "Beat Up", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How satisfied do you feel with this session?", value: $vm.satisfaction, minString: "Not Satisfied", maxString: "Very Satisfied", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How confident do you feel after this session?", value: $vm.confidence, minString: "Not Confident", maxString: "Very Confident", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        TextFieldSection(field: $vm.whatLearned, title: "Did you learn anything about yourself during this session?", colorScheme: colorScheme, keyword: "learning")
                        
                        TextFieldSection(field: $vm.whatWouldChange, title: "Would you do anything differently next time?", colorScheme: colorScheme, keyword: "improvement")
                        
                        FormSubmitButton(
                            title: "Submit Session Review",
                            icon: "checkmark.circle.fill",
                            isLoading: vm.isLoading,
                            isEnabled: vm.hasCompletedForm
                        ) {
                            let report: SessionReport = SessionReport(
                                user_id: clerk.user?.id ?? "",
                                session_date: vm.sessionDate.formatted(.iso8601.year().month().day().dateSeparator(.dash)),
                                time_of_day: vm.timeOfDay,
                                session_rpe: vm.sessionRPE,
                                movement_quality: vm.movementQuality,
                                focus: vm.focus,
                                misses: vm.misses,
                                cues: vm.cues,
                                feeling: vm.feeling,
                                satisfaction: vm.satisfaction,
                                confidence: vm.confidence,
                                what_learned: vm.whatLearned,
                                what_would_change: vm.whatWouldChange,
                                selected_lift: vm.selectedLift,
                                selected_intensity: vm.selectedIntensity,
                                created_at: vm.iso8601String
                            )
                            
                            Task {
                                await vm.submitSessionReport(sessionReport: report)
                                AnalyticsManager.shared.trackSessionReflectionSubmitted(lift: vm.selectedLift, intensity: vm.selectedIntensity, rpe: vm.sessionRPE)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Session Reflection")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                AnalyticsManager.shared.trackScreenView("WorkoutReflectionView")
            }
            .alert(vm.alertTitle, isPresented: $vm.alertShown) {
                Button("OK") {
                    dismiss()
                }
            } message: {
                Text(vm.alertMessage)
            }
        }
    }
}


#Preview {
    WorkoutReflectionView()
}
