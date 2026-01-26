//
//  WhoopModels.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import Foundation

// MARK: - Token Response
struct WhoopTokenResponse: Codable {
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

// MARK: - Webhook Subscription
struct WhoopWebhookSubscription: Codable {
    let id: String?
    let callbackUrl: String?
    let url: String?
    let verificationToken: String?
    let eventType: String?
    let enabled: Bool?
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case callbackUrl = "callback_url"
        case url
        case verificationToken = "verification_token"
        case eventType = "event_type"
        case enabled
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Webhook Event
struct WhoopWebhookEvent: Codable {
    let eventType: String
    let userId: String
    let resourceId: String?
    let timestamp: String?
    
    enum CodingKeys: String, CodingKey {
        case eventType = "event_type"
        case userId = "user_id"
        case resourceId = "resource_id"
        case timestamp
    }
}

// MARK: - Sleep Data (from /v2/activity/sleep endpoint)
struct WhoopSleep: Codable, Identifiable {
    let id: String
    let cycleId: Int?
    let v1Id: Int?
    let userId: Int?
    let createdAt: String?
    let updatedAt: String?
    let start: String
    let end: String
    let timezoneOffset: String?
    let nap: Bool?
    let scoreState: String?
    let score: WhoopSleepScore?
    
    enum CodingKeys: String, CodingKey {
        case id
        case cycleId = "cycle_id"
        case v1Id = "v1_id"
        case userId = "user_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case start
        case end
        case timezoneOffset = "timezone_offset"
        case nap
        case scoreState = "score_state"
        case score
    }
    
    var sleepDurationHours: Double? {
        print("📊 [WhoopSleep] Calculating sleep duration for sleep ID: \(id)")
        print("📊 [WhoopSleep] Start: \(start), End: \(end)")
        
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let startDate = dateFormatter.date(from: start) else {
            print("⚠️ [WhoopSleep] Failed to parse start date: \(start)")
            return nil
        }
        
        guard let endDate = dateFormatter.date(from: end) else {
            print("⚠️ [WhoopSleep] Failed to parse end date: \(end)")
            return nil
        }
        
        let durationSeconds = endDate.timeIntervalSince(startDate)
        let durationHours = durationSeconds / 3600.0
        
        print("✅ [WhoopSleep] Calculated duration: \(String(format: "%.2f", durationHours)) hours (\(durationSeconds) seconds)")
        return durationHours
    }
    
    var sleepPerformance: Int? {
        return score?.sleepPerformancePercentage
    }
    
    var sleepEfficiency: Double? {
        return score?.sleepEfficiencyPercentage
    }
    
    var respiratoryRate: Double? {
        return score?.respiratoryRate
    }
}

// MARK: - Sleep Score (nested in sleep response)
struct WhoopSleepScore: Codable {
    let stageSummary: WhoopStageSummary?
    let sleepNeeded: WhoopSleepNeeded?
    let respiratoryRate: Double?
    let sleepPerformancePercentage: Int?
    let sleepConsistencyPercentage: Int?
    let sleepEfficiencyPercentage: Double?
    
    enum CodingKeys: String, CodingKey {
        case stageSummary = "stage_summary"
        case sleepNeeded = "sleep_needed"
        case respiratoryRate = "respiratory_rate"
        case sleepPerformancePercentage = "sleep_performance_percentage"
        case sleepConsistencyPercentage = "sleep_consistency_percentage"
        case sleepEfficiencyPercentage = "sleep_efficiency_percentage"
    }
}

struct WhoopStageSummary: Codable {
    let totalInBedTimeMilli: Int?
    let totalAwakeTimeMilli: Int?
    let totalNoDataTimeMilli: Int?
    let totalLightSleepTimeMilli: Int?
    let totalSlowWaveSleepTimeMilli: Int?
    let totalRemSleepTimeMilli: Int?
    let sleepCycleCount: Int?
    let disturbanceCount: Int?
    
    enum CodingKeys: String, CodingKey {
        case totalInBedTimeMilli = "total_in_bed_time_milli"
        case totalAwakeTimeMilli = "total_awake_time_milli"
        case totalNoDataTimeMilli = "total_no_data_time_milli"
        case totalLightSleepTimeMilli = "total_light_sleep_time_milli"
        case totalSlowWaveSleepTimeMilli = "total_slow_wave_sleep_time_milli"
        case totalRemSleepTimeMilli = "total_rem_sleep_time_milli"
        case sleepCycleCount = "sleep_cycle_count"
        case disturbanceCount = "disturbance_count"
    }
}

struct WhoopSleepNeeded: Codable {
    let baselineMilli: Int?
    let needFromSleepDebtMilli: Int?
    let needFromRecentStrainMilli: Int?
    let needFromRecentNapMilli: Int?
    
    enum CodingKeys: String, CodingKey {
        case baselineMilli = "baseline_milli"
        case needFromSleepDebtMilli = "need_from_sleep_debt_milli"
        case needFromRecentStrainMilli = "need_from_recent_strain_milli"
        case needFromRecentNapMilli = "need_from_recent_nap_milli"
    }
}

// MARK: - Recovery Data (from /v2/recovery endpoint)
struct WhoopRecovery: Codable, Identifiable {
    let id: String
    let cycleId: Int?
    let v1Id: Int?
    let userId: Int?
    let createdAt: String?
    let updatedAt: String?
    let start: String
    let end: String
    let timezoneOffset: String?
    let scoreState: String?
    let score: WhoopRecoveryScore?
    
    enum CodingKeys: String, CodingKey {
        case id
        case cycleId = "cycle_id"
        case v1Id = "v1_id"
        case userId = "user_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case start
        case end
        case timezoneOffset = "timezone_offset"
        case scoreState = "score_state"
        case score
    }
    
    var recoveryScore: Int? {
        print("📊 [WhoopRecovery] Getting recovery score for recovery ID: \(id)")
        if let score = score?.recoveryScore {
            print("✅ [WhoopRecovery] Recovery score: \(score)")
            return score
        } else {
            print("⚠️ [WhoopRecovery] No recovery score found")
            return nil
        }
    }
    
    var restingHeartRate: Int? {
        print("📊 [WhoopRecovery] Getting resting heart rate for recovery ID: \(id)")
        if let rhr = score?.restingHeartRate {
            print("✅ [WhoopRecovery] Resting heart rate: \(rhr) bpm")
            return rhr
        } else {
            print("⚠️ [WhoopRecovery] No resting heart rate found")
            return nil
        }
    }
    
    var hrvRmssdMilli: Int? {
        print("📊 [WhoopRecovery] Getting HRV for recovery ID: \(id)")
        if let hrv = score?.hrvRmssdMilli {
            print("✅ [WhoopRecovery] HRV: \(hrv) ms")
            return hrv
        } else {
            print("⚠️ [WhoopRecovery] No HRV found")
            return nil
        }
    }
}

// MARK: - Recovery Score (nested in recovery response)
struct WhoopRecoveryScore: Codable {
    let recoveryScore: Int?
    let restingHeartRate: Int?
    let hrvRmssdMilli: Int?
    
    enum CodingKeys: String, CodingKey {
        case recoveryScore = "recovery_score"
        case restingHeartRate = "resting_heart_rate"
        case hrvRmssdMilli = "hrv_rmssd_milli"
    }
}

// MARK: - Cycle Data (from /v2/cycle endpoint)
struct WhoopCycle: Codable, Identifiable {
    let id: Int
    let userId: Int?
    let createdAt: String?
    let updatedAt: String?
    let start: String
    let end: String
    let timezoneOffset: String?
    let scoreState: String?
    let score: WhoopCycleScore?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
        case start
        case end
        case timezoneOffset = "timezone_offset"
        case scoreState = "score_state"
        case score
    }
    
    var strainScore: Double? {
        print("📊 [WhoopCycle] Getting strain score for cycle ID: \(id)")
        if let strain = score?.strain {
            print("✅ [WhoopCycle] Strain score: \(strain)")
            return strain
        } else {
            print("⚠️ [WhoopCycle] No strain score found")
            return nil
        }
    }
    
    var averageHeartRate: Int? {
        return score?.averageHeartRate
    }
    
    var maxHeartRate: Int? {
        return score?.maxHeartRate
    }
}

// MARK: - Cycle Score (nested in cycle response)
struct WhoopCycleScore: Codable {
    let strain: Double?
    let kilojoule: Double?
    let averageHeartRate: Int?
    let maxHeartRate: Int?
    
    enum CodingKeys: String, CodingKey {
        case strain
        case kilojoule
        case averageHeartRate = "average_heart_rate"
        case maxHeartRate = "max_heart_rate"
    }
}

// MARK: - Combined Daily Data Model (for UI display)
struct WhoopDailyData: Identifiable {
    let id: String
    let date: String
    let recoveryScore: Int?
    let sleepDurationHours: Double?
    let sleepPerformance: Int?
    let sleepConsistency: Int?
    let sleepEfficiency: Int?
    let strainScore: Double?
    let hrvMs: Int?
    let restingHeartRate: Int?
    let respiratoryRate: Double?
    
    init(recovery: WhoopRecovery?, sleep: WhoopSleep?, cycle: WhoopCycle?) {
        let recoveryId = recovery?.id ?? ""
        let sleepId = sleep?.id ?? ""
        let cycleId = "\(cycle?.id ?? 0)"
        
        self.id = recoveryId.isEmpty ? (sleepId.isEmpty ? cycleId : sleepId) : recoveryId
        
        if let recoveryStart = recovery?.start {
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = dateFormatter.date(from: recoveryStart) {
                let dateOnlyFormatter = DateFormatter()
                dateOnlyFormatter.dateFormat = "yyyy-MM-dd"
                self.date = dateOnlyFormatter.string(from: date)
            } else {
                self.date = ""
            }
        } else if let sleepStart = sleep?.start {
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = dateFormatter.date(from: sleepStart) {
                let dateOnlyFormatter = DateFormatter()
                dateOnlyFormatter.dateFormat = "yyyy-MM-dd"
                self.date = dateOnlyFormatter.string(from: date)
            } else {
                self.date = ""
            }
        } else if let cycleStart = cycle?.start {
            let dateFormatter = ISO8601DateFormatter()
            dateFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = dateFormatter.date(from: cycleStart) {
                let dateOnlyFormatter = DateFormatter()
                dateOnlyFormatter.dateFormat = "yyyy-MM-dd"
                self.date = dateOnlyFormatter.string(from: date)
            } else {
                self.date = ""
            }
        } else {
            self.date = ""
        }
        
        self.recoveryScore = recovery?.recoveryScore
        self.sleepDurationHours = sleep?.sleepDurationHours
        self.sleepPerformance = sleep?.sleepPerformance
        self.sleepConsistency = sleep?.score?.sleepConsistencyPercentage
        if let efficiency = sleep?.score?.sleepEfficiencyPercentage {
            self.sleepEfficiency = Int(efficiency)
        } else {
            self.sleepEfficiency = nil
        }
        self.strainScore = cycle?.strainScore
        self.hrvMs = recovery?.hrvRmssdMilli
        self.restingHeartRate = recovery?.restingHeartRate
        self.respiratoryRate = sleep?.score?.respiratoryRate
        
        print("📦 [WhoopDailyData] Created combined data for date: \(self.date)")
        print("📦 [WhoopDailyData] Recovery: \(recoveryScore != nil ? "\(recoveryScore!)" : "nil"), Sleep: \(sleepDurationHours != nil ? String(format: "%.2f", sleepDurationHours!) : "nil"), Strain: \(strainScore != nil ? String(format: "%.2f", strainScore!) : "nil")")
    }
}

// MARK: - WHOOP API Response Wrapper
// WHOOP API may return data as array directly or wrapped in an object
// This handles both cases
struct WhoopDataResponse<T: Codable>: Codable {
    let records: [T]
    
    init(from decoder: Decoder) throws {
        // Try to decode as array first (direct response)
        if let array = try? [T](from: decoder) {
            self.records = array
            print("📦 [WhoopDataResponse] Decoded as direct array: \(array.count) records")
            return
        }
        
        // Try to decode as object with records/data field
        let container = try decoder.container(keyedBy: CodingKeys.self)
        if let records = try? container.decode([T].self, forKey: .records) {
            self.records = records
            print("📦 [WhoopDataResponse] Decoded from 'records' key: \(records.count) records")
            return
        }
        
        if let data = try? container.decode([T].self, forKey: .data) {
            self.records = data
            print("📦 [WhoopDataResponse] Decoded from 'data' key: \(data.count) records")
            return
        }
        
        print("❌ [WhoopDataResponse] Failed to decode response - unknown format")
        throw WhoopError.dataParsingError("Unable to decode WHOOP API response")
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(records, forKey: .records)
    }
    
    enum CodingKeys: String, CodingKey {
        case records
        case data
    }
}

// MARK: - Error Types
enum WhoopError: LocalizedError {
    case invalidURL
    case invalidResponse
    case authError
    case tokenExchangeError(String)
    case apiError(statusCode: Int, message: String)
    case noAccessToken
    case keychainError
    case dataParsingError(String)
    
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
        case .dataParsingError(let message):
            return "Data parsing error: \(message)"
        }
    }
}

