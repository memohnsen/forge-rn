//
//  CheckInModel.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation

struct DailyCheckIn: Codable, Hashable, Identifiable {
    var id: Int?
    var user_id: String
    var check_in_date: String
    var selected_lift: String
    var selected_intensity: String
    var goal: String
    var physical_strength: Int
    var mental_strength: Int
    var recovered: Int
    var confidence: Int
    var sleep: Int
    var energy: Int
    var stress: Int
    var soreness: Int
    var readiness: Int
    var focus: Int
    var excitement: Int
    var body_connection: Int
    var concerns: String?
    var physical_score: Int
    var mental_score: Int
    var overall_score: Int
    var created_at: String
}
