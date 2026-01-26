//
//  FetchObjectiveReviews.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/31/25.
//

import Foundation
import Supabase
import Clerk

@MainActor @Observable
class ObjectiveReviewViewModel {
    // MARK: - HISTORY VIEW
    var isLoading: Bool = false
    var error: Error?
    var objectiveReviews: [ObjectiveReview] = []
    var expandedItems: Set<String> = []
    
    func fetchObjectiveReviews(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_objective_review")
                .select()
                .eq("user_id", value: user_id)
                .order("created_at", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([ObjectiveReview].self, from: response.data)
            
            self.objectiveReviews.removeAll()
            self.objectiveReviews = row
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
    
    func loadReviews() async {
        guard let userId = Clerk.shared.user?.id else { return }
        await fetchObjectiveReviews(user_id: userId)
    }
    
    func reviewIdentifier(_ review: ObjectiveReview) -> String {
        if let id = review.id {
            return "\(id)"
        }
        return review.created_at
    }
    
    // MARK: - ACTIVITY
    var sport: [Sport] = []
    var ventText: String = ""
    var coachReframe: String = ""
    var currentState: ObjectiveReviewState = .vent
    var showError: Bool = false
    var errorMessage: String = ""
    var userSport: String = ""
    var showHistory: Bool = false
    var showWriteAlert: Bool = false
    var breathingTextOpacity: Double = 0
    var alertTitle: String = ""
    var alertMessage: String = ""
    var alertShown: Bool = false
    
    private let openRouter = OpenRouter()
    
    var isReframing: Bool = false
    
    func reframeAthleteVent(ventText: String, sport: String) async throws -> String {
        isReframing = true
        error = nil
        defer { isReframing = false }
        
        let prompt = buildReframingPrompt(ventText: ventText, sport: sport)
        
        do {
            let reframedText = try await openRouter.query(prompt: prompt, purpose: "objective_review")
            return reframedText
        } catch {
            self.error = error
            throw error
        }
    }
    
    private func buildReframingPrompt(ventText: String, sport: String) -> String {
        """
        You are a professional \(sport) coach. An athlete just shared their emotional reaction to a set. Your job is to transform their emotional, subjective feedback into objective, actionable coaching cues.
        
        Athlete's emotional feedback:
        "\(ventText)"
        
        Transform this into objective coaching perspective. Focus on:
        1. Identifying the specific technical issue (bar path, positioning, timing, etc.)
        2. Providing concrete, actionable cues for the next attempt
        3. Using technical language appropriate for \(sport)
        4. Being direct and helpful, not overly positive or negative
        
        Format your response as a brief coaching note that the athlete can use as a training cue. Keep it concise (2-3 sentences max). Focus on what to do differently, not what went wrong.
        
        Example transformation:
        Athlete: "I'm a disaster. I let the bar drift forward and I just gave up because I felt weak."
        Coach: "The bar path drifted forward at the sticking point. Focus on 'chest up' and 'driving through the mid-foot' on the next attempt."
        
        Response Format:
            - No emojis
            - Do not include any greetings, get straight to the data
            - Write as plain text, no markdown
        """
    }
        
    func fetchUserSport(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_users")
                .select("sport")
                .eq("user_id", value: user_id)
                .execute()
            
            let row = try JSONDecoder().decode([Sport].self, from: response.data)
            
            self.sport.removeAll()
            self.sport = row
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
    
    var canProcess: Bool {
        !ventText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    func processReframing() async {
        currentState = .processing
        
        do {
            let reframed = try await reframeAthleteVent(
                ventText: ventText,
                sport: userSport
            )
            
            coachReframe = reframed
            currentState = .reframed
        } catch {
            errorMessage = error.localizedDescription
            showError = true
            currentState = .vent
        }
    }
    
    func saveToTrainingCues() async {
        guard let userId = Clerk.shared.user?.id else { return }
        
        let iso8601String = Date.now.formatted(.iso8601)
        
        let objectiveReview = ObjectiveReview(
            id: nil,
            user_id: userId,
            athlete_vent: ventText,
            coach_reframe: coachReframe,
            created_at: iso8601String
        )
        
        await submitObjectiveReview(objectiveReview: objectiveReview)
    }
    
    func resetView() {
        ventText = ""
        coachReframe = ""
        currentState = .vent
        breathingTextOpacity = 0
    }
    
    func submitObjectiveReview(objectiveReview: ObjectiveReview) async {
        isLoading = true
        error = nil
    
        do {
            try await supabase
                .from("journal_objective_review")
                .insert(objectiveReview)
                .execute()
            
            alertTitle = "Success!"
            alertMessage = "Your training cues have been saved!"
        } catch let DecodingError.keyNotFound(key, context) {
            print("Key '\(key.stringValue)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            
            alertTitle = "Error Saving Your Cues"
            alertMessage = context.debugDescription
        } catch let DecodingError.typeMismatch(type, context) {
            print("Type '\(type)' mismatch:", context.debugDescription)
            print("codingPath:", context.codingPath)
            
            alertTitle = "Error Saving Your Cues"
            alertMessage = context.debugDescription
        } catch let DecodingError.valueNotFound(value, context) {
            print("Value '\(value)' not found:", context.debugDescription)
            print("codingPath:", context.codingPath)
            
            alertTitle = "Error Saving Your Cues"
            alertMessage = context.debugDescription
        } catch let DecodingError.dataCorrupted(context) {
            print("Data corrupted:", context.debugDescription)
            print("codingPath:", context.codingPath)
            
            alertTitle = "Error Saving Your Cues"
            alertMessage = context.debugDescription
        } catch {
            print("Error: \(error.localizedDescription)")
            print("Full error: \(error)")
            
            alertTitle = "Error Saving Your Cues"
            alertMessage = error.localizedDescription
        }
        
        alertShown = true
        isLoading = false
    }
}

