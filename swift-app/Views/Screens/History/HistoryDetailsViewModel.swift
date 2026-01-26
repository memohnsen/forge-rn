//
//  HistoryDetailsViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/10/26.
//

import Foundation
import Supabase

extension HistoryDetailsView {
    @Observable
    class ViewModel {
        var ouraService = Oura()
        var ouraSleepData: OuraSleep? = nil
        var whoopService = Whoop()
        var whoopData: WhoopDailyData? = nil
        var isLoading: Bool = false
        var isSaving: Bool = false
        var error: Error?
        var comp: [CompReport] = []
        var session: [SessionReport] = []
        var checkin: [DailyCheckIn] = []
        
        var isEditMode: Bool = false
        var alertTitle: String = ""
        var alertMessage: String = ""
        var alertShown: Bool = false
        
        var editMeet: String = ""
        var editSelectedMeetType: String = ""
        var editMeetDate: Date = Date()
        var editBodyweight: String = ""
        var editPerformanceRating: Int = 3
        var editPhysicalPreparednessRating: Int = 3
        var editMentalPreparednessRating: Int = 3
        var editNutrition: String = ""
        var editHydration: String = ""
        var editDidWell: String = ""
        var editNeedsWork: String = ""
        var editGoodFromTraining: String = ""
        var editCompCues: String = ""
        var editCompFocus: String = ""
        var editCompSatisfaction: Int = 3
        var editCompConfidence: Int = 3
        var editPressureHandling: Int = 3
        var editCompWhatLearned: String = ""
        var editWhatProudOf: String = ""
        var editSnatch1: String = ""
        var editSnatch2: String = ""
        var editSnatch3: String = ""
        var editCj1: String = ""
        var editCj2: String = ""
        var editCj3: String = ""
        var editSquat1: String = ""
        var editSquat2: String = ""
        var editSquat3: String = ""
        var editBench1: String = ""
        var editBench2: String = ""
        var editBench3: String = ""
        var editDeadlift1: String = ""
        var editDeadlift2: String = ""
        var editDeadlift3: String = ""
        
        var editSessionDate: Date = Date()
        var editTimeOfDay: String = ""
        var editSessionRPE: Int = 3
        var editMovementQuality: Int = 3
        var editSessionFocus: Int = 3
        var editMisses: String = ""
        var editSessionCues: String = ""
        var editFeeling: Int = 3
        var editSessionSatisfaction: Int = 3
        var editSessionConfidence: Int = 3
        var editSessionWhatLearned: String = ""
        var editWhatWouldChange: String = ""
        var editSelectedLift: String = ""
        var editSelectedIntensity: String = ""
        
        var editCheckInDate: Date = Date()
        var editCheckInSelectedLift: String = ""
        var editCheckInSelectedIntensity: String = ""
        var editGoal: String = ""
        var editPhysicalStrength: Int = 3
        var editMentalStrength: Int = 3
        var editRecovered: Int = 3
        var editCheckInConfidence: Int = 3
        var editSleep: Int = 3
        var editEnergy: Int = 3
        var editStress: Int = 3
        var editSoreness: Int = 3
        var editReadiness: Int = 3
        var editCheckInFocus: Int = 3
        var editExcitement: Int = 3
        var editBodyConnection: Int = 3
        var editConcerns: String = ""
        
        let meetTypeOptions: [String] = ["Local", "National", "International"]
        let timesOfDay: [String] = ["Early Morning", "Late Morning", "Afternoon", "Evening", "Night"]
        let liftOptionsWL: [String] = ["Snatch", "Clean", "Jerk", "C & J", "Total", "Squats", "Accessories", "Other"]
        let liftOptionsPL: [String] = ["Squat", "Bench", "Deadlift", "Total", "Accessories", "Other"]
        let intensityOptions: [String] = ["Maxing Out", "Heavy", "Moderate", "Light"]
        let missQuantity: [String] = ["0", "1", "2", "3", "4", "5+"]
        
        func initializeEditableComp() {
            guard let compReport = comp.first else { return }
            editMeet = compReport.meet
            editSelectedMeetType = compReport.selected_meet_type
            editBodyweight = compReport.bodyweight
            editPerformanceRating = compReport.performance_rating
            editPhysicalPreparednessRating = compReport.physical_preparedness_rating
            editMentalPreparednessRating = compReport.mental_preparedness_rating
            editNutrition = compReport.nutrition
            editHydration = compReport.hydration
            editDidWell = compReport.did_well
            editNeedsWork = compReport.needs_work
            editGoodFromTraining = compReport.good_from_training
            editCompCues = compReport.cues
            editCompFocus = compReport.focus
            editCompSatisfaction = compReport.satisfaction
            editCompConfidence = compReport.confidence
            editPressureHandling = compReport.pressure_handling
            editCompWhatLearned = compReport.what_learned
            editWhatProudOf = compReport.what_proud_of
            editSnatch1 = compReport.snatch1 ?? ""
            editSnatch2 = compReport.snatch2 ?? ""
            editSnatch3 = compReport.snatch3 ?? ""
            editCj1 = compReport.cj1 ?? ""
            editCj2 = compReport.cj2 ?? ""
            editCj3 = compReport.cj3 ?? ""
            editSquat1 = compReport.squat1 ?? ""
            editSquat2 = compReport.squat2 ?? ""
            editSquat3 = compReport.squat3 ?? ""
            editBench1 = compReport.bench1 ?? ""
            editBench2 = compReport.bench2 ?? ""
            editBench3 = compReport.bench3 ?? ""
            editDeadlift1 = compReport.deadlift1 ?? ""
            editDeadlift2 = compReport.deadlift2 ?? ""
            editDeadlift3 = compReport.deadlift3 ?? ""
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            if let date = dateFormatter.date(from: compReport.meet_date) {
                editMeetDate = date
            }
        }
        
        func initializeEditableSession() {
            guard let sessionReport = session.first else { return }
            editTimeOfDay = sessionReport.time_of_day
            editSessionRPE = sessionReport.session_rpe
            editMovementQuality = sessionReport.movement_quality
            editSessionFocus = sessionReport.focus
            editMisses = sessionReport.misses
            editSessionCues = sessionReport.cues
            editFeeling = sessionReport.feeling
            editSessionSatisfaction = sessionReport.satisfaction
            editSessionConfidence = sessionReport.confidence
            editSessionWhatLearned = sessionReport.what_learned ?? ""
            editWhatWouldChange = sessionReport.what_would_change ?? ""
            editSelectedLift = sessionReport.selected_lift
            editSelectedIntensity = sessionReport.selected_intensity
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            if let date = dateFormatter.date(from: sessionReport.session_date) {
                editSessionDate = date
            }
        }
        
        func initializeEditableCheckIn() {
            guard let checkIn = checkin.first else { return }
            editCheckInSelectedLift = checkIn.selected_lift
            editCheckInSelectedIntensity = checkIn.selected_intensity
            editGoal = checkIn.goal
            editPhysicalStrength = checkIn.physical_strength
            editMentalStrength = checkIn.mental_strength
            editRecovered = checkIn.recovered
            editCheckInConfidence = checkIn.confidence
            editSleep = checkIn.sleep
            editEnergy = checkIn.energy
            editStress = checkIn.stress
            editSoreness = checkIn.soreness
            editReadiness = checkIn.readiness
            editCheckInFocus = checkIn.focus
            editExcitement = checkIn.excitement
            editBodyConnection = checkIn.body_connection
            editConcerns = checkIn.concerns ?? ""
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            if let date = dateFormatter.date(from: checkIn.check_in_date) {
                editCheckInDate = date
            }
        }
        
        func calculateBest(lift1: String, lift2: String, lift3: String) -> Int {
            return max(Int(lift1) ?? 0, Int(lift2) ?? 0, Int(lift3) ?? 0)
        }
        
        func calculatePhysicalScore() -> Int {
            let total = editPhysicalStrength + editRecovered + editEnergy + (6 - editSoreness) + editBodyConnection
            return Int((Double(total) / 25.0) * 100)
        }
        
        func calculateMentalScore() -> Int {
            let total = editMentalStrength + editCheckInConfidence + editCheckInFocus + editStress + editExcitement + editReadiness
            return Int((Double(total) / 30.0) * 100)
        }
        
        func calculateOverallScore() -> Int {
            return (calculatePhysicalScore() + calculateMentalScore()) / 2
        }
        
        func updateCompReport(userSport: String) async {
            guard let reportId = comp.first?.id else { return }
            isSaving = true
            error = nil
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let meetDateString = dateFormatter.string(from: editMeetDate)
            
            var updatedReport = CompReport(
                id: reportId,
                user_id: comp.first?.user_id ?? "",
                meet: editMeet,
                selected_meet_type: editSelectedMeetType,
                meet_date: meetDateString,
                bodyweight: editBodyweight,
                performance_rating: editPerformanceRating,
                physical_preparedness_rating: editPhysicalPreparednessRating,
                mental_preparedness_rating: editMentalPreparednessRating,
                nutrition: editNutrition,
                hydration: editHydration,
                did_well: editDidWell,
                needs_work: editNeedsWork,
                good_from_training: editGoodFromTraining,
                cues: editCompCues,
                focus: editCompFocus,
                satisfaction: editCompSatisfaction,
                confidence: editCompConfidence,
                pressure_handling: editPressureHandling,
                what_learned: editCompWhatLearned,
                what_proud_of: editWhatProudOf,
                created_at: comp.first?.created_at ?? ""
            )
            
            if userSport == "Olympic Weightlifting" {
                updatedReport.snatch1 = editSnatch1
                updatedReport.snatch2 = editSnatch2
                updatedReport.snatch3 = editSnatch3
                updatedReport.cj1 = editCj1
                updatedReport.cj2 = editCj2
                updatedReport.cj3 = editCj3
                updatedReport.snatch_best = calculateBest(lift1: editSnatch1, lift2: editSnatch2, lift3: editSnatch3)
                updatedReport.cj_best = calculateBest(lift1: editCj1, lift2: editCj2, lift3: editCj3)
            } else {
                updatedReport.squat1 = editSquat1
                updatedReport.squat2 = editSquat2
                updatedReport.squat3 = editSquat3
                updatedReport.bench1 = editBench1
                updatedReport.bench2 = editBench2
                updatedReport.bench3 = editBench3
                updatedReport.deadlift1 = editDeadlift1
                updatedReport.deadlift2 = editDeadlift2
                updatedReport.deadlift3 = editDeadlift3
                updatedReport.squat_best = calculateBest(lift1: editSquat1, lift2: editSquat2, lift3: editSquat3)
                updatedReport.bench_best = calculateBest(lift1: editBench1, lift2: editBench2, lift3: editBench3)
                updatedReport.deadlift_best = calculateBest(lift1: editDeadlift1, lift2: editDeadlift2, lift3: editDeadlift3)
            }
            
            do {
                try await supabase
                    .from("journal_comp_report")
                    .update(updatedReport)
                    .eq("id", value: reportId)
                    .execute()
                
                self.comp = [updatedReport]
                isEditMode = false
                alertTitle = "Success!"
                alertMessage = "Your competition report has been updated."
            } catch {
                self.error = error
                alertTitle = "Error"
                alertMessage = "Failed to update competition report: \(error.localizedDescription)"
            }
            
            alertShown = true
            isSaving = false
        }
        
        func updateSessionReport() async {
            guard let reportId = session.first?.id else { return }
            isSaving = true
            error = nil
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let sessionDateString = dateFormatter.string(from: editSessionDate)
            
            let updatedReport = SessionReport(
                id: reportId,
                user_id: session.first?.user_id ?? "",
                session_date: sessionDateString,
                time_of_day: editTimeOfDay,
                session_rpe: editSessionRPE,
                movement_quality: editMovementQuality,
                focus: editSessionFocus,
                misses: editMisses,
                cues: editSessionCues,
                feeling: editFeeling,
                satisfaction: editSessionSatisfaction,
                confidence: editSessionConfidence,
                what_learned: editSessionWhatLearned,
                what_would_change: editWhatWouldChange,
                selected_lift: editSelectedLift,
                selected_intensity: editSelectedIntensity,
                created_at: session.first?.created_at ?? ""
            )
            
            do {
                try await supabase
                    .from("journal_session_report")
                    .update(updatedReport)
                    .eq("id", value: reportId)
                    .execute()
                
                self.session = [updatedReport]
                isEditMode = false
                alertTitle = "Success!"
                alertMessage = "Your session report has been updated."
            } catch {
                self.error = error
                alertTitle = "Error"
                alertMessage = "Failed to update session report: \(error.localizedDescription)"
            }
            
            alertShown = true
            isSaving = false
        }
        
        func updateCheckIn() async {
            guard let checkInId = checkin.first?.id else { return }
            isSaving = true
            error = nil
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let checkInDateString = dateFormatter.string(from: editCheckInDate)
            
            let updatedCheckIn = DailyCheckIn(
                id: checkInId,
                user_id: checkin.first?.user_id ?? "",
                check_in_date: checkInDateString,
                selected_lift: editCheckInSelectedLift,
                selected_intensity: editCheckInSelectedIntensity,
                goal: editGoal,
                physical_strength: editPhysicalStrength,
                mental_strength: editMentalStrength,
                recovered: editRecovered,
                confidence: editCheckInConfidence,
                sleep: editSleep,
                energy: editEnergy,
                stress: editStress,
                soreness: editSoreness,
                readiness: editReadiness,
                focus: editCheckInFocus,
                excitement: editExcitement,
                body_connection: editBodyConnection,
                concerns: editConcerns,
                physical_score: calculatePhysicalScore(),
                mental_score: calculateMentalScore(),
                overall_score: calculateOverallScore(),
                created_at: checkin.first?.created_at ?? ""
            )
            
            do {
                try await supabase
                    .from("journal_daily_checkins")
                    .update(updatedCheckIn)
                    .eq("id", value: checkInId)
                    .execute()
                
                self.checkin = [updatedCheckIn]
                isEditMode = false
                alertTitle = "Success!"
                alertMessage = "Your check-in has been updated."
            } catch {
                self.error = error
                alertTitle = "Error"
                alertMessage = "Failed to update check-in: \(error.localizedDescription)"
            }
            
            alertShown = true
            isSaving = false
        }
        
        var ouraShareText: String {
            guard let ouraData = ouraSleepData else { return "" }
            var text = "\n"
            if let sleepHours = ouraData.sleepDurationHours {
                text += "Sleep Duration: \(String(format: "%.1f", sleepHours)) hrs\n"
            }
            if let hrv = ouraData.averageHrv {
                text += "HRV: \(String(format: "%.0f", hrv)) ms\n"
            }
            if let readinessScore = ouraData.readinessScore {
                text += "Readiness Score: \(readinessScore)\n"
            }
            if let avgHeartRate = ouraData.averageHeartRate {
                text += "Average Heart Rate: \(String(format: "%.0f", avgHeartRate)) bpm\n"
            }
            return text.isEmpty ? "" : text
        }
        
        var whoopShareText: String {
            guard let whoopData = whoopData else { return "" }
            var text = "\n"
            if let recoveryScore = whoopData.recoveryScore {
                text += "Recovery Score: \(recoveryScore)%\n"
            }
            if let sleepHours = whoopData.sleepDurationHours {
                text += "Sleep Duration: \(String(format: "%.1f", sleepHours)) hrs\n"
            }
            if let sleepPerformance = whoopData.sleepPerformance {
                text += "Sleep Performance: \(sleepPerformance)%\n"
            }
            if let strainScore = whoopData.strainScore {
                text += "Strain Score: \(String(format: "%.1f", strainScore))\n"
            }
            if let hrv = whoopData.hrvMs {
                text += "HRV: \(hrv) ms\n"
            }
            if let restingHeartRate = whoopData.restingHeartRate {
                text += "Resting Heart Rate: \(restingHeartRate) bpm\n"
            }
            return text.isEmpty ? "" : text
        }
        
        func shareTextResult(selection: String, userSport: String) -> String {
            if selection == "Meets" {
                if userSport == "Olympic Weightlifting" {
                    return """
                        Meet Results for \(comp.first?.meet ?? "") - \(dateFormat(comp.first?.meet_date ?? "") ?? "")
                    
                        Bodyweight: \(comp.first?.bodyweight ?? "")
                    
                        \(comp.first?.snatch_best ?? 0)/\(comp.first?.cj_best ?? 0)/\((comp.first?.snatch_best ?? 0) + (comp.first?.cj_best ?? 0))
                    
                        Performance Rating: \(comp.first?.performance_rating ?? 0)/5
                        Physical Preparedness Rating: \(comp.first?.physical_preparedness_rating ?? 0)/5
                        Mental Preparedness Rating: \(comp.first?.mental_preparedness_rating ?? 0)/5
                    
                        How my nutrition was: \(comp.first?.nutrition ?? "")
                    
                        How my hydration was: \(comp.first?.hydration ?? "")
                    
                        What I did well: \(comp.first?.did_well ?? "")
                    
                        What I could have done better: \(comp.first?.needs_work ?? "")
                    
                        What in training helped me feel prepared: \(comp.first?.good_from_training ?? "")
                    
                        Cues that helped: \(comp.first?.cues ?? "")
                    
                        Satisfaction: \(comp.first?.satisfaction ?? 0)/5
                        Confidence: \(comp.first?.confidence ?? 0)/5
                        Pressure Handling: \(comp.first?.pressure_handling ?? 0)/5
                    
                        What I learned about myself: \(comp.first?.what_learned ?? "")
                    
                        What I'm most proud of: \(comp.first?.what_proud_of ?? "")
                    
                        What I need to focus on next meet: \(comp.first?.focus ?? "")

                        \(ouraShareText)
                        
                        \(whoopShareText)
                        
                        Powered By Forge - Performance Journal
                    """
                } else {
                    return """
                        Meet Results for \(comp.first?.meet ?? "") - \(dateFormat(comp.first?.meet_date ?? "") ?? "")
                    
                        Bodyweight: \(comp.first?.bodyweight ?? "")
                    
                        \(comp.first?.squat_best ?? 0)/\(comp.first?.bench_best ?? 0)/\(comp.first?.deadlift_best ?? 0)/\((comp.first?.squat_best ?? 0) + (comp.first?.bench_best ?? 0) + (comp.first?.deadlift_best ?? 0))
                    
                        Performance Rating: \(comp.first?.performance_rating ?? 0)/5
                        Physical Preparedness Rating: \(comp.first?.physical_preparedness_rating ?? 0)/5
                        Mental Preparedness Rating: \(comp.first?.mental_preparedness_rating ?? 0)/5
                    
                        How my nutrition was: \(comp.first?.nutrition ?? "")
                    
                        How my hydration was: \(comp.first?.hydration ?? "")
                    
                        What I did well: \(comp.first?.did_well ?? "")
                    
                        What I could have done better: \(comp.first?.needs_work ?? "")
                    
                        What in training helped me feel prepared: \(comp.first?.good_from_training ?? "")
                    
                        Cues that helped: \(comp.first?.cues ?? "")
                    
                        Satisfaction: \(comp.first?.satisfaction ?? 0)/5
                        Confidence: \(comp.first?.confidence ?? 0)/5
                        Pressure Handling: \(comp.first?.pressure_handling ?? 0)/5
                    
                        What I learned about myself: \(comp.first?.what_learned ?? "")
                    
                        What I'm most proud of: \(comp.first?.what_proud_of ?? "")
                    
                        What I need to focus on next meet: \(comp.first?.focus ?? "")

                        \(ouraShareText)

                        \(whoopShareText)

                        Powered By Forge - Performance Journal
                    """
                }
            } else if selection == "Workouts" {
                return """
                    Session Results for \(dateFormat(session.first?.session_date ??  "") ?? "")
                    I trained in the \(session.first?.time_of_day ?? "")
                    Session Focus: \(session.first?.selected_intensity ?? "") \(session.first?.selected_lift ?? "")
                
                    Session RPE: \(session.first?.session_rpe ?? 0)/5
                    Movement Quality Rating: \(session.first?.movement_quality ?? 0)/5
                    Focus Rating: \(session.first?.focus ?? 0)/5
                    Count of Misses: \(session.first?.misses ?? "")
                    Helpful Cues: \(session.first?.cues ?? "")
                
                    My body is feeling: \(session.first?.feeling ?? 0)/5
                    Satisfaction: \(session.first?.satisfaction ?? 0)/5
                    Confidence: \(session.first?.confidence ?? 0)/5
                
                    What I learned: \(session.first?.what_learned ?? "")
                    What I would do differently: \(session.first?.what_would_change ?? "")

                    \(ouraShareText)
                    
                    \(whoopShareText)
                    
                    Powered By Forge - Performance Journal
                """
            } else {
                return """
                    Check-In Results for \(dateFormat(checkin.first?.check_in_date ?? "") ?? "")
                
                    Overall Readiness: \(checkin.first?.overall_score ?? 0)%
                    Physical Readiness: \(checkin.first?.physical_score ?? 0)%
                    Mental Readiness: \(checkin.first?.mental_score ?? 0)%
                
                    Physical Rating: \(checkin.first?.physical_strength ?? 0)/5
                    Mental Rating: \(checkin.first?.mental_strength ?? 0)/5
                    Recovery Rating: \(checkin.first?.recovered ?? 0)/5
                    Confidence Rating: \(checkin.first?.confidence ?? 0)/5
                    Sleep Rating: \(checkin.first?.sleep ?? 0)/5
                    Energy Rating: \(checkin.first?.energy ?? 0)/5
                    Stress Rating: \(checkin.first?.stress ?? 0)/5
                    Soreness Rating: \(checkin.first?.soreness ?? 0)/5
                    Readiness: \(checkin.first?.readiness ?? 0)/5
                    Focus: \(checkin.first?.focus ?? 0)/5
                    Excitement: \(checkin.first?.excitement ?? 0)/5
                    Body Connection: \(checkin.first?.body_connection ?? 0)/5
                
                    Daily Goal: \(checkin.first?.goal ?? "")
                    Concerns: \(checkin.first?.concerns ?? "")

                    \(ouraShareText)
                    
                    \(whoopShareText)
                    
                    Powered By Forge - Performance Journal
                """
            }
        }
        
        func deleteCompReport(reportId: Int) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_comp_report")
                    .delete()
                    .eq("id", value: reportId)
                    .execute()
            } catch {
                self.error = error
                print("Error deleting comp report: \(error.localizedDescription)")
            }
            
            isLoading = false
        }
        
        func deleteSessionReport(reportId: Int) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_session_report")
                    .delete()
                    .eq("id", value: reportId)
                    .execute()
            } catch {
                self.error = error
                print("Error deleting session report: \(error.localizedDescription)")
            }
            
            isLoading = false
        }
        
        func deleteCheckIn(checkInId: Int) async {
            isLoading = true
            error = nil
            
            do {
                try await supabase
                    .from("journal_daily_checkins")
                    .delete()
                    .eq("id", value: checkInId)
                    .execute()
            } catch {
                self.error = error
                print("Error deleting check-in: \(error.localizedDescription)")
            }
            
            isLoading = false
        }
        
        func fetchCompDetails(user_id: String, title: String, date: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_comp_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .eq("meet", value: title)
                    .eq("meet_date", value: date)
                    .order("meet_date", ascending: false)
                    .execute()
                
                let row = try JSONDecoder().decode([CompReport].self, from: response.data)
                
                self.comp.removeAll()
                self.comp = row
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
        
        func fetchSessionDetails(user_id: String, title: String, date: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_session_report")
                    .select()
                    .eq("user_id", value: user_id)
                    .eq("selected_lift", value: title)
                    .eq("session_date", value: date)
                    .order("session_date", ascending: false)
                    .execute()
                
                let row = try JSONDecoder().decode([SessionReport].self, from: response.data)
                
                self.session.removeAll()
                self.session = row
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
        
        func fetchCheckInDetails(user_id: String, title: String, date: String) async {
            isLoading = true
            
            do {
                let response = try await supabase
                    .from("journal_daily_checkins")
                    .select()
                    .eq("user_id", value: user_id)
                    .eq("selected_lift", value: title)
                    .eq("check_in_date", value: date)
                    .order("check_in_date", ascending: false)
                    .execute()
                
                let row = try JSONDecoder().decode([DailyCheckIn].self, from: response.data)
                
                self.checkin.removeAll()
                self.checkin = row
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
    }
}
