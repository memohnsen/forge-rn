//
//  SettingsViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import SwiftUI
import Clerk
import RevenueCat
import Supabase

extension SettingsView {
    @Observable
    class SettingsViewModel {
        var showCustomerCenter: Bool = false
        var csvFileURL: URL?
        var showShareSheet = false
        var isExporting = false
        
        var checkInsCSV: String = ""
        var compReportCSV: String = ""
        var sessionReportCSV: String = ""
        var ouraDataCSV: String = ""
        var whoopDataCSV: String = ""
        
        var alertShown: Bool = false
        var alertDeletedShown: Bool = false
        
        var users: [Users] = []
        var isLoading: Bool = false
        var error: Error?
        
        var showCoachEmailSheet: Bool = false
        var showCoachEmailSavedAlert: Bool = false
        var ouraService = Oura()
        var whoopService = Whoop()
            
        let device = UIDevice.current
        
        let recipient: String = "maddisen@meetcal.app"
        let subject: String = "Forge - Performance Journal Feedback"
        
        func emailBody(userId: String) -> String {
            "Hello, my name is \(users.first?.first_name ?? "") \(users.first?.last_name ?? "").\n\nMy User ID is: \(userId).\n\nMy Purchase ID is: \(Purchases.shared.appUserID)\n\nMy device and iOS version are: \(device.name) \(device.model) \(device.systemName) \(device.systemVersion)"
        }
        
        var encodedSubject: String? {
            subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)
        }
        
        func encodedBody(userId: String) -> String? {
            emailBody(userId: userId).addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)?.replacingOccurrences(of: "%0A", with: "%0D%0A")
        }

        func mailtoUrl(userId: String) -> URL? {
            if let encodedSubject = encodedSubject, let encodedBody = encodedBody(userId: userId) {
                return URL(string: "mailto:\(recipient)?subject=\(encodedSubject)&body=\(encodedBody)")
            }
            return nil
        }
        
        var appVersion: String? {
            return Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        }
        
        func fetchCheckinsCSV(user_id: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_daily_checkins")
                    .select()
                    .eq("user_id", value: user_id)
                    .order("check_in_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    self.checkInsCSV = csvString
                }
            } catch {
                print("Error fetching CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            isLoading = false
        }
        
        func fetchCompReportsCSV(user_id: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_comp_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .order("meet_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    self.compReportCSV = csvString
                }
            } catch {
                print("Error fetching CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            isLoading = false
        }
        
        func fetchSessionReportCSV(user_id: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_session_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .order("session_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    self.sessionReportCSV = csvString
                }
            } catch {
                print("Error fetching CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            isLoading = false
        }
        
        func createCSVFile(userId: String) async -> URL? {
            
            await fetchUsers(user_id: userId)
            
            await fetchCheckinsCSV(user_id: userId)
            await fetchCompReportsCSV(user_id: userId)
            await fetchSessionReportCSV(user_id: userId)
            
            var startDate: Date? = nil
            if let user = users.first, let createdAtString = user.created_at {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                startDate = dateFormatter.date(from: createdAtString)
            }
            
            if startDate == nil {
                let calendar = Calendar.current
                startDate = calendar.date(byAdding: .year, value: -1, to: Date())
            }
            
            if ouraService.getAccessToken(userId: userId) != nil, let ouraStartDate = startDate {
                await fetchOuraDataCSV(userId: userId, startDate: ouraStartDate)
            }
            
            if whoopService.getAccessToken(userId: userId) != nil, let whoopStartDate = startDate {
                await fetchWhoopDataCSV(userId: userId, startDate: whoopStartDate)
            }
            
            var combinedCSV = "=== DAILY CHECK-INS ===\n"
            combinedCSV += checkInsCSV
            combinedCSV += "\n\n=== COMPETITION REPORTS ===\n"
            combinedCSV += compReportCSV
            combinedCSV += "\n\n=== SESSION REPORTS ===\n"
            combinedCSV += sessionReportCSV
            
            if !ouraDataCSV.isEmpty {
                combinedCSV += "\n\n=== OURA DATA ===\n"
                combinedCSV += ouraDataCSV
            }
            
            if !whoopDataCSV.isEmpty {
                combinedCSV += "\n\n=== WHOOP DATA ===\n"
                combinedCSV += whoopDataCSV
            }
            
            let tempDir = FileManager.default.temporaryDirectory
            let dateString = Date().formatted(date: .numeric, time: .omitted).replacingOccurrences(of: "/", with: "-")
            let fileURL = tempDir.appendingPathComponent("Forge_Export_\(dateString).csv")
            
            do {
                try combinedCSV.write(to: fileURL, atomically: true, encoding: .utf8)
                return fileURL
            } catch {
                print("Error creating CSV file: \(error)")
                return nil
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
                
        func removeAllCheckIns(userId: String) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_daily_checkins")
                    .delete()
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
        
        func removeAllWorkouts(userId: String) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_session_report")
                    .delete()
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
        
        func removeAllMeets(userId: String) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_comp_report")
                    .delete()
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
        
        private func getDateSevenDaysAgo() -> String {
            let calendar = Calendar.current
            let sevenDaysAgo = calendar.date(byAdding: .day, value: -7, to: Date()) ?? Date()
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            formatter.locale = Locale(identifier: "en_US_POSIX")
            return formatter.string(from: sevenDaysAgo)
        }
        
        func fetchWeeklyCheckinsCSV(user_id: String) async -> String {
            let sevenDaysAgo = getDateSevenDaysAgo()
            
            do {
                let response = try await supabase
                    .from("journal_daily_checkins")
                    .select()
                    .eq("user_id", value: user_id)
                    .gte("check_in_date", value: sevenDaysAgo)
                    .order("check_in_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    return csvString
                }
            } catch {
                print("Error fetching weekly check-ins CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            return ""
        }
        
        func fetchWeeklyCompReportsCSV(user_id: String) async -> String {
            let sevenDaysAgo = getDateSevenDaysAgo()
            
            do {
                let response = try await supabase
                    .from("journal_comp_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .gte("meet_date", value: sevenDaysAgo)
                    .order("meet_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    return csvString
                }
            } catch {
                print("Error fetching weekly comp reports CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            return ""
        }
        
        func fetchWeeklySessionReportCSV(user_id: String) async -> String {
            let sevenDaysAgo = getDateSevenDaysAgo()
            
            do {
                let response = try await supabase
                    .from("journal_session_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .gte("session_date", value: sevenDaysAgo)
                    .order("session_date", ascending: false)
                    .csv()
                    .execute()
                
                if let csvString = String(data: response.data, encoding: .utf8) {
                    return csvString
                }
            } catch {
                print("Error fetching weekly session reports CSV: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            return ""
        }

        func fetchOuraDataCSV(userId: String, startDate: Date) async {
            ouraDataCSV = ""
            
            let ouraService = Oura()
            
            guard ouraService.getAccessToken(userId: userId) != nil else {
                print("User does not have Oura connected, skipping Oura data export")
                return
            }
            
            do {
                let sleepData = try await ouraService.fetchDailySleep(
                    userId: userId,
                    startDate: startDate,
                    endDate: Date()
                )
                
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                
                let filteredData = sleepData.filter { sleepRecord in
                    if let recordDate = dateFormatter.date(from: sleepRecord.day) {
                        return recordDate >= startDate
                    }
                    return false
                }
                
                let sortedData = filteredData.sorted { first, second in
                    guard let firstDate = dateFormatter.date(from: first.day),
                          let secondDate = dateFormatter.date(from: second.day) else {
                        return false
                    }
                    return firstDate < secondDate
                }
                
                var csvRows: [String] = []
                
                csvRows.append("day,sleep_duration_hours,hrv_ms,average_heart_rate_bpm,readiness_score")
                
                for record in sortedData {
                    let sleepHours = record.sleepDurationHours.map { String(format: "%.2f", $0) } ?? ""
                    let hrv = record.hrv.map { String(format: "%.1f", $0) } ?? ""
                    let heartRate = record.averageHeartRate.map { String(format: "%.0f", $0) } ?? ""
                    let readiness = record.readinessScore.map { String($0) } ?? ""
                    
                    let escapeCSV: (String) -> String = { value in
                        if value.isEmpty {
                            return ""
                        }
                        if value.contains(",") || value.contains("\"") {
                            return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
                        }
                        return value
                    }
                    
                    let row = [
                        record.day,
                        escapeCSV(sleepHours),
                        escapeCSV(hrv),
                        escapeCSV(heartRate),
                        escapeCSV(readiness)
                    ].joined(separator: ",")
                    
                    csvRows.append(row)
                }
                
                ouraDataCSV = csvRows.joined(separator: "\n")
                
            } catch {
                print("Error fetching Oura data for CSV export: \(error.localizedDescription)")
                print("Full error: \(error)")
                ouraDataCSV = ""
            }
        }
        
        func fetchWhoopDataCSV(userId: String, startDate: Date) async {
            whoopDataCSV = ""
            
            let whoopService = Whoop()
            
            guard whoopService.getAccessToken(userId: userId) != nil else {
                print("User does not have WHOOP connected, skipping WHOOP data export")
                return
            }
            
            do {
                let dailyData = try await whoopService.fetchDailyData(
                    userId: userId,
                    startDate: startDate,
                    endDate: Date()
                )
                
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "yyyy-MM-dd"
                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                
                let filteredData = dailyData.filter { dailyRecord in
                    if let recordDate = dateFormatter.date(from: dailyRecord.date) {
                        return recordDate >= startDate
                    }
                    return false
                }
                
                let sortedData = filteredData.sorted { first, second in
                    guard let firstDate = dateFormatter.date(from: first.date),
                          let secondDate = dateFormatter.date(from: second.date) else {
                        return false
                    }
                    return firstDate < secondDate
                }
                
                var csvRows: [String] = []
                
                csvRows.append("date,recovery_score,sleep_duration_hours,sleep_performance_percent,sleep_consistency_percent,sleep_efficiency_percent,strain_score,hrv_ms,resting_heart_rate_bpm,respiratory_rate")
                
                for record in sortedData {
                    let recoveryScore = record.recoveryScore.map { String($0) } ?? ""
                    let sleepHours = record.sleepDurationHours.map { String(format: "%.2f", $0) } ?? ""
                    let sleepPerformance = record.sleepPerformance.map { String($0) } ?? ""
                    let sleepConsistency = record.sleepConsistency.map { String($0) } ?? ""
                    let sleepEfficiency = record.sleepEfficiency.map { String($0) } ?? ""
                    let strainScore = record.strainScore.map { String(format: "%.2f", $0) } ?? ""
                    let hrv = record.hrvMs.map { String($0) } ?? ""
                    let restingHR = record.restingHeartRate.map { String($0) } ?? ""
                    let respiratoryRate = record.respiratoryRate.map { String(format: "%.2f", $0) } ?? ""
                    
                    let escapeCSV: (String) -> String = { value in
                        if value.isEmpty {
                            return ""
                        }
                        if value.contains(",") || value.contains("\"") {
                            return "\"\(value.replacingOccurrences(of: "\"", with: "\"\""))\""
                        }
                        return value
                    }
                    
                    let row = [
                        record.date,
                        escapeCSV(recoveryScore),
                        escapeCSV(sleepHours),
                        escapeCSV(sleepPerformance),
                        escapeCSV(sleepConsistency),
                        escapeCSV(sleepEfficiency),
                        escapeCSV(strainScore),
                        escapeCSV(hrv),
                        escapeCSV(restingHR),
                        escapeCSV(respiratoryRate)
                    ].joined(separator: ",")
                    
                    csvRows.append(row)
                }
                
                whoopDataCSV = csvRows.joined(separator: "\n")
                
            } catch {
                print("Error fetching WHOOP data for CSV export: \(error.localizedDescription)")
                print("Full error: \(error)")
                whoopDataCSV = ""
            }
        }

        func updateCoachEmail(userId: String, email: String?) async {
            isLoading = true
            error = nil
                    
            do {
                try await supabase
                    .from("journal_users")
                    .update([
                        "coach_email": email
                    ])
                    .eq("user_id", value: userId)
                    .execute()
            } catch let DecodingError.keyNotFound(key, context) {
                print("Key '\(key.stringValue)' not found:", context.debugDescription)
                print("codingPath:", context.codingPath)
                self.error = error
            } catch let DecodingError.typeMismatch(type, context) {
                print("Type '\(type)' mismatch:", context.debugDescription)
                print("codingPath:", context.codingPath)
                self.error = error
            } catch let DecodingError.valueNotFound(value, context) {
                print("Value '\(value)' not found:", context.debugDescription)
                print("codingPath:", context.codingPath)
                self.error = error
            } catch let DecodingError.dataCorrupted(context) {
                print("Data corrupted:", context.debugDescription)
                print("codingPath:", context.codingPath)
                self.error = error
            } catch {
                print("Error updating coach email: \(error.localizedDescription)")
                print("Full error: \(error)")
                self.error = error
            }
            
            isLoading = false
        }
    }
}
