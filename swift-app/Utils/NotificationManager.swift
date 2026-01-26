//
//  NotificationManager.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/30/25.
//

import Foundation
import UserNotifications
import Supabase

@MainActor @Observable
class NotificationManager {
    static let shared = NotificationManager()
    
    var hasPermission: Bool = false
    var isEnabled: Bool {
        didSet {
            UserDefaults.standard.set(isEnabled, forKey: "notificationsEnabled")
        }
    }
    
    private let center = UNUserNotificationCenter.current()
    
    private init() {
        isEnabled = UserDefaults.standard.bool(forKey: "notificationsEnabled")
        checkPermission()
    }
    
    func checkPermission() {
        center.getNotificationSettings { settings in
            DispatchQueue.main.async {
                self.hasPermission = settings.authorizationStatus == .authorized
            }
        }
    }
    
    func requestPermission() async -> Bool {
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        do {
            let granted = try await center.requestAuthorization(options: options)
            await MainActor.run {
                self.hasPermission = granted
                self.isEnabled = granted
            }
            return granted
        } catch {
            print("Error requesting notification permission: \(error)")
            return false
        }
    }
    
    func cancelAll() {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }
    
    func scheduleNotifications() {
        guard isEnabled else { return }
        
        cancelAll()
        
        if let trainingDays = getTrainingDays() {
            scheduleDailyNotifications(trainingDays: trainingDays)
        }
        
        if let meetDate = getMeetDate() {
            scheduleCompNotification(meetDate: meetDate)
        }
    }
    
    private func getTrainingDays() -> [String: String]? {
        guard let jsonString = UserDefaults.standard.string(forKey: "trainingDays"),
              let data = jsonString.data(using: .utf8),
              let decoded = try? JSONDecoder().decode([String: String].self, from: data) else {
            return nil
        }
        return decoded
    }
    
    private func getMeetDate() -> String? {
        return UserDefaults.standard.string(forKey: "meetDate")
    }
    
    private func getMeetName() -> String? {
        return UserDefaults.standard.string(forKey: "meetName")
    }
    
    func storeTrainingDays(_ trainingDays: [String: String]) {
        if let data = try? JSONEncoder().encode(trainingDays),
           let jsonString = String(data: data, encoding: .utf8) {
            UserDefaults.standard.set(jsonString, forKey: "trainingDays")
        }
    }
    
    func storeMeetData(meetDate: String, meetName: String) {
        UserDefaults.standard.set(meetDate, forKey: "meetDate")
        UserDefaults.standard.set(meetName, forKey: "meetName")
    }
    
    private func scheduleDailyNotifications(trainingDays: [String: String]) {
        let calendar = Calendar.current
        let timeZone = calendar.timeZone
        
        for (dayName, timeString) in trainingDays {
            guard let timeComponents = parseTime(timeString),
                  let weekday = parseWeekday(dayName) else {
                continue
            }
            
            var dateComponents = DateComponents()
            dateComponents.hour = timeComponents.hour
            dateComponents.minute = timeComponents.minute
            dateComponents.weekday = weekday
            dateComponents.timeZone = timeZone
            
            let checkInTrigger = UNCalendarNotificationTrigger(
                dateMatching: dateComponents,
                repeats: true
            )
            
            let checkInContent = UNMutableNotificationContent()
            checkInContent.title = "Time for your daily check-in!"
            checkInContent.body = "Track your readiness before today's session."
            checkInContent.sound = .default
            checkInContent.categoryIdentifier = "CHECK_IN"
            
            let checkInRequest = UNNotificationRequest(
                identifier: "checkin_\(dayName)",
                content: checkInContent,
                trigger: checkInTrigger
            )
            
            center.add(checkInRequest) { error in
                if let error = error {
                    print("Error scheduling check-in notification: \(error)")
                }
            }
            
            var sessionDateComponents = dateComponents
            sessionDateComponents.hour! += 2
            if sessionDateComponents.hour! >= 24 {
                sessionDateComponents.hour! -= 24
                sessionDateComponents.weekday! += 1
                if sessionDateComponents.weekday! > 7 {
                    sessionDateComponents.weekday! = 1
                }
            }
            
            let sessionTrigger = UNCalendarNotificationTrigger(
                dateMatching: sessionDateComponents,
                repeats: true
            )
            
            let sessionContent = UNMutableNotificationContent()
            sessionContent.title = "How did your session go?"
            sessionContent.body = "Reflect on your training to optimize future performance."
            sessionContent.sound = .default
            sessionContent.categoryIdentifier = "SESSION_REFLECTION"
            
            let sessionRequest = UNNotificationRequest(
                identifier: "session_\(dayName)",
                content: sessionContent,
                trigger: sessionTrigger
            )
            
            center.add(sessionRequest) { error in
                if let error = error {
                    print("Error scheduling session notification: \(error)")
                }
            }
        }
    }
    
    private func scheduleCompNotification(meetDate: String) {
        guard let date = parseMeetDate(meetDate) else {
            return
        }
        
        var dateComponents = Calendar.current.dateComponents([.year, .month, .day], from: date)
        dateComponents.hour = 17
        dateComponents.minute = 0
        dateComponents.timeZone = Calendar.current.timeZone
        
        let trigger = UNCalendarNotificationTrigger(
            dateMatching: dateComponents,
            repeats: false
        )
        
        let content = UNMutableNotificationContent()
        content.title = "Competition Day Analysis"
        content.body = "Complete your post-competition reflection."
        content.sound = .default
        content.categoryIdentifier = "COMP_REFLECTION"
        
        let request = UNNotificationRequest(
            identifier: "comp_\(meetDate)",
            content: content,
            trigger: trigger
        )
        
        center.add(request) { error in
            if let error = error {
                print("Error scheduling comp notification: \(error)")
            }
        }
    }
    
    private func parseTime(_ timeString: String) -> (hour: Int, minute: Int)? {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        formatter.locale = Locale(identifier: "en_US")
        
        guard let date = formatter.date(from: timeString) else {
            return nil
        }
        
        let components = Calendar.current.dateComponents([.hour, .minute], from: date)
        return (hour: components.hour!, minute: components.minute!)
    }
    
    private func parseWeekday(_ dayName: String) -> Int? {
        let normalizedDay = dayName.lowercased()
        switch normalizedDay {
        case "sunday": return 1
        case "monday": return 2
        case "tuesday": return 3
        case "wednesday": return 4
        case "thursday": return 5
        case "friday": return 6
        case "saturday": return 7
        default: return nil
        }
    }
    
    private func parseMeetDate(_ dateString: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = Calendar.current.timeZone
        return formatter.date(from: dateString)
    }
    
    func hasCheckInToday(user_id: String) async -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        
        do {
            let response = try await supabase
                .from("journal_daily_checkins")
                .select()
                .eq("user_id", value: user_id)
                .eq("check_in_date", value: today)
                .execute()
            
            let rows = try JSONDecoder().decode([DailyCheckIn].self, from: response.data)
            return !rows.isEmpty
        } catch {
            print("Error checking check-in: \(error)")
            return false
        }
    }
    
    func hasSessionToday(user_id: String) async -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let today = formatter.string(from: Date())
        
        do {
            let response = try await supabase
                .from("journal_session_report")
                .select()
                .eq("user_id", value: user_id)
                .eq("session_date", value: today)
                .execute()
            
            let rows = try JSONDecoder().decode([SessionReport].self, from: response.data)
            return !rows.isEmpty
        } catch {
            print("Error checking session: \(error)")
            return false
        }
    }
    
    func hasCompToday(user_id: String, meetDate: String) async -> Bool {
        do {
            let response = try await supabase
                .from("journal_comp_report")
                .select()
                .eq("user_id", value: user_id)
                .eq("meet_date", value: meetDate)
                .execute()
            
            let rows = try JSONDecoder().decode([CompReport].self, from: response.data)
            return !rows.isEmpty
        } catch {
            print("Error checking comp: \(error)")
            return false
        }
    }
    
    enum NotificationType {
        case checkIn
        case session
        case competition
    }
    
    func cancelNotification(for type: NotificationType, day: String? = nil, meetDate: String? = nil) {
        var identifiers: [String] = []
        
        switch type {
        case .checkIn:
            if let day = day {
                identifiers.append("checkin_\(day)")
            }
        case .session:
            if let day = day {
                identifiers.append("session_\(day)")
            }
        case .competition:
            if let meetDate = meetDate {
                identifiers.append("comp_\(meetDate)")
            }
        }
        
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
    }
    
    func getDayOfWeek(from date: Date) -> String? {
        let weekdayNumber = Calendar.current.component(.weekday, from: date)
        switch weekdayNumber {
        case 1: return "Sunday"
        case 2: return "Monday"
        case 3: return "Tuesday"
        case 4: return "Wednesday"
        case 5: return "Thursday"
        case 6: return "Friday"
        case 7: return "Saturday"
        default: return nil
        }
    }
}
