import Foundation
import Clerk

@Observable
class OpenRouter {
    private let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String
    private var edgeFunctionURL: String {
        return "\(supabaseURL)/functions/v1/openrouter-proxy"
    }
    
    // google/gemini-2.5-flash       | $0.30 in | $2.5 out | poor analysis, not good at spotting trends, convulted
    // google/gemini-3-flash-preview | $0.50 in | $3 out   | ues big words, but very good analysis, found trends successfully
    // anthropic/claude-sonnet-4.5   | $3 in    | $15 out  | slowest, verbose, less big words
    // xiaomi/mimo-v2-flash:free     | free     | free     | correlated scores to overall, bad analysis
    // minimax/minimax-m2            | $0.20 in | $1 out   | cheap, poor at instructions
    
    // google/gemini-3-flash-preview | $0.50 in | $3 out   | outstanding at script gen
    private let model = "google/gemini-3-flash-preview"
    
    var response: String = ""
    var isLoading: Bool = false
    
    func query(prompt: String, purpose: String = "general") async throws -> String {
        isLoading = true
        defer { isLoading = false }
        
        let promptLength = prompt.count
        
        guard let session = Clerk.shared.session else {
            AnalyticsManager.shared.trackOpenRouterAPICall(
                model: model,
                purpose: purpose,
                promptLength: promptLength,
                success: false,
                errorMessage: "User not authenticated"
            )
            throw NSError(domain: "OpenRouterError", code: -4, userInfo: [NSLocalizedDescriptionKey: "User not authenticated"])
        }
        
        guard let token = try await session.getToken() else {
            AnalyticsManager.shared.trackOpenRouterAPICall(
                model: model,
                purpose: purpose,
                promptLength: promptLength,
                success: false,
                errorMessage: "Failed to get auth token"
            )
            throw NSError(domain: "OpenRouterError", code: -5, userInfo: [NSLocalizedDescriptionKey: "Failed to get auth token"])
        }
        
        guard let requestURL = URL(string: edgeFunctionURL) else {
            AnalyticsManager.shared.trackOpenRouterAPICall(
                model: model,
                purpose: purpose,
                promptLength: promptLength,
                success: false,
                errorMessage: "Invalid URL"
            )
            throw NSError(domain: "OpenRouterError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let requestBody: [String: Any] = [
            "model": model,
            "messages": [
                ["role": "user", "content": prompt]
            ]
        ]
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token.jwt)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
        
        do {
            let (data, urlResponse) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = urlResponse as? HTTPURLResponse else {
                AnalyticsManager.shared.trackOpenRouterAPICall(
                    model: model,
                    purpose: purpose,
                    promptLength: promptLength,
                    success: false,
                    errorMessage: "Invalid response"
                )
                throw NSError(domain: "OpenRouterError", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
            }
            
            guard httpResponse.statusCode == 200 else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                AnalyticsManager.shared.trackOpenRouterAPICall(
                    model: model,
                    purpose: purpose,
                    promptLength: promptLength,
                    success: false,
                    errorMessage: "HTTP \(httpResponse.statusCode): \(errorMessage)"
                )
                throw NSError(domain: "OpenRouterError", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Edge function error: \(errorMessage)"])
            }
            
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard let choices = json?["choices"] as? [[String: Any]],
                  let firstChoice = choices.first,
                  let message = firstChoice["message"] as? [String: Any],
                  let content = message["content"] as? String else {
                AnalyticsManager.shared.trackOpenRouterAPICall(
                    model: model,
                    purpose: purpose,
                    promptLength: promptLength,
                    success: false,
                    errorMessage: "Failed to parse response"
                )
                throw NSError(domain: "OpenRouterError", code: -3, userInfo: [NSLocalizedDescriptionKey: "Failed to parse response"])
            }
            
            self.response = content
            
            AnalyticsManager.shared.trackOpenRouterAPICall(
                model: model,
                purpose: purpose,
                promptLength: promptLength,
                success: true
            )
            
            return self.response
            
        } catch {
            if (error as NSError).domain != "OpenRouterError" {
                AnalyticsManager.shared.trackOpenRouterAPICall(
                    model: model,
                    purpose: purpose,
                    promptLength: promptLength,
                    success: false,
                    errorMessage: error.localizedDescription
                )
            }
            throw error
        }
    }
}
