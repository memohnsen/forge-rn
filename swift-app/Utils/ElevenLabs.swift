import Foundation
import Clerk

enum VoiceOption: String, CaseIterable, Identifiable {
    case matilda = "XrExE9yKIg1WjnnlVkGX"
    case brian = "nPczCjzI2devNBz1zQrb"
    case daniel = "onwK4e9ZLuTAKqWW03F9"
    
    var id: String { rawValue }
    
    var name: String {
        switch self {
        case .matilda: return "Matilda"
        case .brian: return "Brian"
        case .daniel: return "Daniel"
        }
    }
    
    var description: String {
        switch self {
        case .matilda: return "Warm"
        case .brian: return "Resonant"
        case .daniel: return "Steady"
        }
    }
}

@Observable
class ElevenLabs {
    private let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String
    private var edgeFunctionURL: String {
        return "\(supabaseURL)/functions/v1/elevenlabs"
    }
    
    var isLoading: Bool = false
    
    func textToSpeech(
        text: String,
        voice: VoiceOption = .matilda,
        stability: Double = 0.5,
        similarityBoost: Double = 0.75
    ) async throws -> Data {
        isLoading = true
        defer { isLoading = false }
        
        let textLength = text.count
        let startTime = Date()
        
        guard let session = Clerk.shared.session else {
            AnalyticsManager.shared.trackElevenLabsAPICall(
                voice: voice.name,
                textLength: textLength,
                audioDuration: nil,
                success: false,
                errorMessage: "User not authenticated"
            )
            throw ElevenLabsError.authError
        }
        
        guard let token = try await session.getToken() else {
            AnalyticsManager.shared.trackElevenLabsAPICall(
                voice: voice.name,
                textLength: textLength,
                audioDuration: nil,
                success: false,
                errorMessage: "Failed to get auth token"
            )
            throw ElevenLabsError.authError
        }
        
        guard let url = URL(string: edgeFunctionURL) else {
            AnalyticsManager.shared.trackElevenLabsAPICall(
                voice: voice.name,
                textLength: textLength,
                audioDuration: nil,
                success: false,
                errorMessage: "Invalid URL"
            )
            throw ElevenLabsError.invalidURL
        }
        
        let processedText = processSSMLBreaks(text)
        
        // Construct the request body for the edge function
        let edgeFunctionBody: [String: Any] = [
            "endpoint": "/text-to-speech/\(voice.rawValue)",
            "method": "POST",
            "body": [
                "text": processedText,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": [
                    "stability": stability,
                    "similarity_boost": similarityBoost,
                    "style": 0.0,
                    "use_speaker_boost": true
                ]
            ]
        ]
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token.jwt)", forHTTPHeaderField: "Authorization")
        
        request.httpBody = try JSONSerialization.data(withJSONObject: edgeFunctionBody)
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                AnalyticsManager.shared.trackElevenLabsAPICall(
                    voice: voice.name,
                    textLength: textLength,
                    audioDuration: nil,
                    success: false,
                    errorMessage: "Invalid response"
                )
                throw ElevenLabsError.invalidResponse
            }
            
            guard httpResponse.statusCode == 200 else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                AnalyticsManager.shared.trackElevenLabsAPICall(
                    voice: voice.name,
                    textLength: textLength,
                    audioDuration: nil,
                    success: false,
                    errorMessage: "HTTP \(httpResponse.statusCode): \(errorMessage)"
                )
                throw ElevenLabsError.apiError(statusCode: httpResponse.statusCode, message: errorMessage)
            }
            
            let duration = Date().timeIntervalSince(startTime)
            
            AnalyticsManager.shared.trackElevenLabsAPICall(
                voice: voice.name,
                textLength: textLength,
                audioDuration: duration,
                success: true
            )
            
            return data
            
        } catch {
            if (error as? ElevenLabsError) == nil {
                AnalyticsManager.shared.trackElevenLabsAPICall(
                    voice: voice.name,
                    textLength: textLength,
                    audioDuration: nil,
                    success: false,
                    errorMessage: error.localizedDescription
                )
            }
            throw error
        }
    }
    
    private func processSSMLBreaks(_ text: String) -> String {
        var processed = text
        
        let breakPattern = #"<break\s+time="(\d+\.?\d*)s"\s*/>"#
        
        guard let regex = try? NSRegularExpression(pattern: breakPattern, options: []) else {
            return text
        }
        
        let range = NSRange(processed.startIndex..., in: processed)
        let matches = regex.matches(in: processed, options: [], range: range)
        
        for match in matches.reversed() {
            guard let matchRange = Range(match.range, in: processed),
                  let timeRange = Range(match.range(at: 1), in: processed) else {
                continue
            }
            
            let timeString = String(processed[timeRange])
            let seconds = Double(timeString) ?? 1.0
            
            let pauseMarker: String
            if seconds < 1.5 {
                pauseMarker = " ... "
            } else if seconds < 3.0 {
                pauseMarker = " ... ... "
            } else {
                pauseMarker = " ... ... ... "
            }
            
            processed.replaceSubrange(matchRange, with: pauseMarker)
        }
        
        return processed
    }
}

enum ElevenLabsError: LocalizedError {
    case invalidURL
    case invalidResponse
    case authError
    case apiError(statusCode: Int, message: String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .authError:
            return "Authentication failed"
        case .apiError(let statusCode, let message):
            return "API Error (\(statusCode)): \(message)"
        }
    }
}
