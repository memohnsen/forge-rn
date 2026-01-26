//
//  NotifsViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import Supabase

extension NotificationSettingsView{
    @Observable
    class ViewModel {
        var notificationManager = NotificationManager.shared
        var trainingDays: [String: String] = [:]
        var showEditTrainingDays = false
        var isSaving = false
        var isLoading = false
        var error: Error?
        
        func updateTrainingDays(userId: String, trainingDays: [String: String]) async {
            isLoading = true
            error = nil

            do {
                try await supabase
                    .from("journal_users")
                    .update([
                        "training_days": trainingDays
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
        
        func loadTrainingDays() {
            if let jsonString = UserDefaults.standard.string(forKey: "trainingDays"),
               let data = jsonString.data(using: .utf8),
               let decoded = try? JSONDecoder().decode([String: String].self, from: data) {
                trainingDays = decoded
            }
        }
        
        func saveTrainingDays(_ newTrainingDays: [String: String], userId: String) async {
            isSaving = true
            
            // Update database
            await updateTrainingDays(
                userId: userId,
                trainingDays: newTrainingDays
            )
            
            // Update AppStorage
            notificationManager.storeTrainingDays(newTrainingDays)
            
            // Reschedule notifications
            if notificationManager.isEnabled {
                notificationManager.scheduleNotifications()
            }
            
            // Reload local state
            loadTrainingDays()
            
            isSaving = false
        }
        
        func formatMeetDate(_ dateString: String) -> String {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            guard let date = formatter.date(from: dateString) else { return dateString }
            formatter.dateStyle = .medium
            return formatter.string(from: date)
        }
        
        func calculateSessionTime(from timeString: String) -> String {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            formatter.locale = Locale(identifier: "en_US")
            
            guard let date = formatter.date(from: timeString) else { return "2 hours after" }
            
            let calendar = Calendar.current
            guard let sessionTime = calendar.date(byAdding: .hour, value: 2, to: date) else { return "2 hours after" }
            
            return formatter.string(from: sessionTime)
        }
    }
}
