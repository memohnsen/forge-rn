//
//  StreakManager.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/11/26.
//

import Foundation

struct StreakData {
    var currentStreak: Int
    var longestStreak: Int
    var lastActivityDate: String?
    var isActive: Bool
    var daysUntilBreak: Int
    var completedToday: Bool
    var isTodayTrainingDay: Bool
}

class StreakManager {
    static let shared = StreakManager()
    
    private let calendar = Calendar.current
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    private let dayNameFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter
    }()
    
    private init() {}
    
    func calculateStreak(
        checkIns: [DailyCheckIn],
        sessionReports: [SessionReport],
        trainingDays: [String: String]
    ) -> StreakData {
        let activityDates = getUniqueActivityDates(checkIns: checkIns, sessionReports: sessionReports)
        let trainingDayNames = Set(trainingDays.keys)
        
        let today = calendar.startOfDay(for: Date())
        let todayName = dayNameFormatter.string(from: today)
        let isTodayTrainingDay = trainingDayNames.contains(todayName)
        let completedToday = activityDates.contains(dateFormatter.string(from: today))
        
        if activityDates.isEmpty {
            return StreakData(
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: nil,
                isActive: !isTodayTrainingDay,
                daysUntilBreak: 0,
                completedToday: false,
                isTodayTrainingDay: isTodayTrainingDay
            )
        }
        
        let sortedActivityDates = activityDates
            .compactMap { dateFormatter.date(from: $0) }
            .map { calendar.startOfDay(for: $0) }
            .sorted(by: >)
        
        guard let mostRecentActivity = sortedActivityDates.first else {
            return StreakData(
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: nil,
                isActive: !isTodayTrainingDay,
                daysUntilBreak: 0,
                completedToday: false,
                isTodayTrainingDay: isTodayTrainingDay
            )
        }
        
        let isActive = checkStreakActive(
            today: today,
            mostRecentActivity: mostRecentActivity,
            activityDates: activityDates,
            trainingDayNames: trainingDayNames
        )
        
        let currentStreak = calculateCurrentStreak(
            sortedActivityDates: sortedActivityDates,
            activityDates: activityDates,
            trainingDayNames: trainingDayNames,
            today: today
        )
        
        let longestStreak = calculateLongestStreak(
            sortedActivityDates: sortedActivityDates,
            activityDates: activityDates,
            trainingDayNames: trainingDayNames
        )
        
        return StreakData(
            currentStreak: currentStreak,
            longestStreak: max(longestStreak, currentStreak),
            lastActivityDate: dateFormatter.string(from: mostRecentActivity),
            isActive: isActive,
            daysUntilBreak: completedToday ? 1 : 0,
            completedToday: completedToday,
            isTodayTrainingDay: isTodayTrainingDay
        )
    }
    
    private func getUniqueActivityDates(checkIns: [DailyCheckIn], sessionReports: [SessionReport]) -> Set<String> {
        var dates = Set<String>()
        
        for checkIn in checkIns {
            let dateOnly = String(checkIn.check_in_date.prefix(10))
            dates.insert(dateOnly)
        }
        
        for report in sessionReports {
            let dateOnly = String(report.session_date.prefix(10))
            dates.insert(dateOnly)
        }
        
        return dates
    }
    
    private func checkStreakActive(
        today: Date,
        mostRecentActivity: Date,
        activityDates: Set<String>,
        trainingDayNames: Set<String>
    ) -> Bool {
        let todayString = dateFormatter.string(from: today)
        if activityDates.contains(todayString) {
            return true
        }
        
        var checkDate = today
        while checkDate >= mostRecentActivity {
            let checkDateString = dateFormatter.string(from: checkDate)
            let dayName = dayNameFormatter.string(from: checkDate)
            
            if trainingDayNames.contains(dayName) {
                if activityDates.contains(checkDateString) {
                    return true
                } else {
                    return false
                }
            }
            
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: checkDate) else {
                break
            }
            checkDate = previousDay
        }
        
        return true
    }
    
    private func calculateCurrentStreak(
        sortedActivityDates: [Date],
        activityDates: Set<String>,
        trainingDayNames: Set<String>,
        today: Date
    ) -> Int {
        guard !sortedActivityDates.isEmpty else { return 0 }
        
        var streak = 0
        var checkDate = today
        var missedTrainingDay = false
        
        let oldestActivity = sortedActivityDates.last ?? today
        let searchLimit = calendar.date(byAdding: .day, value: -365, to: today) ?? oldestActivity
        
        while checkDate >= searchLimit && !missedTrainingDay {
            let checkDateString = dateFormatter.string(from: checkDate)
            let dayName = dayNameFormatter.string(from: checkDate)
            
            if trainingDayNames.contains(dayName) {
                if activityDates.contains(checkDateString) {
                    streak += 1
                } else {
                    missedTrainingDay = true
                }
            }
            
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: checkDate) else {
                break
            }
            checkDate = previousDay
        }
        
        return streak
    }
    
    private func calculateLongestStreak(
        sortedActivityDates: [Date],
        activityDates: Set<String>,
        trainingDayNames: Set<String>
    ) -> Int {
        guard !sortedActivityDates.isEmpty,
              let oldestActivity = sortedActivityDates.last,
              let newestActivity = sortedActivityDates.first else {
            return 0
        }
        
        var longestStreak = 0
        var currentStreak = 0
        var checkDate = newestActivity
        
        while checkDate >= oldestActivity {
            let checkDateString = dateFormatter.string(from: checkDate)
            let dayName = dayNameFormatter.string(from: checkDate)
            
            if trainingDayNames.contains(dayName) {
                if activityDates.contains(checkDateString) {
                    currentStreak += 1
                    longestStreak = max(longestStreak, currentStreak)
                } else {
                    currentStreak = 0
                }
            }
            
            guard let previousDay = calendar.date(byAdding: .day, value: -1, to: checkDate) else {
                break
            }
            checkDate = previousDay
        }
        
        return longestStreak
    }
}
