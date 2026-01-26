//
//  CompViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import Supabase

extension CompReflectionView {
    @Observable
    class ViewModel {
        var meet: String = ""
        var selectedMeetType: String = ""
        var meetDate: Date = Date()
        var bodyweight: String = ""
        var performanceRating: Int = 3
        var physicalPreparednessRating: Int = 3
        var mentalPreparednessRating: Int = 3
        var didWell: String = ""
        var needsWork: String = ""
        var goodFromTraining: String = ""
        var cues: String = ""
        var focus: String = ""
        var nutrition: String = ""
        var hydration: String = ""
        var satisfaction: Int = 3
        var confidence: Int = 3
        var pressureHandling: Int = 3
        var whatLearned: String = ""
        var whatProudOf: String = ""
        
        var snatch1: String = ""
        var snatch2: String = ""
        var snatch3: String = ""
        var cj1: String = ""
        var cj2: String = ""
        var cj3: String = ""
        
        var squat1: String = ""
        var squat2: String = ""
        var squat3: String = ""
        var bench1: String = ""
        var bench2: String = ""
        var bench3: String = ""
        var deadlift1: String = ""
        var deadlift2: String = ""
        var deadlift3: String = ""
        
        let meetType: [String] = ["Local", "National", "International"]
        
        var isLoading: Bool = false
        var error: Error?
        var alertTitle: String = ""
        var alertMessage: String = ""
        var alertShown: Bool = false
        
        func submitCompReport(compReport: CompReport) async {
            isLoading = true
            error = nil

            do {
                try await supabase
                    .from("journal_comp_report")
                    .insert(compReport)
                    .execute()
                
                NotificationManager.shared.cancelNotification(for: .competition, meetDate: compReport.meet_date)
                
                alertTitle = "Success!"
                alertMessage = "You have submitted your competition report, time to recover and focus on the next one!"
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
        
        var hasCompletedForm: Bool {
            if meet.isEmpty || didWell.isEmpty || needsWork.isEmpty || goodFromTraining.isEmpty || cues.isEmpty || focus.isEmpty || selectedMeetType.isEmpty || nutrition.isEmpty || hydration.isEmpty {
                return false
            }
            
            return true
        }
        
        func calculateBest(lift1: String, lift2: String, lift3: String) -> Int {
            return max(Int(lift1) ?? 0, Int(lift2) ?? 0, Int(lift2) ?? 0)
        }
        
        let iso8601String = Date.now.formatted(.iso8601)
    }
}
