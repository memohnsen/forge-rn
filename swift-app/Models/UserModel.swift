//
//  UserModel.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation

struct Users: Codable, Identifiable, Hashable {
    var id: Int?
    var user_id: String
    var first_name: String
    var last_name: String
    var sport: String
    var years_of_experience: Int
    var meets_per_year: Int
    var goal: String
    var biggest_struggle: String
    var training_days: [String: String]
    var next_competition: String
    var next_competition_date: String
    var current_tracking_method: String
    var biggest_frustration: String
    var reflection_frequency: String
    var what_holding_back: String
    var coach_email: String?
    var oura_refresh_token: String?
    var whoop_refresh_token: String?
    var store_token: Bool?
    var created_at: String?
}

struct Sport: Codable, Hashable {
    var id: Int?
    var user_id: String
    var sport: String
}
