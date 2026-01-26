//
//  Supabase.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import Foundation
import Supabase
import Clerk

let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String
let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_KEY") as! String

let supabase: SupabaseClient = {
    let options = SupabaseClientOptions(
        auth: .init(
            accessToken: {
                guard let session = Clerk.shared.session else {
                    return ""
                }
                
                let semaphore = DispatchSemaphore(value: 0)
                var jwtToken = ""
                
                Task {
                    do {
                        if let token = try await session.getToken() {
                            jwtToken = token.jwt
                        }
                    } catch {
                        print("Error getting Clerk token: \(error)")
                    }
                    semaphore.signal()
                }
                
                semaphore.wait()
                return jwtToken
            }
        )
    )
    
    return SupabaseClient(
        supabaseURL: URL(string: supabaseURL)!,
        supabaseKey: supabaseKey,
        options: options
    )
}()

func getSupabaseClient() -> SupabaseClient {
    return supabase
}
