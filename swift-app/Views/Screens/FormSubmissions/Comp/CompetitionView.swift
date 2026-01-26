//
//  CompReflectionView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk

struct CompReflectionView: View {
    @AppStorage("userSport") private var userSport: String = ""
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.clerk) private var clerk
    @State private var vm = ViewModel()
    
    var report: CompReport {
        if userSport == "Olympic Weightlifting" {
            return CompReport(user_id: clerk.user?.id ?? "", meet: vm.meet, selected_meet_type: vm.selectedMeetType, meet_date: vm.meetDate.formatted(.iso8601.year().month().day().dateSeparator(.dash)), bodyweight: vm.bodyweight, performance_rating: vm.performanceRating, physical_preparedness_rating: vm.physicalPreparednessRating, mental_preparedness_rating: vm.mentalPreparednessRating, nutrition: vm.nutrition, hydration: vm.hydration, did_well: vm.didWell, needs_work: vm.needsWork, good_from_training: vm.goodFromTraining, cues: vm.cues, focus: vm.focus, satisfaction: vm.satisfaction, confidence: vm.confidence, pressure_handling: vm.pressureHandling, what_learned: vm.whatLearned, what_proud_of: vm.whatProudOf, snatch1: vm.snatch1, snatch2: vm.snatch2, snatch3: vm.snatch3, cj1: vm.cj1, cj2: vm.cj2, cj3: vm.cj3, snatch_best: vm.calculateBest(lift1: vm.snatch1, lift2: vm.snatch2, lift3: vm.snatch3), cj_best: vm.calculateBest(lift1: vm.cj1, lift2: vm.cj2, lift3: vm.cj3), created_at: vm.iso8601String)
        } else {
            return CompReport(user_id: clerk.user?.id ?? "", meet: vm.meet, selected_meet_type: vm.selectedMeetType, meet_date: vm.meetDate.formatted(.iso8601.year().month().day().dateSeparator(.dash)), bodyweight: vm.bodyweight, performance_rating: vm.performanceRating, physical_preparedness_rating: vm.physicalPreparednessRating, mental_preparedness_rating: vm.mentalPreparednessRating, nutrition: vm.nutrition, hydration: vm.hydration, did_well: vm.didWell, needs_work: vm.needsWork, good_from_training: vm.goodFromTraining, cues: vm.cues, focus: vm.focus, satisfaction: vm.satisfaction, confidence: vm.confidence, pressure_handling: vm.pressureHandling, what_learned: vm.whatLearned, what_proud_of: vm.whatProudOf, squat1: vm.squat1, squat2: vm.squat2, squat3: vm.squat3, bench1: vm.bench1, bench2: vm.bench2, bench3: vm.bench3, deadlift1: vm.deadlift1, deadlift2: vm.deadlift2, deadlift3: vm.deadlift3, squat_best: vm.calculateBest(lift1: vm.squat1, lift2: vm.squat2, lift3: vm.squat3), bench_best: vm.calculateBest(lift1: vm.bench1, lift2: vm.bench2, lift3: vm.bench3), deadlift_best: vm.calculateBest(lift1: vm.deadlift1, lift2: vm.deadlift2, lift3: vm.deadlift3), created_at: vm.iso8601String)
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
                        MeetNameSection(meetName: $vm.meet, colorScheme: colorScheme)
                        
                        MultipleChoiceSection(colorScheme: colorScheme, title: "What type of meet was this?", arrayOptions: vm.meetType, selected: $vm.selectedMeetType)
                        
                        DatePickerSection(title: "Meet Date:", selectedDate: $vm.meetDate)
                        
                        TextFieldSection(field: $vm.bodyweight, title: "What was your bodyweight?", colorScheme: colorScheme, keyword: "bodyweight")
                        
                        if userSport == "Olympic Weightlifting" {
                            WLLiftResultsSection(snatch1: $vm.snatch1, snatch2: $vm.snatch2, snatch3: $vm.snatch3, cj1: $vm.cj1, cj2: $vm.cj2, cj3: $vm.cj3)
                        } else {
                            PLLiftResultsSection(squat1: $vm.squat1, squat2: $vm.squat2, squat3: $vm.squat3, bench1: $vm.bench1, bench2: $vm.bench2, bench3: $vm.bench3, deadlift1: $vm.deadlift1, deadlift2: $vm.deadlift2, deadlift3: $vm.deadlift3)
                        }
                        
                        SliderSection(colorScheme: colorScheme, title: "How would you rate your performance?", value: $vm.performanceRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How prepared did you feel physically going into the meet?", value: $vm.physicalPreparednessRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How prepared did you feel mentally going into the meet?", value: $vm.mentalPreparednessRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How did you handle pressure during the meet?", value: $vm.pressureHandling, minString: "Poorly", maxString: "Very Well", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How satisfied do you feel with this meet?", value: $vm.satisfaction, minString: "Not Satisfied", maxString: "Very Satisfied", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        SliderSection(colorScheme: colorScheme, title: "How confident do you feel after this meet?", value: $vm.confidence, minString: "Not Confident", maxString: "Very Confident", minValue: 1, maxValue: 5, inverseColorRating: false)
                        
                        TextFieldSection(field: $vm.nutrition, title: "What was your nutrition like during the meet?", colorScheme: colorScheme, keyword: "nutrition")
                        
                        TextFieldSection(field: $vm.hydration, title: "What was your hydration like during the meet?", colorScheme: colorScheme, keyword: "hydration")
                        
                        TextFieldSection(field: $vm.didWell, title: "What did you do well?", colorScheme: colorScheme, keyword: "thoughts")
                        
                        TextFieldSection(field: $vm.whatProudOf, title: "What are you most proud of from this meet?", colorScheme: colorScheme, keyword: "pride")
                        
                        TextFieldSection(field: $vm.goodFromTraining, title: "What in training helped you feel prepared for the platform?", colorScheme: colorScheme, keyword: "thoughts")
                        
                        TextFieldSection(field: $vm.cues, title: "What cues worked best for you?", colorScheme: colorScheme, keyword: "cues")
                        
                        TextFieldSection(field: $vm.whatLearned, title: "What did you learn about yourself during this meet?", colorScheme: colorScheme, keyword: "learning")
                        
                        TextFieldSection(field: $vm.needsWork, title: "What could you have done better?", colorScheme: colorScheme, keyword: "thoughts")
                        
                        TextFieldSection(field: $vm.focus, title: "What do you need to focus on for the next meet?", colorScheme: colorScheme, keyword: "focus")
                        
                        FormSubmitButton(
                            title: "Submit Comp Report",
                            icon: "trophy.fill",
                            isLoading: vm.isLoading,
                            isEnabled: vm.hasCompletedForm,
                            accentColor: gold
                        ) {
                            Task {
                                await vm.submitCompReport(compReport: report)
                                AnalyticsManager.shared.trackCompReflectionSubmitted(meetName: vm.meet, meetType: vm.selectedMeetType, performanceRating: vm.performanceRating)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Competition Report")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                AnalyticsManager.shared.trackScreenView("CompReflectionView")
            }
            .alert(vm.alertTitle, isPresented: $vm.alertShown) {} message: {
                Text(vm.alertMessage)
            }
        }
    }
}

struct MeetNameSection: View {
    @Binding var meetName: String
    var colorScheme: ColorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
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
                    
                    Image(systemName: "trophy.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(gold)
                }
                
                Text("Which meet did you compete at?")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            
            TextField("Enter your meet...", text: $meetName)
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
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .foregroundStyle(colorScheme == .light ? .black : .white)
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
    }
}

struct WLLiftResultsSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var snatch1: String
    @Binding var snatch2: String
    @Binding var snatch3: String
    @Binding var cj1: String
    @Binding var cj2: String
    @Binding var cj3: String
    
    func bindingForSnatch(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $snatch1
        case 1: return $snatch2
        default: return $snatch3
        }
    }
    
    func bindingForCJ(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $cj1
        case 1: return $cj2
        default: return $cj3
        }
    }
    
    func calculateTotal(snatch1: String, snatch2: String, snatch3: String, cj1: String, cj2: String, cj3: String) -> Int {
        let snatchBest = max(Int(snatch1) ?? 0, Int(snatch2) ?? 0, Int(snatch3) ?? 0)
        let cjBest = max(Int(cj1) ?? 0, Int(cj2) ?? 0, Int(cj3) ?? 0)
        
        return snatchBest + cjBest
    }
    
    var total: Int {
        calculateTotal(snatch1: snatch1, snatch2: snatch2, snatch3: snatch3, cj1: cj1, cj2: cj2, cj3: cj3)
    }
    
    var body: some View {
        VStack(spacing: 20) {
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
                    
                    Image(systemName: "scalemass.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(blueEnergy)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("What numbers did you hit?")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                    Text("Write a miss as a negative (ex: -115)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            LiftAttemptRow(liftName: "Snatch", attempt1: bindingForSnatch(0), attempt2: bindingForSnatch(1), attempt3: bindingForSnatch(2))
            
            LiftAttemptRow(liftName: "Clean & Jerk", attempt1: bindingForCJ(0), attempt2: bindingForCJ(1), attempt3: bindingForCJ(2))
            
            if total != 0 {
                HStack {
                    Text("Total")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(total)kg")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(gold)
                }
                .padding(.top, 4)
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
    }
}

struct PLLiftResultsSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var squat1: String
    @Binding var squat2: String
    @Binding var squat3: String
    @Binding var bench1: String
    @Binding var bench2: String
    @Binding var bench3: String
    @Binding var deadlift1: String
    @Binding var deadlift2: String
    @Binding var deadlift3: String
    
    func bindingForSquat(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $squat1
        case 1: return $squat2
        default: return $squat3
        }
    }
    
    func bindingForBench(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $bench1
        case 1: return $bench2
        default: return $bench3
        }
    }
    
    func bindingForDeadlift(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $deadlift1
        case 1: return $deadlift2
        default: return $deadlift3
        }
    }
    
    func calculateTotal(squat1: String, squat2: String, squat3: String, bench1: String, bench2: String, bench3: String, deadlift1: String, deadlift2: String, deadlift3: String) -> Int {
        let squatBest = max(Int(squat1) ?? 0, Int(squat2) ?? 0, Int(squat3) ?? 0)
        let benchBest = max(Int(bench1) ?? 0, Int(bench2) ?? 0, Int(bench3) ?? 0)
        let deadliftBest = max(Int(deadlift1) ?? 0, Int(deadlift2) ?? 0, Int(deadlift3) ?? 0)
        
        return squatBest + benchBest + deadliftBest
    }
    
    var total: Int {
        calculateTotal(squat1: squat1, squat2: squat2, squat3: squat3, bench1: bench1, bench2: bench2, bench3: bench3, deadlift1: deadlift1, deadlift2: deadlift2, deadlift3: deadlift3)
    }
    
    var body: some View {
        VStack(spacing: 20) {
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
                    
                    Image(systemName: "scalemass.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(blueEnergy)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text("What numbers did you hit?")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                    Text("Write a miss as a negative (ex: -115)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            LiftAttemptRow(liftName: "Squat", attempt1: bindingForSquat(0), attempt2: bindingForSquat(1), attempt3: bindingForSquat(2))
            
            LiftAttemptRow(liftName: "Bench", attempt1: bindingForBench(0), attempt2: bindingForBench(1), attempt3: bindingForBench(2))
            
            LiftAttemptRow(liftName: "Deadlift", attempt1: bindingForDeadlift(0), attempt2: bindingForDeadlift(1), attempt3: bindingForDeadlift(2))
            
            if total != 0 {
                HStack {
                    Text("Total")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("\(total)kg")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(blueEnergy)
                }
                .padding(.top, 4)
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
    }
}

struct LiftAttemptRow: View {
    @Environment(\.colorScheme) var colorScheme
    var liftName: String
    @Binding var attempt1: String
    @Binding var attempt2: String
    @Binding var attempt3: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(liftName)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(blueEnergy)
            
            HStack(spacing: 10) {
                ForEach(0..<3) { index in
                    TextField("\(index + 1)", text: bindingFor(index))
                        .font(.body.weight(.medium))
                        .multilineTextAlignment(.center)
                        .keyboardType(.numbersAndPunctuation)
                        .padding(.vertical, 12)
                        .padding(.horizontal, 8)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(
                                    LinearGradient(
                                        colors: [blueEnergy.opacity(0.08), blueEnergy.opacity(0.04)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(blueEnergy.opacity(0.15), lineWidth: 1)
                        )
                }
            }
        }
    }
    
    private func bindingFor(_ index: Int) -> Binding<String> {
        switch index {
        case 0: return $attempt1
        case 1: return $attempt2
        default: return $attempt3
        }
    }
}

#Preview {
    CompReflectionView()
}
