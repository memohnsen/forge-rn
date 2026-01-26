//
//  ObjectiveReviewModel.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/31/25.
//

import Foundation

struct ObjectiveReview: Codable, Hashable, Identifiable {
    var id: Int?
    var user_id: String
    var athlete_vent: String
    var coach_reframe: String
    var created_at: String
}

