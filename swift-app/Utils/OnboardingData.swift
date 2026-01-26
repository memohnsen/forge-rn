//
//  OnboardingData.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/27/25.
//

import Foundation

@Observable
class OnboardingData {
    var user_id: String = ""
    var firstName: String = ""
    var lastName: String = ""
    var sport: String = "Olympic Weightlifting"
    var yearsExperience: Int = 3
    var meetsPerYear: Int = 2
    var goal: String = ""
    var biggestStruggle: String = ""
    var trainingDays: [String: String] = [:]
    var nextComp: String = ""
    var nextCompDate: Date = Date.now
    var currentTrackingMethod: String = ""
    var biggestFrustration: String = ""
    var reflectionFrequency: String = ""
    var whatHoldingBack: String = ""
}
