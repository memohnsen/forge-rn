//
//  AllHistoryView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk

struct HistoryDetailsView: View {
    @AppStorage("userSport") private var userSport: String = ""
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.clerk) private var clerk
    @Environment(\.dismiss) private var dismiss
    @State private var vm = ViewModel()
    
    var title: String
    var searchTerm: String
    var selection: String
    var date: String
    var reportId: Int?
    
    var isOuraConnected: Bool {
        guard let userId = clerk.user?.id else { return false }
        return vm.ouraService.getAccessToken(userId: userId) != nil
    }
    
    var isWhoopConnected: Bool {
        guard let userId = clerk.user?.id else { return false }
        return vm.whoopService.getAccessToken(userId: userId) != nil
    }
    
    var pageTitle: String {
        if selection == "Meets" {
            return vm.comp.first?.meet ?? "Loading..."
        } else if selection == "Workouts" {
            return (vm.session.first?.selected_intensity ?? "Loading") + " " + (vm.session.first?.selected_lift ?? "...")
        } else {
            return (vm.checkin.first?.selected_intensity ?? "Loading") + " " + (vm.checkin.first?.selected_lift ?? "...")
        }
    }

    var body: some View {
        NavigationStack{
            ZStack{
                BackgroundColor()
                
                if vm.isLoading || (selection == "Meets" && vm.comp.isEmpty) || (selection == "Workouts" && vm.session.isEmpty) || (selection != "Meets" && selection != "Workouts" && vm.checkin.isEmpty) {
                    ScrollView {
                        VStack {
                            HistoryDetailsLoadingView()
                        }
                        .padding(.bottom, 30)
                    }
                } else {
                    ScrollView{
                        VStack{
                            if selection == "Meets" {
                                CompDisplaySection(vm: vm, userSport: userSport, colorScheme: colorScheme, ouraSleepData: vm.ouraSleepData, whoopData: vm.whoopData)
                            } else if selection == "Workouts" {
                                SessionDisplaySection(vm: vm, userSport: userSport, colorScheme: colorScheme, ouraSleepData: vm.ouraSleepData, whoopData: vm.whoopData)
                            } else {
                                CheckInDisplaySection(vm: vm, colorScheme: colorScheme, ouraSleepData: vm.ouraSleepData, whoopData: vm.whoopData)
                            }
                        }
                        .padding(.bottom, 30)
                    }
                }
            }
            .navigationTitle(pageTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
            .toolbar {
                ToolbarItem{
                    if vm.isEditMode {
                        if #available(iOS 26.0, *) {
                            Button(role: .confirm) {
                                Task {
                                    if selection == "Meets" {
                                        await vm.updateCompReport(userSport: userSport)
                                    } else if selection == "Workouts" {
                                        await vm.updateSessionReport()
                                    } else {
                                        await vm.updateCheckIn()
                                    }
                                }
                            } label: {
                                if vm.isSaving {
                                    ProgressView()
                                } else {
                                    Text("Save")
                                        .bold()
                                }
                            }
                        } else {
                            Button {
                                Task {
                                    if selection == "Meets" {
                                        await vm.updateCompReport(userSport: userSport)
                                    } else if selection == "Workouts" {
                                        await vm.updateSessionReport()
                                    } else {
                                        await vm.updateCheckIn()
                                    }
                                }
                            } label: {
                                if vm.isSaving {
                                    ProgressView()
                                } else {
                                    Text("Save")
                                        .bold()
                                }
                            }
                        }
                    }
                }
                ToolbarItem {
                    if !vm.isEditMode {
                        Menu {
                            ShareLink(item: vm.shareTextResult(selection: selection, userSport: userSport), subject: Text("Share Your Results")) {
                                Label("Share Your Results", systemImage: "square.and.arrow.up")
                            }
                            
                            Button {
                                if selection == "Meets" {
                                    vm.initializeEditableComp()
                                } else if selection == "Workouts" {
                                    vm.initializeEditableSession()
                                } else {
                                    vm.initializeEditableCheckIn()
                                }
                                vm.isEditMode = true
                            } label: {
                                Label("Edit", systemImage: "pencil")
                            }
    
                            Button(role: .destructive) {
                                Task {
                                    if selection == "Meets" {
                                        await vm.deleteCompReport(reportId: vm.comp.first?.id ?? 0)
                                        AnalyticsManager.shared.trackCompReflectionDeleted(compId: vm.comp.first?.id ?? 0)
                                    } else if selection == "Workouts" {
                                        await vm.deleteSessionReport(reportId: vm.session.first?.id ?? 0)
                                        AnalyticsManager.shared.trackSessionReflectionDeleted(sessionId: vm.session.first?.id ?? 0)
                                    } else {
                                        await vm.deleteCheckIn(checkInId: vm.checkin.first?.id ?? 0)
                                        AnalyticsManager.shared.trackCheckInDeleted(checkInId: vm.checkin.first?.id ?? 0)
                                    }
                                    dismiss()
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        } label: {
                            Image(systemName: "ellipsis")
                        }
                    }
                }
            }
            .alert(vm.alertTitle, isPresented: $vm.alertShown) {
                Button("OK") {}
            } message: {
                Text(vm.alertMessage)
            }
            .task {
                AnalyticsManager.shared.trackScreenView("HistoryDetailsView")

                if isOuraConnected {
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd"
                    if let targetDate = dateFormatter.date(from: date) {
                        do {
                            let calendar = Calendar.current
                            let startDate = calendar.date(byAdding: .day, value: -2, to: targetDate) ?? targetDate
                            let endDate = calendar.date(byAdding: .day, value: 1, to: targetDate) ?? targetDate
                            
                            let sleepData = try await vm.ouraService.fetchDailySleep(
                                userId: clerk.user?.id ?? "",
                                startDate: startDate,
                                endDate: endDate
                            )
                            
                            vm.ouraSleepData = sleepData.first { sleepRecord in
                                sleepRecord.day == date
                            }
                            
                            if vm.ouraSleepData == nil {
                                print("⚠️ No Oura data found for date: \(date) (searched \(sleepData.count) records)")
                            } else {
                                print("✅ Found Oura data for date: \(date)")
                            }
                        } catch {
                            print("❌ Error fetching Oura data: \(error)")
                            vm.ouraSleepData = nil
                        }
                    } else {
                        print("⚠️ Could not parse date: \(date)")
                    }
                } else {
                    vm.ouraSleepData = nil
                }
                
                print("🔍 [HistoryDetailsView] Checking WHOOP connection status")
                if isWhoopConnected {
                    print("✅ [HistoryDetailsView] WHOOP is connected, fetching data")
                    let dateFormatter = DateFormatter()
                    dateFormatter.dateFormat = "yyyy-MM-dd"
                    if let targetDate = dateFormatter.date(from: date) {
                        do {
                            print("📅 [HistoryDetailsView] Target date: \(date)")
                            let calendar = Calendar.current
                            let startDate = calendar.date(byAdding: .day, value: -2, to: targetDate) ?? targetDate
                            let endDate = calendar.date(byAdding: .day, value: 1, to: targetDate) ?? targetDate
                            
                            print("📅 [HistoryDetailsView] Fetching WHOOP data from \(startDate) to \(endDate)")
                            
                            async let recoveryData = vm.whoopService.fetchRecovery(
                                userId: clerk.user?.id ?? "",
                                startDate: startDate,
                                endDate: endDate
                            )
                            
                            async let sleepData = vm.whoopService.fetchSleep(
                                userId: clerk.user?.id ?? "",
                                startDate: startDate,
                                endDate: endDate
                            )
                            
                            async let cycleData = vm.whoopService.fetchCycle(
                                userId: clerk.user?.id ?? "",
                                startDate: startDate,
                                endDate: endDate
                            )
                            
                            let (recoveries, sleeps, cycles) = try await (recoveryData, sleepData, cycleData)
                            
                            print("📊 [HistoryDetailsView] Fetched \(recoveries.count) recovery records, \(sleeps.count) sleep records, \(cycles.count) cycle records")
                            
                            let dateOnlyFormatter = DateFormatter()
                            dateOnlyFormatter.dateFormat = "yyyy-MM-dd"
                            
                            let targetDateString = dateOnlyFormatter.string(from: targetDate)
                            print("🔍 [HistoryDetailsView] Looking for data matching date: \(targetDateString)")
                            
                            let matchingRecovery = recoveries.first { recovery in
                                let isoFormatter = ISO8601DateFormatter()
                                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                                if let recoveryDate = isoFormatter.date(from: recovery.start) {
                                    let recoveryDateString = dateOnlyFormatter.string(from: recoveryDate)
                                    return recoveryDateString == targetDateString
                                }
                                return false
                            }
                            
                            let matchingSleep = sleeps.first { sleep in
                                let isoFormatter = ISO8601DateFormatter()
                                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                                if let sleepDate = isoFormatter.date(from: sleep.start) {
                                    let sleepDateString = dateOnlyFormatter.string(from: sleepDate)
                                    return sleepDateString == targetDateString
                                }
                                return false
                            }
                            
                            let matchingCycle = cycles.first { cycle in
                                let isoFormatter = ISO8601DateFormatter()
                                isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
                                if let cycleDate = isoFormatter.date(from: cycle.start) {
                                    let cycleDateString = dateOnlyFormatter.string(from: cycleDate)
                                    return cycleDateString == targetDateString
                                }
                                return false
                            }
                            
                            if matchingRecovery != nil || matchingSleep != nil || matchingCycle != nil {
                                vm.whoopData = WhoopDailyData(
                                    recovery: matchingRecovery,
                                    sleep: matchingSleep,
                                    cycle: matchingCycle
                                )
                                print("✅ [HistoryDetailsView] Found WHOOP data for date: \(date)")
                            } else {
                                print("⚠️ [HistoryDetailsView] No WHOOP data found for date: \(date)")
                                vm.whoopData = nil
                            }
                        } catch {
                            print("❌ [HistoryDetailsView] Error fetching WHOOP data: \(error)")
                            print("❌ [HistoryDetailsView] Error details: \(error.localizedDescription)")
                            vm.whoopData = nil
                        }
                    } else {
                        print("⚠️ [HistoryDetailsView] Could not parse date: \(date)")
                        vm.whoopData = nil
                    }
                } else {
                    print("ℹ️ [HistoryDetailsView] WHOOP is not connected")
                    vm.whoopData = nil
                }
                
                if selection == "Meets" {
                    await vm.fetchCompDetails(user_id: clerk.user?.id ?? "", title: title, date: date)
                } else if selection == "Workouts" {
                    await vm.fetchSessionDetails(user_id: clerk.user?.id ?? "", title: searchTerm, date: date)
                } else {
                    await vm.fetchCheckInDetails(user_id: clerk.user?.id ?? "", title: searchTerm, date: date)
                }
            }
        }
    }
}

struct ResultsDisplaySection: View {
    @Environment(\.colorScheme) var colorScheme
    var comp: [CompReport]
    var userSport: String
    
    var body: some View {
        VStack(spacing: 0) {
            if userSport == "Olympic Weightlifting" {
                LiftResultRow(
                    liftName: "Snatch",
                    attempt1: comp.first?.snatch1 ?? "0",
                    attempt2: comp.first?.snatch2 ?? "0",
                    attempt3: comp.first?.snatch3 ?? "0",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
                
                Divider()
                    .padding(.horizontal, 16)
                
                LiftResultRow(
                    liftName: "Clean & Jerk",
                    attempt1: comp.first?.cj1 ?? "0",
                    attempt2: comp.first?.cj2 ?? "0",
                    attempt3: comp.first?.cj3 ?? "0",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
            } else {
                LiftResultRow(
                    liftName: "Squat",
                    attempt1: comp.first?.squat1 ?? "0",
                    attempt2: comp.first?.squat2 ?? "0",
                    attempt3: comp.first?.squat3 ?? "0",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
                
                Divider()
                    .padding(.horizontal, 16)
                
                LiftResultRow(
                    liftName: "Bench",
                    attempt1: comp.first?.bench1 ?? "0",
                    attempt2: comp.first?.bench2 ?? "0",
                    attempt3: comp.first?.bench3 ?? "0",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
                
                Divider()
                    .padding(.horizontal, 16)
                
                LiftResultRow(
                    liftName: "Deadlift",
                    attempt1: comp.first?.deadlift1 ?? "0",
                    attempt2: comp.first?.deadlift2 ?? "0",
                    attempt3: comp.first?.deadlift3 ?? "0",
                    accentColor: gold,
                    colorScheme: colorScheme
                )
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: gold.opacity(0.1), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [gold.opacity(0.25), gold.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}

struct LiftResultRow: View {
    var liftName: String
    var attempt1: String
    var attempt2: String
    var attempt3: String
    var accentColor: Color
    var colorScheme: ColorScheme
    
    var body: some View {
        HStack {
            Text(liftName)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(accentColor)
                .frame(width: 90, alignment: .leading)
            
            Spacer()
            
            HStack(spacing: 16) {
                AttemptBadge(weight: attempt1, colorScheme: colorScheme)
                AttemptBadge(weight: attempt2, colorScheme: colorScheme)
                AttemptBadge(weight: attempt3, colorScheme: colorScheme)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

struct AttemptBadge: View {
    var weight: String
    var colorScheme: ColorScheme
    
    var isGood: Bool {
        !weight.hasPrefix("-") && !weight.hasPrefix("X") && weight != "0"
    }
    
    var displayWeight: String {
        if weight.hasPrefix("-") {
            return String(weight.dropFirst()) + "kg"
        }
        return weight + "kg"
    }
    
    var body: some View {
        Text(displayWeight)
            .font(.caption.weight(.medium))
            .foregroundStyle(isGood ? (colorScheme == .light ? .black : .white) : .secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isGood ? ratingGreen.opacity(0.15) : Color.gray.opacity(0.1))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isGood ? ratingGreen.opacity(0.3) : Color.clear, lineWidth: 1)
            )
    }
}

private let ratingGreen = Color(red: 90/255, green: 180/255, blue: 140/255)
private let ratingOrange = Color(red: 255/255, green: 180/255, blue: 80/255)
private let ratingRed = Color(red: 220/255, green: 100/255, blue: 100/255)

struct RatingDisplaySection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var value: String
    
    var colorByRating: Color {
        if title == "How many lifts did you miss?" || title == "Misses" {
            if Int(value) ?? 0 <= 1 {
                ratingGreen
            } else if Int(value) ?? 2 == 2 {
                ratingOrange
            } else {
                ratingRed
            }
        } else if title == "How hard did this session feel?" || title == "How sore does your body feel?" {
            if Int(value) ?? 3 <= 2 {
                ratingGreen
            } else if Int(value) ?? 3 == 3 {
                ratingOrange
            } else {
                ratingRed
            }
        } else if title == "Sleep Duration" || title == "HRV" || title == "Readiness Score" || title == "Average Heart Rate" || title == "Recovery Score" || title == "Sleep Performance" || title == "Strain Score" || title == "Resting Heart Rate" {
            blueEnergy
        } else {
            if Int(value) ?? 3 <= 2 {
                ratingRed
            } else if Int(value) ?? 3 == 3 {
                ratingOrange
            } else {
                ratingGreen
            }
        }
    }
    
    var isRawValue: Bool {
        title == "How many lifts did you miss?" || title == "Overall Readiness" || title == "Physical Readiness" || title == "Mental Readiness" || title == "Sleep Duration" || title == "HRV" || title == "Readiness Score" || title == "Average Heart Rate" || title == "Total" || title == "Misses" || title == "Recovery Score" || title == "Sleep Performance" || title == "Strain Score" || title == "Resting Heart Rate"
    }
    
    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineLimit(2)
            
            ZStack {
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [colorByRating.opacity(0.3), colorByRating.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 4
                    )
                    .frame(width: 90, height: 90)
                
                Text(isRawValue ? value : "\(value)/5")
                    .font(.system(size: isRawValue ? 22 : 24, weight: .bold, design: .rounded))
                    .foregroundStyle(colorByRating)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: colorByRating.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [colorByRating.opacity(0.2), colorByRating.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}

struct TextDisplaySection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var value: String
    
    private var displayValue: String {
        value.isEmpty ? "—" : value
    }
    
    private var valueColor: Color {
        if value.isEmpty {
            return .gray
        }
        return colorScheme == .light ? .black : .white
    }
    
    private var cardFill: Color {
        colorScheme == .light ? .white : Color(white: 0.1)
    }
    
    private var borderColor: Color {
        colorScheme == .light ? Color.black.opacity(0.04) : Color.white.opacity(0.06)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)
            
            Text(displayValue)
                .font(.body)
                .foregroundStyle(valueColor)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(cardFill)
                .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(borderColor, lineWidth: 1)
        )
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}

struct CompDisplaySection: View {
    @Bindable var vm: HistoryDetailsView.ViewModel
    var userSport: String
    var colorScheme: ColorScheme
    var ouraSleepData: OuraSleep?
    var whoopData: WhoopDailyData?
    
    var body: some View {
        if vm.isEditMode {
            VStack{
                Text("Which meet did you compete at?")
                    .font(.headline.bold())
                    .padding(.bottom, 6)
                
                TextField("Enter your meet...", text: $vm.editMeet)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(blueEnergy.opacity(0.1))
                    )
            }
            .cardStyling()
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What type of meet was this?", arrayOptions: vm.meetTypeOptions, selected: $vm.editSelectedMeetType)
            
            DatePickerSection(title: "Meet Date:", selectedDate: $vm.editMeetDate)
            
            TextFieldSection(field: $vm.editBodyweight, title: "What was your bodyweight?", colorScheme: colorScheme, keyword: "bodyweight")
            
            if userSport == "Olympic Weightlifting" {
                WLLiftResultsSection(snatch1: $vm.editSnatch1, snatch2: $vm.editSnatch2, snatch3: $vm.editSnatch3, cj1: $vm.editCj1, cj2: $vm.editCj2, cj3: $vm.editCj3)
            } else {
                PLLiftResultsSection(squat1: $vm.editSquat1, squat2: $vm.editSquat2, squat3: $vm.editSquat3, bench1: $vm.editBench1, bench2: $vm.editBench2, bench3: $vm.editBench3, deadlift1: $vm.editDeadlift1, deadlift2: $vm.editDeadlift2, deadlift3: $vm.editDeadlift3)
            }
            
            SliderSection(colorScheme: colorScheme, title: "How would you rate your performance?", value: $vm.editPerformanceRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How prepared did you feel physically going into the meet?", value: $vm.editPhysicalPreparednessRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How prepared did you feel mentally going into the meet?", value: $vm.editMentalPreparednessRating, minString: "Poor", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How did you handle pressure during the meet?", value: $vm.editPressureHandling, minString: "Poorly", maxString: "Very Well", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How satisfied do you feel with this meet?", value: $vm.editCompSatisfaction, minString: "Not Satisfied", maxString: "Very Satisfied", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How confident do you feel after this meet?", value: $vm.editCompConfidence, minString: "Not Confident", maxString: "Very Confident", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            TextFieldSection(field: $vm.editNutrition, title: "What was your nutrition like during the meet?", colorScheme: colorScheme, keyword: "nutrition")
            
            TextFieldSection(field: $vm.editHydration, title: "What was your hydration like during the meet?", colorScheme: colorScheme, keyword: "hydration")
            
            TextFieldSection(field: $vm.editDidWell, title: "What did you do well?", colorScheme: colorScheme, keyword: "thoughts")
            
            TextFieldSection(field: $vm.editWhatProudOf, title: "What are you most proud of from this meet?", colorScheme: colorScheme, keyword: "pride")
            
            TextFieldSection(field: $vm.editGoodFromTraining, title: "What in training helped you feel prepared for the platform?", colorScheme: colorScheme, keyword: "thoughts")
            
            TextFieldSection(field: $vm.editCompCues, title: "What cues worked best for you?", colorScheme: colorScheme, keyword: "cues")
            
            TextFieldSection(field: $vm.editCompWhatLearned, title: "What did you learn about yourself during this meet?", colorScheme: colorScheme, keyword: "learning")
            
            TextFieldSection(field: $vm.editNeedsWork, title: "What could you have done better?", colorScheme: colorScheme, keyword: "thoughts")
            
            TextFieldSection(field: $vm.editCompFocus, title: "What do you need to focus on for the next meet?", colorScheme: colorScheme, keyword: "focus")
        } else {
            ResultsDisplaySection(comp: vm.comp, userSport: userSport)
                .padding(.top)
            
            if userSport == "Olympic Weightlifting" {
                RatingDisplaySection(title: "Total", value: ("\((vm.comp.first?.snatch_best ?? 0) + (vm.comp.first?.cj_best ?? 0))kg"))
            } else {
                RatingDisplaySection(title: "Total", value:("\((vm.comp.first?.squat_best ?? 0) + (vm.comp.first?.bench_best ?? 0) + (vm.comp.first?.deadlift_best ?? 0))kg"))
            }
                    
            TextDisplaySection(title: "Bodyweight", value: "\(vm.comp.first?.bodyweight ?? "")")
            
            RatingDisplaySection(title: "How would you rate your performance?", value: "\(vm.comp.first?.performance_rating ?? 0)")
            
            RatingDisplaySection(title: "How would you rate your physical preparedness?", value: "\(vm.comp.first?.physical_preparedness_rating ?? 0)")
            
            RatingDisplaySection(title: "How would you rate your mental preparedness?", value: "\(vm.comp.first?.mental_preparedness_rating ?? 0)")

            TextDisplaySection(title: "How was your nutrition?", value: "\(vm.comp.first?.nutrition ?? "")")
            
            TextDisplaySection(title: "How was your hydration?", value: "\(vm.comp.first?.hydration ?? "")")
            
            TextDisplaySection(title: "What did you do well?", value: "\(vm.comp.first?.did_well ?? "")")

            TextDisplaySection(title: "What could you have done better?", value: "\(vm.comp.first?.needs_work ?? "")")
            
            TextDisplaySection(title: "What in training helped you feel prepared for the platform?", value: "\(vm.comp.first?.good_from_training ?? "")")

            TextDisplaySection(title: "What cues worked best for you?", value: "\(vm.comp.first?.cues ?? "")")
            
            RatingDisplaySection(title: "How satisfied do you feel with this meet?", value: "\(vm.comp.first?.satisfaction ?? 0)")
            
            RatingDisplaySection(title: "How confident do you feel after this meet?", value: "\(vm.comp.first?.confidence ?? 0)")
            
            RatingDisplaySection(title: "How did you handle pressure during the meet?", value: "\(vm.comp.first?.pressure_handling ?? 0)")
            
            TextDisplaySection(title: "What did you learn about yourself during this meet?", value: "\(vm.comp.first?.what_learned ?? "")")
            
            TextDisplaySection(title: "What are you most proud of from this meet?", value: "\(vm.comp.first?.what_proud_of ?? "")")
            
            TextDisplaySection(title: "What do you need to focus on for the next meet?", value: "\(vm.comp.first?.focus ?? "")")
                        
            if let ouraData = ouraSleepData {
                if let sleepHours = ouraData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let hrv = ouraData.averageHrv {
                    RatingDisplaySection(title: "HRV", value: String(format: "%.0f ms", hrv))
                }
                
                if let readinessScore = ouraData.readinessScore {
                    RatingDisplaySection(title: "Readiness Score", value: "\(readinessScore)")
                }
                
                if let avgHeartRate = ouraData.averageHeartRate {
                    RatingDisplaySection(title: "Average Heart Rate", value: String(format: "%.0f bpm", avgHeartRate))
                }
            }
            
            if let whoopData = whoopData {
                if let recoveryScore = whoopData.recoveryScore {
                    RatingDisplaySection(title: "Recovery Score", value: "\(recoveryScore)%")
                }
                
                if let sleepHours = whoopData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let sleepPerformance = whoopData.sleepPerformance {
                    RatingDisplaySection(title: "Sleep Performance", value: "\(sleepPerformance)%")
                }
                
                if let strainScore = whoopData.strainScore {
                    RatingDisplaySection(title: "Strain Score", value: String(format: "%.1f", strainScore))
                }
                
                if let hrv = whoopData.hrvMs {
                    RatingDisplaySection(title: "HRV", value: "\(hrv) ms")
                }
                
                if let restingHeartRate = whoopData.restingHeartRate {
                    RatingDisplaySection(title: "Resting Heart Rate", value: "\(restingHeartRate) bpm")
                }
            }
        }
    }
}

struct SessionDisplaySection: View {
    @Bindable var vm: HistoryDetailsView.ViewModel
    var userSport: String
    var colorScheme: ColorScheme
    var ouraSleepData: OuraSleep?
    var whoopData: WhoopDailyData?
    
    var liftOptions: [String] {
        userSport == "Olympic Weightlifting" ? vm.liftOptionsWL : vm.liftOptionsPL
    }
    
    var body: some View {
        if vm.isEditMode {
            DatePickerSection(title: "Session Date:", selectedDate: $vm.editSessionDate)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What time of day did you train?", arrayOptions: vm.timesOfDay, selected: $vm.editTimeOfDay)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What was the main movement for the session?", arrayOptions: liftOptions, selected: $vm.editSelectedLift)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What was the intensity for the session?", arrayOptions: vm.intensityOptions, selected: $vm.editSelectedIntensity)
            
            SliderSection(colorScheme: colorScheme, title: "How hard did this session feel?", value: $vm.editSessionRPE, minString: "Easy", maxString: "Almost Died", minValue: 1, maxValue: 5, inverseColorRating: true)
            
            SliderSection(colorScheme: colorScheme, title: "How did your movement quality feel?", value: $vm.editMovementQuality, minString: "Poor", maxString: "Excellent", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How was your focus during the session?", value: $vm.editSessionFocus, minString: "Distracted", maxString: "Locked In", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "How many lifts did you miss?", arrayOptions: vm.missQuantity, selected: $vm.editMisses)
            
            TextFieldSection(field: $vm.editSessionCues, title: "What cues made a difference?", colorScheme: colorScheme, keyword: "cues")
            
            SliderSection(colorScheme: colorScheme, title: "How does your body feel now?", value: $vm.editFeeling, minString: "Beat Up", maxString: "Amazing", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How satisfied do you feel with this session?", value: $vm.editSessionSatisfaction, minString: "Not Satisfied", maxString: "Very Satisfied", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How confident do you feel after this session?", value: $vm.editSessionConfidence, minString: "Not Confident", maxString: "Very Confident", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            TextFieldSection(field: $vm.editSessionWhatLearned, title: "Did you learn anything about yourself during this session?", colorScheme: colorScheme, keyword: "learning")
            
            TextFieldSection(field: $vm.editWhatWouldChange, title: "Would you do anything differently next time?", colorScheme: colorScheme, keyword: "improvement")
        } else {
            TextDisplaySection(title: "Time of day you trained", value: "\(vm.session.first?.time_of_day ?? "")")
            
            RatingDisplaySection(title: "How hard did this session feel?", value: "\(vm.session.first?.session_rpe ?? 0)")
            
            RatingDisplaySection(title: "How did your movement quality feel?", value: "\(vm.session.first?.movement_quality ?? 0)")

            RatingDisplaySection(title: "How was your focus during the session?", value: "\(vm.session.first?.focus ?? 0)")

            RatingDisplaySection(title: "How many lifts did you miss?", value: "\(vm.session.first?.misses ?? "")")

            TextDisplaySection(title: "What cues made a difference?", value: "\(vm.session.first?.cues ?? "")")

            RatingDisplaySection(title: "How does your body feel now?", value: "\(vm.session.first?.feeling ?? 0)")
            
            RatingDisplaySection(title: "How satisfied do you feel with this session?", value: "\(vm.session.first?.satisfaction ?? 0)")
            
            RatingDisplaySection(title: "How confident do you feel after this session?", value: "\(vm.session.first?.confidence ?? 0)")
            
            TextDisplaySection(title: "Did you learn anything about yourself during this session?", value: "\(vm.session.first?.what_learned ?? "")")
            
            TextDisplaySection(title: "Would you do anything differently next time?", value: "\(vm.session.first?.what_would_change ?? "")")
                
            if let ouraData = ouraSleepData {
                if let sleepHours = ouraData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let hrv = ouraData.averageHrv {
                    RatingDisplaySection(title: "HRV", value: String(format: "%.0f ms", hrv))
                }
                
                if let readinessScore = ouraData.readinessScore {
                    RatingDisplaySection(title: "Readiness Score", value: "\(readinessScore)")
                }
                
                if let avgHeartRate = ouraData.averageHeartRate {
                    RatingDisplaySection(title: "Average Heart Rate", value: String(format: "%.0f bpm", avgHeartRate))
                }
            }
            
            if let whoopData = whoopData {
                if let recoveryScore = whoopData.recoveryScore {
                    RatingDisplaySection(title: "Recovery Score", value: "\(recoveryScore)%")
                }
                
                if let sleepHours = whoopData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let sleepPerformance = whoopData.sleepPerformance {
                    RatingDisplaySection(title: "Sleep Performance", value: "\(sleepPerformance)%")
                }
                
                if let strainScore = whoopData.strainScore {
                    RatingDisplaySection(title: "Strain Score", value: String(format: "%.1f", strainScore))
                }
                
                if let hrv = whoopData.hrvMs {
                    RatingDisplaySection(title: "HRV", value: "\(hrv) ms")
                }
                
                if let restingHeartRate = whoopData.restingHeartRate {
                    RatingDisplaySection(title: "Resting Heart Rate", value: "\(restingHeartRate) bpm")
                }
            }
        }
    }
}

struct CheckInDisplaySection: View {
    @Bindable var vm: HistoryDetailsView.ViewModel
    var colorScheme: ColorScheme
    var ouraSleepData: OuraSleep?
    var whoopData: WhoopDailyData?
    
    var body: some View {
        if vm.isEditMode {
            DatePickerSection(title: "Session date:", selectedDate: $vm.editCheckInDate)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What's the main movement for the session?", arrayOptions: vm.liftOptionsWL, selected: $vm.editCheckInSelectedLift)
            
            MultipleChoiceSection(colorScheme: colorScheme, title: "What's the intensity for the session?", arrayOptions: vm.intensityOptions, selected: $vm.editCheckInSelectedIntensity)
            
            TextFieldSection(field: $vm.editGoal, title: "What would make today feel like a successful session for you?", colorScheme: colorScheme, keyword: "goal")
            
            SliderSection(colorScheme: colorScheme, title: "How strong does your body feel?", value: $vm.editPhysicalStrength, minString: "Weak", maxString: "Strong", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How recovered do you feel?", value: $vm.editRecovered, minString: "Not At All", maxString: "Very", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How energized do you feel?", value: $vm.editEnergy, minString: "Low", maxString: "High", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How sore does your body feel?", value: $vm.editSoreness, minString: "None", maxString: "Extreme", minValue: 1, maxValue: 5, inverseColorRating: true)
            
            SliderSection(colorScheme: colorScheme, title: "How connected do you feel to your body?", value: $vm.editBodyConnection, minString: "Disconnected", maxString: "Very Connected", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How strong does your mind feel?", value: $vm.editMentalStrength, minString: "Weak", maxString: "Strong", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How confident do you feel?", value: $vm.editCheckInConfidence, minString: "Not At All", maxString: "Very", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How focused do you feel?", value: $vm.editCheckInFocus, minString: "Distracted", maxString: "Very Focused", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How stressed do you feel?", value: $vm.editStress, minString: "Extreme", maxString: "Relaxed", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How ready do you feel to train?", value: $vm.editReadiness, minString: "Not Ready", maxString: "Very Ready", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "How excited do you feel about today's session?", value: $vm.editExcitement, minString: "Not Excited", maxString: "Very Excited", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            SliderSection(colorScheme: colorScheme, title: "Rate last night's sleep quality", value: $vm.editSleep, minString: "Poor", maxString: "Great", minValue: 1, maxValue: 5, inverseColorRating: false)
            
            TextFieldSection(field: $vm.editConcerns, title: "What concerns or worries do you have going into today's session?", colorScheme: colorScheme, keyword: "concerns")
        } else {
            RatingDisplaySection(title: "Overall Readiness", value: "\(vm.checkin.first?.overall_score ?? 0)%")
            
            RatingDisplaySection(title: "Physical Readiness", value: "\(vm.checkin.first?.physical_score ?? 0)%")
            
            RatingDisplaySection(title: "Mental Readiness", value: "\(vm.checkin.first?.mental_score ?? 0)%")
            
            TextDisplaySection(title: "What would make today feel like a successful session for you?", value: "\(vm.checkin.first?.goal ?? "")")

            RatingDisplaySection(title: "How strong does your body feel?", value: "\(vm.checkin.first?.physical_strength ?? 0)")
            
            RatingDisplaySection(title: "How strong does your mind feel?", value: "\(vm.checkin.first?.mental_strength ?? 0)")
            
            RatingDisplaySection(title: "How recovered do you feel?", value: "\(vm.checkin.first?.recovered ?? 0)")
            
            RatingDisplaySection(title: "How confident do you feel?", value: "\(vm.checkin.first?.confidence ?? 0)")

            RatingDisplaySection(title: "Rate last night's sleep quality", value: "\(vm.checkin.first?.sleep ?? 0)")
            
            RatingDisplaySection(title: "How energized do you feel?", value: "\(vm.checkin.first?.energy ?? 0)")
            
            RatingDisplaySection(title: "How stressed do you feel?", value: "\(vm.checkin.first?.stress ?? 0)")
            
            RatingDisplaySection(title: "How sore does your body feel?", value: "\(vm.checkin.first?.soreness ?? 0)")
            
            RatingDisplaySection(title: "How ready do you feel to train?", value: "\(vm.checkin.first?.readiness ?? 0)")
            
            RatingDisplaySection(title: "How focused do you feel?", value: "\(vm.checkin.first?.focus ?? 0)")
            
            RatingDisplaySection(title: "How excited do you feel about today's session?", value: "\(vm.checkin.first?.excitement ?? 0)")
            
            RatingDisplaySection(title: "How connected do you feel to your body?", value: "\(vm.checkin.first?.body_connection ?? 0)")
            
            TextDisplaySection(title: "What concerns or worries do you have going into today's session?", value: "\(vm.checkin.first?.concerns ?? "")")
                
            if let ouraData = ouraSleepData {
                if let sleepHours = ouraData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let hrv = ouraData.averageHrv {
                    RatingDisplaySection(title: "HRV", value: String(format: "%.0f ms", hrv))
                }
                
                if let readinessScore = ouraData.readinessScore {
                    RatingDisplaySection(title: "Readiness Score", value: "\(readinessScore)")
                }
                
                if let avgHeartRate = ouraData.averageHeartRate {
                    RatingDisplaySection(title: "Average Heart Rate", value: String(format: "%.0f bpm", avgHeartRate))
                }
            }
            
            if let whoopData = whoopData {
                if let recoveryScore = whoopData.recoveryScore {
                    RatingDisplaySection(title: "Recovery Score", value: "\(recoveryScore)%")
                }
                
                if let sleepHours = whoopData.sleepDurationHours {
                    RatingDisplaySection(title: "Sleep Duration", value: String(format: "%.1f hrs", sleepHours))
                }
                
                if let sleepPerformance = whoopData.sleepPerformance {
                    RatingDisplaySection(title: "Sleep Performance", value: "\(sleepPerformance)%")
                }
                
                if let strainScore = whoopData.strainScore {
                    RatingDisplaySection(title: "Strain Score", value: String(format: "%.1f", strainScore))
                }
                
                if let hrv = whoopData.hrvMs {
                    RatingDisplaySection(title: "HRV", value: "\(hrv) ms")
                }
                
                if let restingHeartRate = whoopData.restingHeartRate {
                    RatingDisplaySection(title: "Resting Heart Rate", value: "\(restingHeartRate) bpm")
                }
            }
        }
    }
}

struct HistoryDetailsLoadingView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var isAnimating: Bool = false
    
    var body: some View {
        ForEach(1...5, id: \.self) { index in
            VStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 6)
                    .fill(colorScheme == .dark ? Color.white.opacity(isAnimating ? 0.15 : 0.05) : Color.gray.opacity(isAnimating ? 0.2 : 0.08))
                    .frame(width: 180, height: 16)
                
                Circle()
                    .stroke(colorScheme == .dark ? Color.white.opacity(isAnimating ? 0.15 : 0.05) : Color.gray.opacity(isAnimating ? 0.2 : 0.08), lineWidth: 4)
                    .frame(width: 90, height: 90)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .padding(.horizontal, 16)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(colorScheme == .light ? .white : Color(white: 0.1))
            )
            .padding(.horizontal)
            .padding(.bottom, 8)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

#Preview {
    HistoryDetailsView(title: "American Open Finals", searchTerm: "American Open Finals", selection: "Workouts", date: "2025-12-26", reportId: 1)
}
