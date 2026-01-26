//
//  File.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/9/26.
//

import Foundation
import SwiftUI

struct StepInfo {
    let instruction: String
    let description: String
    let count: Int?
    let sense: String?
}

extension ExternalAnchorView{
    @Observable
    class ViewModel {
        var currentStep: Int = 0
        var userInputs: [String] = Array(repeating: "", count: 7)
        var currentInput: String = ""
        var transitionOffset: CGFloat = 0
        
        let steps: [StepInfo] = [
            StepInfo(
                instruction: "Take a deep breath",
                description: "Begin by taking a slow, deep breath. Inhale through your nose, hold for a moment, then exhale slowly.",
                count: nil,
                sense: nil
            ),
            StepInfo(
                instruction: "Find 5 things you can see",
                description: "Look around your environment and identify five distinct objects you can see.",
                count: 5,
                sense: "see"
            ),
            StepInfo(
                instruction: "Find 4 things you can feel",
                description: "Notice four different physical sensations you can feel right now.",
                count: 4,
                sense: "feel"
            ),
            StepInfo(
                instruction: "Find 3 things you can hear",
                description: "Listen carefully and identify three distinct sounds in your environment.",
                count: 3,
                sense: "hear"
            ),
            StepInfo(
                instruction: "Find 2 things you can smell",
                description: "Take a moment to notice two different scents or smells around you.",
                count: 2,
                sense: "smell"
            ),
            StepInfo(
                instruction: "Find 1 thing you can taste",
                description: "Notice one thing you can taste, or think of your favorite flavor if nothing is present.",
                count: 1,
                sense: "taste"
            ),
            StepInfo(
                instruction: "Take another deep breath",
                description: "Finish by taking another slow, deep breath. Remind yourself that you are safe and grounded.",
                count: nil,
                sense: nil
            )
        ]
        
        var currentStepInfo: StepInfo {
            steps[currentStep]
        }
        
        var stepColor: Color {
            switch currentStep {
            case 0:
                return Color(red: 0.85, green: 0.75, blue: 0.95)
            case 1:
                return Color(red: 0.75, green: 0.85, blue: 0.95)
            case 2:
                return Color(red: 0.70, green: 0.90, blue: 0.95)
            case 3:
                return Color(red: 0.65, green: 0.85, blue: 0.90)
            case 4:
                return Color(red: 0.60, green: 0.80, blue: 0.85)
            case 5:
                return Color(red: 0.55, green: 0.75, blue: 0.80)
            case 6:
                return Color(red: 0.80, green: 0.90, blue: 0.95)
            default:
                return Color(red: 0.75, green: 0.85, blue: 0.95)
            }
        }
    }
}
