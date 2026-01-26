//
//  OuraModels.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation

// MARK: - Token Response
struct OuraTokenResponse: Codable {
    let accessToken: String
    let tokenType: String
    let expiresIn: Int?
    let refreshToken: String?
    let scope: String?
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case expiresIn = "expires_in"
        case refreshToken = "refresh_token"
        case scope
    }
}

// MARK: - User Info
struct OuraUserInfo: Codable {
    let id: String
    let age: Int?
    let weight: Double?
    let height: Double?
    let biologicalSex: String?
    let email: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case age
        case weight
        case height
        case biologicalSex = "biological_sex"
        case email
    }
}

// MARK: - Webhook Subscription
struct OuraWebhookSubscription: Codable {
    let id: String?
    let callbackUrl: String?
    let url: String?
    let verificationToken: String?
    let eventType: String?
    let dataType: String?
    let enabled: Bool?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case callbackUrl = "callback_url"
        case url
        case verificationToken = "verification_token"
        case eventType = "event_type"
        case dataType = "data_type"
        case enabled
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct OuraWebhookSubscriptionRequest: Codable {
    let url: String
    let enabled: Bool
}

// MARK: - Webhook Event
struct OuraWebhookEvent: Codable {
    let eventType: String
    let userId: String
    let dataIds: [String]?
    let timestamp: String?
    
    enum CodingKeys: String, CodingKey {
        case eventType = "event_type"
        case userId = "user_id"
        case dataIds = "data_ids"
        case timestamp
    }
}

// MARK: - Data Types
enum OuraDataType: String, CaseIterable {
    case sleep = "daily_sleep"
    case activity = "daily_activity"
    case readiness = "daily_readiness"
    case workout = "workout"
    case session = "session"
    case tag = "tag"
    
    var displayName: String {
        switch self {
        case .sleep: return "Sleep"
        case .activity: return "Activity"
        case .readiness: return "Readiness"
        case .workout: return "Workout"
        case .session: return "Session"
        case .tag: return "Tag"
        }
    }
}

// MARK: - Sleep Data (from /sleep endpoint)
struct OuraSleep: Codable, Identifiable {
    let id: String
    let averageBreath: Double?
    let averageHeartRate: Double?
    let averageHrv: Double?  // HRV in milliseconds
    let awakeTime: Int?
    let bedtimeEnd: String?
    let bedtimeStart: String?
    let day: String
    let deepSleepDuration: Int?
    let efficiency: Int?
    let latency: Int?
    let lightSleepDuration: Int?
    let lowestHeartRate: Int?
    let remSleepDuration: Int?
    let restlessPeriods: Int?
    let totalSleepDuration: Int?  // Sleep duration in seconds
    let timeInBed: Int?
    let readiness: ReadinessData?
    let readinessScoreDelta: Int?
    
    enum CodingKeys: String, CodingKey {
        case id
        case averageBreath = "average_breath"
        case averageHeartRate = "average_heart_rate"
        case averageHrv = "average_hrv"
        case awakeTime = "awake_time"
        case bedtimeEnd = "bedtime_end"
        case bedtimeStart = "bedtime_start"
        case day
        case deepSleepDuration = "deep_sleep_duration"
        case efficiency
        case latency
        case lightSleepDuration = "light_sleep_duration"
        case lowestHeartRate = "lowest_heart_rate"
        case remSleepDuration = "rem_sleep_duration"
        case restlessPeriods = "restless_periods"
        case totalSleepDuration = "total_sleep_duration"
        case timeInBed = "time_in_bed"
        case readiness
        case readinessScoreDelta = "readiness_score_delta"
    }
    
    var sleepDurationHours: Double? {
        if let duration = totalSleepDuration {
            return Double(duration) / 3600.0
        }
        
        // If duration not available, try to calculate from bedtime_start and bedtime_end
        if let start = bedtimeStart, let end = bedtimeEnd {
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            
            if let startDate = dateFormatter.date(from: start),
               let endDate = dateFormatter.date(from: end) {
                let duration = endDate.timeIntervalSince(startDate)
                return duration / 3600.0 // Convert seconds to hours
            }
        }
        
        return nil
    }
    
    var hrv: Double? {
        return averageHrv
    }
    
    var readinessScore: Int? {
        return readiness?.score
    }
}

// MARK: - Readiness Data (nested in sleep response)
struct ReadinessData: Codable {
    let contributors: ReadinessContributors?
    let score: Int?
    let temperatureDeviation: Double?
    let temperatureTrendDeviation: Double?
    
    enum CodingKeys: String, CodingKey {
        case contributors
        case score
        case temperatureDeviation = "temperature_deviation"
        case temperatureTrendDeviation = "temperature_trend_deviation"
    }
}

struct ReadinessContributors: Codable {
    let activityBalance: Int?
    let bodyTemperature: Int?
    let hrvBalance: Int?
    let previousDayActivity: Int?
    let previousNight: Int?
    let recoveryIndex: Int?
    let restingHeartRate: Int?
    let sleepBalance: Int?
    let sleepRegularity: Int?  
    
    enum CodingKeys: String, CodingKey {
        case activityBalance = "activity_balance"
        case bodyTemperature = "body_temperature"
        case hrvBalance = "hrv_balance"
        case previousDayActivity = "previous_day_activity"
        case previousNight = "previous_night"
        case recoveryIndex = "recovery_index"
        case restingHeartRate = "resting_heart_rate"
        case sleepBalance = "sleep_balance"
        case sleepRegularity = "sleep_regularity"
    }
}

// MARK: - Oura API Response Wrapper
struct OuraDataResponse<T: Codable>: Codable {
    let data: [T]
}

// MARK: - Error Types
enum OuraError: LocalizedError {
    case invalidURL
    case invalidResponse
    case authError
    case tokenExchangeError(String)
    case apiError(statusCode: Int, message: String)
    case noAccessToken
    case keychainError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .authError:
            return "Authentication failed"
        case .tokenExchangeError(let message):
            return "Token exchange failed: \(message)"
        case .apiError(let statusCode, let message):
            return "API Error (\(statusCode)): \(message)"
        case .noAccessToken:
            return "No access token available"
        case .keychainError:
            return "Keychain operation failed"
        }
    }
}

