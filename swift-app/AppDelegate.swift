//
//  Posthog.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/30/25.
//

import Foundation
import UIKit
import PostHog

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_: UIApplication, didFinishLaunchingWithOptions _: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let POSTHOG_API_KEY = Bundle.main.object(forInfoDictionaryKey: "POSTHOG_API_KEY") as! String
        let POSTHOG_HOST = Bundle.main.object(forInfoDictionaryKey: "POSTHOG_HOST") as! String

        let config = PostHogConfig(apiKey: POSTHOG_API_KEY, host: POSTHOG_HOST)
        
        PostHogSDK.shared.setup(config)

        return true
    }
}
