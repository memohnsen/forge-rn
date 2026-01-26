//
//  WorkoutViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import Supabase

extension WorkoutReflectionView{
    @Observable
    class ViewModel {
        var sessionDate: Date = Date()
        var timeOfDay: String = ""
        var sessionRPE: Int = 3
        var movementQuality: Int = 3
        var focus: Int = 3
        var misses: String = ""
        var cues: String = ""
        var feeling: Int = 3
        var satisfaction: Int = 3
        var confidence: Int = 3
        var whatLearned: String = ""
        var whatWouldChange: String = ""
        
        var selectedLift: String = ""
        var selectedIntensity: String = ""
        
        var isLoading: Bool = false
        var error: Error?
        var alertTitle: String = ""
        var alertMessage: String = ""
        var alertShown: Bool = false
        
        let liftOptionsWL: [String] = [
            "Snatch", "Clean", "Jerk", "C & J", "Total", "Squats", "Accessories", "Other"
        ]
        
        let liftOptionsPL: [String] = [
            "Squat", "Bench", "Deadlift", "Total", "Accessories", "Other"
        ]
        
        let timesOfDay: [String] = ["Early Morning", "Late Morning", "Afternoon", "Evening", "Night"]
        
        let intensityOptions: [String] = ["Maxing Out", "Heavy", "Moderate", "Light"]
        
        let missQuantity: [String] = ["0", "1", "2", "3", "4", "5+"]
        
        var hasCompletedForm: Bool {
            if cues.isEmpty || timeOfDay.isEmpty || misses.isEmpty || selectedLift.isEmpty || selectedIntensity.isEmpty {
                return false
            }
            
            return true
        }
        
        let iso8601String = Date.now.formatted(.iso8601)
        
        func submitSessionReport(sessionReport: SessionReport) async {
            isLoading = true
            error = nil
        
            do {
                try await supabase
                    .from("journal_session_report")
                    .insert(sessionReport)
                    .execute()
                
                let formatter = DateFormatter()
                formatter.dateFormat = "yyyy-MM-dd"
                if let sessionDate = formatter.date(from: sessionReport.session_date),
                   let dayOfWeek = NotificationManager.shared.getDayOfWeek(from: sessionDate) {
                    NotificationManager.shared.cancelNotification(for: .session, day: dayOfWeek)
                }
                
                alertTitle = "Success!"
                alertMessage = "You have submitted your session report, time to recover for the next day!"
            } catch let DecodingError.keyNotFound(key, context) {
                print("Key '\(key.stringValue)' not found:", context.debugDescription)
                print("codingPath:", context.codingPath)
                
                alertTitle = "Error Submitting Your Report"
                alertMessage = context.debugDescription
            } catch let DecodingError.typeMismatch(type, context) {
                print("Type '\(type)' mismatch:", context.debugDescription)
                print("codingPath:", context.codingPath)
                
                alertTitle = "Error Submitting Your Report"
                alertMessage = context.debugDescription
            } catch let DecodingError.valueNotFound(value, context) {
                print("Value '\(value)' not found:", context.debugDescription)
                print("codingPath:", context.codingPath)
                
                alertTitle = "Error Submitting Your Report"
                alertMessage = context.debugDescription
            } catch let DecodingError.dataCorrupted(context) {
                print("Data corrupted:", context.debugDescription)
                print("codingPath:", context.codingPath)
                
                alertTitle = "Error Submitting Your Report"
                alertMessage = context.debugDescription
            } catch {
                print("Error: \(error.localizedDescription)")
                print("Full error: \(error)")
                
                alertTitle = "Error Submitting Your Report"
                alertMessage = error.localizedDescription
            }
            
            alertShown = true
            isLoading = false
        }
    }
}
