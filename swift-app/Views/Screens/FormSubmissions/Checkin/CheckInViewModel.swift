//
//  WriteCheckIn.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation
import Supabase

extension CheckInView {
    @MainActor @Observable
    class ViewModel {
        var selectedLift: String = "Snatch"
        var selectedIntensity: String = "Moderate"
        var navigateToConfirmation: Bool = false
        
        let liftOptions: [String] = [
            "Snatch", "Clean", "Jerk", "C & J", "Total", "Squats", "Accessories", "Other"
        ]
        
        let intensityOptions: [String] = ["Maxing Out", "Heavy", "Moderate", "Light"]
        
        var isLoading: Bool = false
        var error: Error?
        
        func submitCheckIn(
            checkInScore: CheckInScore,
            selectedLift: String,
            selectedIntensity: String,
            userId: String
        ) async -> Bool {
            isLoading = true
            error = nil
            
            let iso8601String = Date.now.formatted(.iso8601)
            
            let checkIn = DailyCheckIn(
                user_id: userId,
                check_in_date: checkInScore.checkInDate.formatted(.iso8601.year().month().day().dateSeparator(.dash)),
                selected_lift: selectedLift,
                selected_intensity: selectedIntensity,
                goal: checkInScore.goal,
                physical_strength: checkInScore.physicalStrength,
                mental_strength: checkInScore.mentalStrength,
                recovered: checkInScore.recovered,
                confidence: checkInScore.confidence,
                sleep: checkInScore.sleep,
                energy: checkInScore.energy,
                stress: checkInScore.stress,
                soreness: checkInScore.soreness,
                readiness: checkInScore.readiness,
                focus: checkInScore.focus,
                excitement: checkInScore.excitement,
                body_connection: checkInScore.bodyConnection,
                concerns: checkInScore.concerns,
                physical_score: checkInScore.physicalScore,
                mental_score: checkInScore.mentalScore,
                overall_score: checkInScore.overallScore,
                created_at: iso8601String
            )
            
            do {
                try await supabase
                    .from("journal_daily_checkins")
                    .insert(checkIn)
                    .execute()
                
                if let dayOfWeek = NotificationManager.shared.getDayOfWeek(from: checkInScore.checkInDate) {
                    NotificationManager.shared.cancelNotification(for: .checkIn, day: dayOfWeek)
                }
                
                isLoading = false
                return true
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
                self.error = error
                print("Error: \(error.localizedDescription)")
                print("Full error: \(error)")
            }
            
            isLoading = false
            return false
        }
    }
}
