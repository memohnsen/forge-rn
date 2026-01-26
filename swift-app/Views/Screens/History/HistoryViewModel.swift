//
//  HistoryViewModel.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/10/26.
//

import Foundation
import Supabase

@Observable
class HistoryViewModel {
    var checkIns: [DailyCheckIn] = []
    var compReport: [CompReport] = []
    var sessionReport: [SessionReport] = []
    var isLoading = false
    var error: Error?
    
    var selected = "Check-Ins"
    
    func fetchCheckins(user_id: String) async {
        isLoading = true
        
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
    
    func fetchCompReports(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_comp_report")
                .select()
                .eq("user_id", value: user_id)
                .order("meet_date", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([CompReport].self, from: response.data)
            
            self.compReport.removeAll()
            self.compReport = row
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
    
    func fetchSessionReport(user_id: String) async {
        isLoading = true
        
        do {
            let response = try await supabase
                .from("journal_session_report")
                .select()
                .eq("user_id", value: user_id)
                .order("session_date", ascending: false)
                .execute()
            
            let row = try JSONDecoder().decode([SessionReport].self, from: response.data)
            
            self.sessionReport.removeAll()
            self.sessionReport = row
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

