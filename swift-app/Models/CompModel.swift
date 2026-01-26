//
//  CompModel.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation

struct CompReport: Codable, Hashable {
    var id: Int?
    var user_id: String
    var meet: String
    var selected_meet_type: String
    var meet_date: String
    var bodyweight: String
    var performance_rating: Int
    var physical_preparedness_rating: Int
    var mental_preparedness_rating: Int
    var nutrition: String
    var hydration: String
    var did_well: String
    var needs_work: String
    var good_from_training: String
    var cues: String
    var focus: String
    var satisfaction: Int
    var confidence: Int
    var pressure_handling: Int
    var what_learned: String
    var what_proud_of: String
    var snatch1: String?
    var snatch2: String?
    var snatch3: String?
    var cj1: String?
    var cj2: String?
    var cj3: String?
    var snatch_best: Int?
    var cj_best: Int?
    var squat1: String?
    var squat2: String?
    var squat3: String?
    var bench1: String?
    var bench2: String?
    var bench3: String?
    var deadlift1: String?
    var deadlift2: String?
    var deadlift3: String?
    var squat_best: Int?
    var bench_best: Int?
    var deadlift_best: Int?
    var created_at: String
}
