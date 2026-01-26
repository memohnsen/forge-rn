//
//  HomeViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import Supabase
import SwiftUI

extension HomeView {
    @Observable
    class HomeViewModel {
        var users: [Users] = []
        var checkIns: [DailyCheckIn] = []
        var sessionReports: [SessionReport] = []
        var streakData: StreakData?
        var isLoading: Bool = false
        var loadingHistory: Bool = false
        var error: Error?
        
        let date: Date = Date.now
        
        var editMeetSheetShown: Bool = false
        var userProfileShown: Bool = false

        var newMeetName: String = ""
        var newMeetDate: Date = Date()
        
        private let streakOrange = Color(red: 255/255, green: 149/255, blue: 0/255)
        private let streakRed = Color(red: 255/255, green: 69/255, blue: 58/255)
        private let streakGray = Color.gray
        
        var streakDisplayText: String {
            guard let streak = streakData else { return "0" }
            return "\(streak.currentStreak)"
        }
        
        var streakLabelText: String {
            guard let streak = streakData else { return "training day streak" }
            return "day streak!"
        }
        
        var streakStatusText: String {
            guard let streak = streakData else { return "Start your streak today!" }
            
            if streak.currentStreak == 0 && streak.isTodayTrainingDay {
                return "Start your streak today!"
            } else if streak.currentStreak == 0 {
                return "Rest day - streak safe!"
            } else if streak.completedToday {
                return "You're on fire!"
            } else if streak.isTodayTrainingDay && streak.isActive {
                return "Log today to keep your streak!"
            } else if streak.isActive {
                return "Keep it up!"
            } else {
                return "Start a new streak!"
            }
        }
        
        var streakColor: Color {
            guard let streak = streakData else { return streakGray }
            
            if streak.currentStreak == 0 {
                return streakGray
            } else if streak.completedToday {
                return streakOrange
            } else if streak.isTodayTrainingDay && streak.isActive {
                return streakRed
            } else if streak.isActive {
                return streakOrange
            } else {
                return streakGray
            }
        }
        
        var shouldShowStreak: Bool {
            return true
        }
        
        var streakIconName: String {
            guard let streak = streakData else { return "flame" }
            return streak.currentStreak > 0 ? "flame.fill" : "flame"
        }
        
        var daysUntilMeet: Int {
            guard let user = users.first else { return 0 }
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            guard let meetDate = dateFormatter.date(from: user.next_competition_date) else { return 0 }
            let calendar = Calendar.current
            let components = calendar.dateComponents([.day], from: Date(), to: meetDate)
            return components.day ?? 0
        }
        
        var meetNameDisplay: String {
            if daysUntilMeet < 0 {
                "Tap To Set Your Next Meet"
            } else {
                users.first?.next_competition ?? "No Meet Coming Up"
            }
        }
        
        var trainingDaysPerWeek: Int {
            users.first?.training_days.count ?? 0
        }
        
        var sessionsLeft: Int {
            let weeksRemaining = max(0, Double(daysUntilMeet) / 7.0)
            let sessions = Int(ceil(weeksRemaining * Double(trainingDaysPerWeek)))
            return sessions
        }
        
        var daysUntilMeetText: String {
            if daysUntilMeet < 0 {
                return "Completed"
            } else if daysUntilMeet == 0 {
                return "Today!"
            } else {
                return "\(daysUntilMeet) day\(daysUntilMeet == 1 ? "" : "s") left"
            }
        }
        
        var sessionsLeftText: String {
            if daysUntilMeet < 0 {
                return "0"
            } else if daysUntilMeet == 0 {
                return "0"
            } else {
                return "\(sessionsLeft) session\(sessionsLeft == 1 ? "" : "s") left"
            }
        }
        
        func fetchUsers(user_id: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_users")
                    .select()
                    .eq("user_id", value: user_id)
                    .execute()
                
                let row = try JSONDecoder().decode([Users].self, from: response.data)
                
                self.users.removeAll()
                self.users = row
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
        
        func fetchCheckins(user_id: String) async {
            loadingHistory = true
            
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
                print(checkIns)
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
            
            loadingHistory = false
        }
        
        func submitUserProfile(user: Users) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_users")
                    .insert(user)
                    .execute()
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
        
        func updateUserMeet(userId: String, meetName: String, meetDate: String) async {
            isLoading = true
            error = nil

            do {
                try await supabase
                    .from("journal_users")
                    .update([
                        "next_competition": meetName,
                        "next_competition_date": meetDate
                    ])
                    .eq("user_id", value: userId)
                    .execute()
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
        
        func fetchSessionReports(user_id: String) async {
            do {
                let response = try await supabase
                    .from("journal_session_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .order("session_date", ascending: false)
                    .execute()
                
                let row = try JSONDecoder().decode([SessionReport].self, from: response.data)
                
                self.sessionReports.removeAll()
                self.sessionReports = row
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
        }
        
        func calculateStreak() {
            let trainingDays = users.first?.training_days ?? [:]
            streakData = StreakManager.shared.calculateStreak(
                checkIns: checkIns,
                sessionReports: sessionReports,
                trainingDays: trainingDays
            )
        }
    }
}
