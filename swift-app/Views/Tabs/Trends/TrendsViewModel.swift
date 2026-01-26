//
//  TrendsViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/10/26.
//

import Foundation
import Supabase
import SwiftUI

enum ChartID: String, CaseIterable {
    case checkInOverall = "checkInOverall"
    case checkInPhysical = "checkInPhysical"
    case checkInMental = "checkInMental"
    case checkInPhysicalStrength = "checkInPhysicalStrength"
    case checkInMentalStrength = "checkInMentalStrength"
    case checkInRecovered = "checkInRecovered"
    case checkInConfidence = "checkInConfidence"
    case checkInSleep = "checkInSleep"
    case checkInEnergy = "checkInEnergy"
    case checkInStress = "checkInStress"
    case checkInSoreness = "checkInSoreness"
    case checkInReadiness = "checkInReadiness"
    case checkInFocus = "checkInFocus"
    case checkInExcitement = "checkInExcitement"
    case checkInBodyConnection = "checkInBodyConnection"
    case workoutRPE = "workoutRPE"
    case workoutMovementQuality = "workoutMovementQuality"
    case workoutFocus = "workoutFocus"
    case workoutMisses = "workoutMisses"
    case workoutFeeling = "workoutFeeling"
    case workoutSatisfaction = "workoutSatisfaction"
    case workoutConfidence = "workoutConfidence"
    case meetPerformance = "meetPerformance"
    case meetPhysicalPreparedness = "meetPhysicalPreparedness"
    case meetMentalPreparedness = "meetMentalPreparedness"
    case meetTotal = "meetTotal"
    case meetSatisfaction = "meetSatisfaction"
    case meetConfidence = "meetConfidence"
    case meetPressureHandling = "meetPressureHandling"
    case meetBodyweight = "meetBodyweight"
    case meetSnatchBest = "meetSnatchBest"
    case meetCJBest = "meetCJBest"
    case meetSquatBest = "meetSquatBest"
    case meetBenchBest = "meetBenchBest"
    case meetDeadliftBest = "meetDeadliftBest"
    case ouraSleep = "ouraSleep"
    case ouraHRV = "ouraHRV"
    case ouraHeartRate = "ouraHeartRate"
    case ouraReadiness = "ouraReadiness"
    case whoopRecovery = "whoopRecovery"
    case whoopSleep = "whoopSleep"
    case whoopSleepPerformance = "whoopSleepPerformance"
    case whoopStrain = "whoopStrain"
    case whoopHRV = "whoopHRV"
    case whoopRestingHeartRate = "whoopRestingHeartRate"
    
    var displayName: String {
        switch self {
        case .checkInOverall: return "Overall Readiness"
        case .checkInPhysical: return "Physical Readiness"
        case .checkInMental: return "Mental Readiness"
        case .checkInPhysicalStrength: return "Physical Strength"
        case .checkInMentalStrength: return "Mental Strength"
        case .checkInRecovered: return "Recovery"
        case .checkInConfidence: return "Confidence"
        case .checkInSleep: return "Sleep Quality"
        case .checkInEnergy: return "Energy"
        case .checkInStress: return "Stress"
        case .checkInSoreness: return "Soreness"
        case .checkInReadiness: return "Readiness"
        case .checkInFocus: return "Focus"
        case .checkInExcitement: return "Excitement"
        case .checkInBodyConnection: return "Body Connection"
        case .workoutRPE: return "Session RPE"
        case .workoutMovementQuality: return "Movement Quality"
        case .workoutFocus: return "Focus"
        case .workoutMisses: return "Misses"
        case .workoutFeeling: return "Feeling"
        case .workoutSatisfaction: return "Satisfaction"
        case .workoutConfidence: return "Confidence"
        case .meetPerformance: return "Performance Rating"
        case .meetPhysicalPreparedness: return "Physical Preparedness"
        case .meetMentalPreparedness: return "Mental Preparedness"
        case .meetTotal: return "Total"
        case .meetSatisfaction: return "Satisfaction"
        case .meetConfidence: return "Confidence"
        case .meetPressureHandling: return "Pressure Handling"
        case .meetBodyweight: return "Bodyweight"
        case .meetSnatchBest: return "Snatch Best"
        case .meetCJBest: return "Clean & Jerk Best"
        case .meetSquatBest: return "Squat Best"
        case .meetBenchBest: return "Bench Best"
        case .meetDeadliftBest: return "Deadlift Best"
        case .ouraSleep: return "Sleep Duration"
        case .ouraHRV: return "HRV"
        case .ouraHeartRate: return "Average Heart Rate"
        case .ouraReadiness: return "Readiness Score"
        case .whoopRecovery: return "Recovery Score"
        case .whoopSleep: return "Sleep Duration"
        case .whoopSleepPerformance: return "Sleep Performance"
        case .whoopStrain: return "Strain Score"
        case .whoopHRV: return "HRV"
        case .whoopRestingHeartRate: return "Resting Heart Rate"
        }
    }
    
    var category: String {
        switch self {
        case .checkInOverall, .checkInPhysical, .checkInMental, .checkInPhysicalStrength, .checkInMentalStrength, .checkInRecovered, .checkInConfidence, .checkInSleep, .checkInEnergy, .checkInStress, .checkInSoreness, .checkInReadiness, .checkInFocus, .checkInExcitement, .checkInBodyConnection:
            return "Check-Ins"
        case .workoutRPE, .workoutMovementQuality, .workoutFocus, .workoutMisses, .workoutFeeling, .workoutSatisfaction, .workoutConfidence:
            return "Workouts"
        case .meetPerformance, .meetPhysicalPreparedness, .meetMentalPreparedness, .meetTotal, .meetSatisfaction, .meetConfidence, .meetPressureHandling, .meetBodyweight, .meetSnatchBest, .meetCJBest, .meetSquatBest, .meetBenchBest, .meetDeadliftBest:
            return "Meets"
        case .ouraSleep, .ouraHRV, .ouraHeartRate, .ouraReadiness:
            return "Oura"
        case .whoopRecovery, .whoopSleep, .whoopSleepPerformance, .whoopStrain, .whoopHRV, .whoopRestingHeartRate:
            return "Whoop"
        }
    }
    
    static var allIDs: Set<String> {
        Set(ChartID.allCases.map { $0.rawValue })
    }
    
    static func charts(for category: String) -> [ChartID] {
        ChartID.allCases.filter { $0.category == category }
    }
}

@Observable
class TrendsViewModel {
    var aiModel = OpenRouter()
    var ouraService = Oura()
    var whoopService = Whoop()
    
    var checkIns: [DailyCheckIn] = []
    var compReport: [CompReport] = []
    var sessionReport: [SessionReport] = []
    var whoopData: [WhoopDailyData] = []
    var ouraSleepData: [OuraSleep] = []
    var isLoading: Bool = false
    var isLoadingOuraData: Bool = false
    var isLoadingWhoopData: Bool = false
    
    var aiShown: Bool = false
    
    var selectedFilter: String = "Check-Ins"
    var selectedTimeFrame: String = "Last 30 Days"
    
    private let selectedChartsKey = "selectedCharts"
    var selectedCharts: Set<String> = ChartID.allIDs {
        didSet {
            if let encoded = try? JSONEncoder().encode(Array(selectedCharts)) {
                UserDefaults.standard.set(encoded, forKey: selectedChartsKey)
            }
        }
    }
    
    init() {
        if let data = UserDefaults.standard.data(forKey: selectedChartsKey),
           let decoded = try? JSONDecoder().decode([String].self, from: data) {
            self.selectedCharts = Set(decoded)
        }
    }
    
    func toggleChart(_ chartID: ChartID) {
        if selectedCharts.contains(chartID.rawValue) {
            selectedCharts.remove(chartID.rawValue)
        } else {
            selectedCharts.insert(chartID.rawValue)
        }
    }
    
    func isChartSelected(_ chartID: ChartID) -> Bool {
        selectedCharts.contains(chartID.rawValue)
    }
    
    func hasSelectedCharts(for category: String) -> Bool {
        ChartID.charts(for: category).contains { isChartSelected($0) }
    }
    
    // MARK: - OPENROUTER
    var prompt: String {
        return """
            Task: You are a sports data analyst specializing in Olympic Weightlifting and Powerlifting. You specialize in finding trends in large amounts of data. The following is the data we have on the athlete, I need you to analyze the data and find possible trends and return a response that will instruct the athlete on your findings. You are receiving data for an athlete's pre-lift check-ins, post-lift check-ins, and meet reflections. You should begin your process by matching the data and ordering by date to get a clear trend across the individual.
            
            Data Type: Daily check-in data performed prior to their lifting session. The overall score is a function of the physical and mental scores which are functions of the other 1-5 scale scores. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc. The only time this isn't the case is for soreness, 1 is none, 5 is extreme.
            
            Data: \(checkIns)
            
            Data Type: Post-session reflection data after each lifting session. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc. The only time this isn't the case is for how hard was the session, 1 is easy, 5 is very hard.
            
            Data: \(sessionReport)
            
            Data Type: Post-competition reflection data. 1 is always a poor value, 5 is always considered a good value, stress of 5 means relaxed, etc.
            
            Data: \(compReport)
            
            Data Type: Oura Ring wearable device data.
            
            Data: \(ouraSleepData)
            
            Data Type: WHOOP wearable device data. Recovery score (0-100%), sleep duration (hours), sleep performance (0-100%), strain score (0-21), HRV (milliseconds), resting heart rate (bpm).
            
            Data: \(whoopData)
                        
            Response Format:
            - No emojis
            - Do not include any greetings, get straight to the data
            - 250 words or less
            - No more than 4 sentences per section
            - Write as plain text, with each section of data formatted with an asterik to mark it as a bullet point
            - Do not include any recommendations or draw conclusions, only comment on trends
            """
    }
    
    // MARK: - DATA FETCHING
    func fetchAllData(user: String?, isOuraConnected: Bool, isWhoopConnected: Bool) async {
        AnalyticsManager.shared.trackScreenView("TrendsView")
        await fetchCheckins(user_id: user ?? "")
        await fetchCompReports(user_id: user ?? "")
        await fetchSessionReport(user_id: user ?? "")
        
        if let userId = user {
            ouraService.checkConnectionStatus(userId: userId)
            whoopService.checkConnectionStatus(userId: userId)
            if isOuraConnected && selectedFilter == "Oura" {
                await fetchOuraData(user: user)
            }
            if isWhoopConnected && selectedFilter == "Whoop" {
                await fetchWhoopData(user: user)
            }
        }
    }

    func fetchOuraData(user: String?) async {
        guard let userId = user else { return }
        
        isLoadingOuraData = true
        defer { isLoadingOuraData = false }
        
        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .year, value: -5, to: now) ?? now
        
        do {
            let sleepResult = try await ouraService.fetchDailySleep(userId: userId, startDate: startDate, endDate: now)
            ouraSleepData = sleepResult
        } catch {
            ouraSleepData = []
        }
    }
    
    func fetchWhoopData(user: String?) async {
        guard let userId = user else { return }
        
        isLoadingWhoopData = true
        defer { isLoadingWhoopData = false }
        
        let calendar = Calendar.current
        let now = Date()
        let startDate = calendar.date(byAdding: .year, value: -5, to: now) ?? now
        
        do {
            let combinedData = try await whoopService.fetchDailyData(
                userId: userId,
                startDate: startDate,
                endDate: now
            )
            whoopData = combinedData
        } catch {
            print("Error fetching WHOOP data: \(error)")
            whoopData = []
        }
    }
    
    func fetchCheckins(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_daily_checkins")
                .select()
                .eq("user_id", value: user_id)
                .order("check_in_date", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([DailyCheckIn].self, from: response.data)
            
            self.checkIns.removeAll()
            self.checkIns = row
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch {
            print("Error: \(error.localizedDescription)")
            print("Full error: \(error)")
        }
        
        isLoading = false
    }
    
    func fetchCompReports(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_comp_report")
                .select()
                .eq("user_id", value: user_id)
                .order("meet_date", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([CompReport].self, from: response.data)
            
            self.compReport.removeAll()
            self.compReport = row
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch {
            print("Error: \(error.localizedDescription)")
            print("Full error: \(error)")
        }
        
        isLoading = false
    }
    
    func fetchSessionReport(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_session_report")
                .select()
                .eq("user_id", value: user_id)
                .order("session_date", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([SessionReport].self, from: response.data)
            
            self.sessionReport.removeAll()
            self.sessionReport = row
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
        } catch {
            print("Error: \(error.localizedDescription)")
            print("Full error: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - CHARTS
    func aggregateAllData<T>(
        data: [T],
        dateExtractor: (T) -> String,
        scoreExtractor: (T) -> Double
    ) -> [AggregatedDataPoint] {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        return data.compactMap { item in
            if let date = dateFormatter.date(from: dateExtractor(item)) {
                return AggregatedDataPoint(date: date, averageScore: scoreExtractor(item))
            }
            return nil
        }.sorted { $0.date < $1.date }
    }
    
    func aggregateChartData<T>(
        data: [T],
        dateExtractor: (T) -> String,
        scoreExtractor: (T) -> Double
    ) -> [AggregatedDataPoint] {
        let calendar = Calendar.current
        let now = Date()
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
        let cutoffDate: Date
        switch selectedTimeFrame {
        case "Last 30 Days":
            cutoffDate = calendar.date(byAdding: .day, value: -30, to: now) ?? now
        case "Last 90 Days":
            cutoffDate = calendar.date(byAdding: .day, value: -90, to: now) ?? now
        case "Last 6 Months":
            cutoffDate = calendar.date(byAdding: .month, value: -6, to: now) ?? now
        case "Last 1 Year":
            cutoffDate = calendar.date(byAdding: .year, value: -1, to: now) ?? now
        case "All Time":
            cutoffDate = Date.distantPast
        default:
            cutoffDate = calendar.date(byAdding: .day, value: -30, to: now) ?? now
        }
        
        let filteredData = data.filter { item in
            if let itemDate = dateFormatter.date(from: dateExtractor(item)) {
                return itemDate >= cutoffDate
            }
            return false
        }

        let shouldAggregate: Bool
        let groupingComponent: Calendar.Component
        
        switch selectedTimeFrame {
        case "Last 30 Days":
            shouldAggregate = false
            groupingComponent = .day
        case "Last 90 Days":
            shouldAggregate = true
            groupingComponent = .weekOfYear
        case "Last 6 Months", "Last 1 Year", "All Time":
            shouldAggregate = true
            groupingComponent = .month
        default:
            shouldAggregate = false
            groupingComponent = .day
        }
        
        if !shouldAggregate {
            return filteredData.compactMap { item in
                if let date = dateFormatter.date(from: dateExtractor(item)) {
                    return AggregatedDataPoint(date: date, averageScore: scoreExtractor(item))
                }
                return nil
            }
        } else {
            var groupedData: [DateComponents: [Double]] = [:]
            
            for item in filteredData {
                if let date = dateFormatter.date(from: dateExtractor(item)) {
                    let components: DateComponents
                    if groupingComponent == .weekOfYear {
                        components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
                    } else {
                        components = calendar.dateComponents([.year, .month], from: date)
                    }
                    
                    if groupedData[components] == nil {
                        groupedData[components] = []
                    }
                    groupedData[components]?.append(scoreExtractor(item))
                }
            }
            
            return groupedData.compactMap { (components, scores) in
                let average = scores.reduce(0.0, +) / Double(scores.count)
                
                var representativeDate: Date?
                if groupingComponent == .weekOfYear {
                    representativeDate = calendar.date(from: components)
                } else {
                    var monthComponents = components
                    monthComponents.day = 1
                    representativeDate = calendar.date(from: monthComponents)
                }
                
                if let date = representativeDate {
                    return AggregatedDataPoint(date: date, averageScore: average)
                }
                return nil
            }.sorted { $0.date < $1.date }
        }
    }
    
    // MARK: - COMP CHARTS
    var compPerformanceChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.performance_rating) },
        )
    }

    var compPhysicalPreparednessChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.physical_preparedness_rating) },
        )
    }
    
    var compMentalPreparednessChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.mental_preparedness_rating) },
        )
    }

    var compWLTotalChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double(($0.snatch_best ?? 0) + ($0.cj_best ?? 0)) },
        )
    }

    var compPLTotalChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double(($0.squat_best ?? 0) + ($0.bench_best ?? 0) + ($0.deadlift_best ?? 0)) },
        )
    }
    
    var compSatisfactionChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.satisfaction) }
        )
    }
    
    var compConfidenceChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.confidence) }
        )
    }
    
    var compPressureHandlingChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.pressure_handling) }
        )
    }
    
    var compBodyweightChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport,
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.bodyweight) ?? 0.0 }
        )
    }
    
    var compSnatchBestChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport.filter { $0.snatch_best != nil },
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.snatch_best ?? 0) }
        )
    }
    
    var compCJBestChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport.filter { $0.cj_best != nil },
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.cj_best ?? 0) }
        )
    }
    
    var compSquatBestChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport.filter { $0.squat_best != nil },
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.squat_best ?? 0) }
        )
    }
    
    var compBenchBestChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport.filter { $0.bench_best != nil },
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.bench_best ?? 0) }
        )
    }
    
    var compDeadliftBestChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: compReport.filter { $0.deadlift_best != nil },
            dateExtractor: { $0.meet_date },
            scoreExtractor: { Double($0.deadlift_best ?? 0) }
        )
    }
    
    // MARK: - SESSION CHARTS
    var sessionRPEChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.session_rpe) },
        )
    }
    
    var sessionMovementQualityChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.movement_quality) },
        )
    }
    
    var sessionFocusChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.focus) },
        )
    }
    
    var sessionMissesChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.misses) ?? 0.0 },
        )
    }
    
    var sessionFeelingChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.feeling) }
        )
    }
    
    var sessionSatisfactionChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.satisfaction) }
        )
    }
    
    var sessionConfidenceChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: sessionReport,
            dateExtractor: { $0.session_date },
            scoreExtractor: { Double($0.confidence) }
        )
    }
    
    // MARK: - CHECK-INS CHARTS
    var checkInOverallScoreChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.overall_score) },
        )
    }
    
    var checkInPhysicalScoreChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.physical_score) },
        )
    }
    
    var checkInMentalScoreChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.mental_score) },
        )
    }
    
    var checkInPhysicalStrengthChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.physical_strength) }
        )
    }
    
    var checkInMentalStrengthChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.mental_strength) }
        )
    }
    
    var checkInRecoveredChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.recovered) }
        )
    }
    
    var checkInConfidenceChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.confidence) }
        )
    }
    
    var checkInSleepChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.sleep) }
        )
    }
    
    var checkInEnergyChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.energy) }
        )
    }
    
    var checkInStressChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.stress) }
        )
    }
    
    var checkInSorenessChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.soreness) }
        )
    }
    
    var checkInReadinessChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.readiness) }
        )
    }
    
    var checkInFocusChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.focus) }
        )
    }
    
    var checkInExcitementChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.excitement) }
        )
    }
    
    var checkInBodyConnectionChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: checkIns,
            dateExtractor: { $0.check_in_date },
            scoreExtractor: { Double($0.body_connection) }
        )
    }

    // MARK: - OURA CHARTS
    var sleepChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: ouraSleepData,
            dateExtractor: { $0.day },
            scoreExtractor: { Double($0.sleepDurationHours ?? 0) }
        )
    }
    
    var ouraHRVChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: ouraSleepData,
            dateExtractor: { $0.day },
            scoreExtractor: { Double($0.hrv ?? 0) }
        )
    }
    
    var heartRateChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: ouraSleepData,
            dateExtractor: { $0.day },
            scoreExtractor: { Double($0.averageHeartRate ?? 0) }
        )
    }
    
    var readinessChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: ouraSleepData,
            dateExtractor: { $0.day },
            scoreExtractor: { Double($0.readinessScore ?? 0) }
        )
    }
    
    // MARK: - WHOOP CHARTS
    var recoveryChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.recoveryScore ?? 0) }
        )
    }
    
    var sleepDurationChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.sleepDurationHours ?? 0) }
        )
    }
    
    var sleepPerformanceChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.sleepPerformance ?? 0) }
        )
    }
    
    var strainChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.strainScore ?? 0) }
        )
    }
    
    var whoopHRVChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.hrvMs ?? 0) }
        )
    }
    
    var restingHeartRateChartData: [AggregatedDataPoint] {
        aggregateChartData(
            data: whoopData,
            dateExtractor: { $0.date },
            scoreExtractor: { Double($0.restingHeartRate ?? 0) }
        )
    }
    
    // MARK: - ALL DATA (UNFILTERED)
    var allCheckInOverallScoreData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.overall_score) })
    }
    
    var allCheckInPhysicalScoreData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.physical_score) })
    }
    
    var allCheckInMentalScoreData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.mental_score) })
    }
    
    var allSessionRPEData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.session_rpe) })
    }
    
    var allSessionMovementQualityData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.movement_quality) })
    }
    
    var allSessionFocusData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.focus) })
    }
    
    var allSessionMissesData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.misses) ?? 0.0 })
    }
    
    var allCompPerformanceData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.performance_rating) })
    }
    
    var allCompPhysicalPreparednessData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.physical_preparedness_rating) })
    }
    
    var allCompMentalPreparednessData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.mental_preparedness_rating) })
    }
    
    var allCompWLTotalData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double(($0.snatch_best ?? 0) + ($0.cj_best ?? 0)) })
    }
    
    var allCompPLTotalData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double(($0.squat_best ?? 0) + ($0.bench_best ?? 0) + ($0.deadlift_best ?? 0)) })
    }
    
    var allSleepData: [AggregatedDataPoint] {
        aggregateAllData(data: ouraSleepData, dateExtractor: { $0.day }, scoreExtractor: { Double($0.sleepDurationHours ?? 0) })
    }
    
    var allOuraHRVData: [AggregatedDataPoint] {
        aggregateAllData(data: ouraSleepData, dateExtractor: { $0.day }, scoreExtractor: { Double($0.hrv ?? 0) })
    }
    
    var allHeartRateData: [AggregatedDataPoint] {
        aggregateAllData(data: ouraSleepData, dateExtractor: { $0.day }, scoreExtractor: { Double($0.averageHeartRate ?? 0) })
    }
    
    var allReadinessData: [AggregatedDataPoint] {
        aggregateAllData(data: ouraSleepData, dateExtractor: { $0.day }, scoreExtractor: { Double($0.readinessScore ?? 0) })
    }
    
    var allRecoveryData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.recoveryScore ?? 0) })
    }
    
    var allSleepDurationData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.sleepDurationHours ?? 0) })
    }
    
    var allSleepPerformanceData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.sleepPerformance ?? 0) })
    }
    
    var allStrainData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.strainScore ?? 0) })
    }
    
    var allWhoopHRVData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.hrvMs ?? 0) })
    }
    
    var allRestingHeartRateData: [AggregatedDataPoint] {
        aggregateAllData(data: whoopData, dateExtractor: { $0.date }, scoreExtractor: { Double($0.restingHeartRate ?? 0) })
    }
    
    var allCheckInPhysicalStrengthData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.physical_strength) })
    }
    
    var allCheckInMentalStrengthData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.mental_strength) })
    }
    
    var allCheckInRecoveredData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.recovered) })
    }
    
    var allCheckInConfidenceData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.confidence) })
    }
    
    var allCheckInSleepData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.sleep) })
    }
    
    var allCheckInEnergyData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.energy) })
    }
    
    var allCheckInStressData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.stress) })
    }
    
    var allCheckInSorenessData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.soreness) })
    }
    
    var allCheckInReadinessData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.readiness) })
    }
    
    var allCheckInFocusData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.focus) })
    }
    
    var allCheckInExcitementData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.excitement) })
    }
    
    var allCheckInBodyConnectionData: [AggregatedDataPoint] {
        aggregateAllData(data: checkIns, dateExtractor: { $0.check_in_date }, scoreExtractor: { Double($0.body_connection) })
    }
    
    var allSessionFeelingData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.feeling) })
    }
    
    var allSessionSatisfactionData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.satisfaction) })
    }
    
    var allSessionConfidenceData: [AggregatedDataPoint] {
        aggregateAllData(data: sessionReport, dateExtractor: { $0.session_date }, scoreExtractor: { Double($0.confidence) })
    }
    
    var allCompSatisfactionData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.satisfaction) })
    }
    
    var allCompConfidenceData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.confidence) })
    }
    
    var allCompPressureHandlingData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.pressure_handling) })
    }
    
    var allCompBodyweightData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.bodyweight) ?? 0.0 })
    }
    
    var allCompSnatchBestData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport.filter { $0.snatch_best != nil }, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.snatch_best ?? 0) })
    }
    
    var allCompCJBestData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport.filter { $0.cj_best != nil }, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.cj_best ?? 0) })
    }
    
    var allCompSquatBestData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport.filter { $0.squat_best != nil }, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.squat_best ?? 0) })
    }
    
    var allCompBenchBestData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport.filter { $0.bench_best != nil }, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.bench_best ?? 0) })
    }
    
    var allCompDeadliftBestData: [AggregatedDataPoint] {
        aggregateAllData(data: compReport.filter { $0.deadlift_best != nil }, dateExtractor: { $0.meet_date }, scoreExtractor: { Double($0.deadlift_best ?? 0) })
    }
    
    func zonesForMetric(_ metricKey: String) -> [ZoneRange]? {
        switch metricKey {
        case "overallReadiness", "physicalReadiness", "mentalReadiness", "readinessScore", "recoveryScore", "sleepPerformance":
            return [
                ZoneRange(label: "Poor", minValue: 0, maxValue: 40, color: .red),
                ZoneRange(label: "Fair", minValue: 40, maxValue: 60, color: .orange),
                ZoneRange(label: "Average", minValue: 60, maxValue: 80, color: .yellow),
                ZoneRange(label: "Good", minValue: 80, maxValue: 100, color: .green)
            ]
        case "sessionRPE":
            return [
                ZoneRange(label: "Easy", minValue: 1, maxValue: 2, color: .green),
                ZoneRange(label: "Moderate", minValue: 2, maxValue: 3.5, color: .yellow),
                ZoneRange(label: "Hard", minValue: 3.5, maxValue: 5, color: .red)
            ]
        case "movementQuality", "focus", "performanceRating", "physicalPreparedness", "mentalPreparedness", "physicalStrength", "mentalStrength", "recovered", "confidence", "sleepQuality", "energy", "readiness", "excitement", "bodyConnection", "feeling", "satisfaction", "pressureHandling":
            return [
                ZoneRange(label: "Poor", minValue: 1, maxValue: 2, color: .red),
                ZoneRange(label: "Fair", minValue: 2, maxValue: 3, color: .orange),
                ZoneRange(label: "Average", minValue: 3, maxValue: 4, color: .yellow),
                ZoneRange(label: "Good", minValue: 4, maxValue: 5, color: .green)
            ]
        case "stress", "soreness":
            return [
                ZoneRange(label: "Low", minValue: 1, maxValue: 2, color: .green),
                ZoneRange(label: "Moderate", minValue: 2, maxValue: 3, color: .yellow),
                ZoneRange(label: "High", minValue: 3, maxValue: 4, color: .orange),
                ZoneRange(label: "Severe", minValue: 4, maxValue: 5, color: .red)
            ]
        case "hrv", "ouraHRV", "whoopHRV":
            return [
                ZoneRange(label: "Low", minValue: 0, maxValue: 40, color: .red),
                ZoneRange(label: "Below Avg", minValue: 40, maxValue: 80, color: .orange),
                ZoneRange(label: "Average", minValue: 80, maxValue: 120, color: .yellow),
                ZoneRange(label: "Good", minValue: 120, maxValue: 200, color: .green)
            ]
        case "restingHeartRate", "heartRate":
            return [
                ZoneRange(label: "Excellent", minValue: 20, maxValue: 45, color: .green),
                ZoneRange(label: "Good", minValue: 45, maxValue: 60, color: .yellow),
                ZoneRange(label: "Average", minValue: 60, maxValue: 70, color: .orange),
                ZoneRange(label: "High", minValue: 70, maxValue: 80, color: .red)
            ]
        case "sleepDuration", "ouraSleep", "whoopSleep":
            return [
                ZoneRange(label: "Poor", minValue: 0, maxValue: 5, color: .red),
                ZoneRange(label: "Fair", minValue: 5, maxValue: 6, color: .orange),
                ZoneRange(label: "Average", minValue: 6, maxValue: 7, color: .yellow),
                ZoneRange(label: "Good", minValue: 7, maxValue: 12, color: .green)
            ]
        case "strainScore":
            return [
                ZoneRange(label: "Light", minValue: 0, maxValue: 10, color: .green),
                ZoneRange(label: "Moderate", minValue: 10, maxValue: 18, color: .yellow),
                ZoneRange(label: "High", minValue: 18, maxValue: 21, color: .red)
            ]
        default:
            return nil
        }
    }
    
    func descriptiveTextForMetric(_ metricKey: String, value: Double, trend: TrendDirection, zone: ZoneRange?) -> String {
        let trendText: String
        switch trend {
        case .up:
            trendText = "trending upward"
        case .down:
            trendText = "trending downward"
        case .flat:
            trendText = "holding steady"
        }
        
        let zoneText = zone != nil ? "in the \(zone!.label.lowercased()) range" : ""
        
        switch metricKey {
        case "overallReadiness":
            return "Your overall readiness is \(zoneText) and \(trendText). This score reflects your combined physical and mental preparedness for training."
        case "physicalReadiness":
            return "Your physical readiness is \(zoneText) and \(trendText). This measures your body's preparation for physical demands."
        case "mentalReadiness":
            return "Your mental readiness is \(zoneText) and \(trendText). Mental preparation is key to peak performance."
        case "physicalStrength":
            return "Your physical strength is \(zoneText) and \(trendText). This reflects how strong and capable your body feels."
        case "mentalStrength":
            return "Your mental strength is \(zoneText) and \(trendText). Mental fortitude supports pushing through challenging sessions."
        case "recovered":
            return "Your recovery level is \(zoneText) and \(trendText). Adequate recovery is essential for adaptation and performance."
        case "confidence":
            return "Your confidence is \(zoneText) and \(trendText). Confidence impacts performance and approach to training."
        case "sleepQuality":
            return "Your sleep quality is \(zoneText) and \(trendText). Quality sleep supports recovery and cognitive function."
        case "energy":
            return "Your energy levels are \(zoneText) and \(trendText). Energy availability affects training intensity and focus."
        case "stress":
            return "Your stress levels are \(zoneText) and \(trendText). Managing stress supports recovery and performance."
        case "soreness":
            return "Your soreness is \(zoneText) and \(trendText). Monitoring soreness helps balance training load with recovery."
        case "readiness":
            return "Your readiness is \(zoneText) and \(trendText). This reflects how prepared you feel for training."
        case "excitement":
            return "Your excitement levels are \(zoneText) and \(trendText). Enthusiasm for training supports consistency and effort."
        case "bodyConnection":
            return "Your body connection is \(zoneText) and \(trendText). Awareness of your body supports movement quality and injury prevention."
        case "sessionRPE":
            return "Your session difficulty is \(zoneText) and \(trendText). Monitor this to balance training stress with recovery."
        case "movementQuality":
            return "Your movement quality is \(zoneText) and \(trendText). Quality movement patterns support performance and reduce injury risk."
        case "focus":
            return "Your focus levels are \(zoneText) and \(trendText). Mental engagement during training impacts skill development."
        case "misses":
            return "Your miss count is \(trendText). Tracking misses helps identify fatigue or technique issues."
        case "feeling":
            return "Your session feeling is \(zoneText) and \(trendText). How you feel during training reflects overall readiness."
        case "satisfaction":
            return "Your satisfaction is \(zoneText) and \(trendText). Session satisfaction indicates training quality and progress."
        case "performanceRating":
            return "Your competition performance rating is \(zoneText) and \(trendText)."
        case "physicalPreparedness":
            return "Your physical preparedness for competition is \(zoneText) and \(trendText)."
        case "mentalPreparedness":
            return "Your mental preparedness for competition is \(zoneText) and \(trendText)."
        case "total":
            return "Your competition total is \(trendText). Consistent training drives long-term progress."
        case "pressureHandling":
            return "Your pressure handling is \(zoneText) and \(trendText). Managing competition pressure is key to performing your best."
        case "bodyweight":
            return "Your competition bodyweight is \(trendText). Tracking weight helps manage weight class targets."
        case "snatchBest":
            return "Your best snatch is \(trendText). Track your competition PRs to measure progress."
        case "cjBest":
            return "Your best clean & jerk is \(trendText). Track your competition PRs to measure progress."
        case "squatBest":
            return "Your best squat is \(trendText). Track your competition PRs to measure progress."
        case "benchBest":
            return "Your best bench press is \(trendText). Track your competition PRs to measure progress."
        case "deadliftBest":
            return "Your best deadlift is \(trendText). Track your competition PRs to measure progress."
        case "sleepDuration", "ouraSleep", "whoopSleep":
            return "Your sleep duration is \(zoneText) and \(trendText). Quality sleep is essential for recovery and performance."
        case "hrv", "ouraHRV", "whoopHRV":
            return "Your HRV is \(zoneText) and \(trendText). Higher HRV generally indicates better recovery and readiness."
        case "heartRate", "restingHeartRate":
            return "Your resting heart rate is \(zoneText) and \(trendText). Lower resting heart rate typically indicates better cardiovascular fitness."
        case "readinessScore":
            return "Your readiness score is \(zoneText) and \(trendText). This reflects how prepared your body is for the day's demands."
        case "recoveryScore":
            return "Your recovery score is \(zoneText) and \(trendText). This indicates how well your body has recovered from recent strain."
        case "sleepPerformance":
            return "Your sleep performance is \(zoneText) and \(trendText). This measures how well you slept relative to your sleep need."
        case "strainScore":
            return "Your strain score is \(zoneText) and \(trendText). Balance strain with recovery for optimal adaptation."
        default:
            return "Your \(metricKey) is \(trendText)."
        }
    }
}

