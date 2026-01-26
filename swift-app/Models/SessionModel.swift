//
//  SessionModel.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation

struct SessionReport: Codable, Hashable {
    var id: Int?
    var user_id: String
    var session_date: String
    var time_of_day: String
    var session_rpe: Int
    var movement_quality: Int
    var focus: Int
    var misses: String
    var cues: String
    var feeling: Int
    var satisfaction: Int
    var confidence: Int
    var what_learned: String?
    var what_would_change: String?
    var selected_lift: String
    var selected_intensity: String
    var created_at: String
}
