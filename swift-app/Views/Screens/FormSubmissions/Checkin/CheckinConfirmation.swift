//
//  CheckinConfirmation.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import ConfettiSwiftUI
import StoreKit

struct CheckinConfirmation: View {
    @Environment(\.requestReview) var requestReview
    @Environment(\.colorScheme) var colorScheme
    @AppStorage("checkinCount") var checkinCount: Int = 0
    @Bindable var checkInScore: CheckInScore
    @State private var confettiCannon: Int = 0
    @State private var isVisible: Bool = false
    
    @Binding var selectedLift: String
    @Binding var selectedIntensity: String
    
    var shareTextResult: String {
        """
            Check-In Results for \(checkInScore.checkInDate.formatted(date: .abbreviated, time: .omitted))
        
            Overall Readiness: \(checkInScore.overallScore)%
            Physical Readiness: \(checkInScore.physicalScore)%
            Mental Readiness: \(checkInScore.mentalScore)%
        
            Physical Rating: \(checkInScore.physicalStrength)/5
            Mental Rating: \(checkInScore.mentalStrength)/5
            Recovery Rating: \(checkInScore.recovered)/5
            Confidence Rating: \(checkInScore.confidence)/5
            Sleep Rating: \(checkInScore.sleep)/5
            Energy Rating: \(checkInScore.energy)/5
            Stress Rating: \(checkInScore.stress)/5
            Soreness Rating: \(checkInScore.soreness)/5
        
            Daily Goal: \(checkInScore.goal)
        
            Powered By MeetJournal
        """
    }

    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) {
                        ResultsSection(checkInScore: checkInScore)
                        
                        ShareLink(item: shareTextResult, subject: Text("Share Your Check-In")) {
                            HStack(spacing: 10) {
                                Image(systemName: "square.and.arrow.up")
                                    .font(.subheadline.weight(.semibold))
                                Text("Send To Your Coach")
                                    .font(.headline.weight(.semibold))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .foregroundStyle(.white)
                            .background(
                                LinearGradient(
                                    colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .shadow(color: blueEnergy.opacity(0.3), radius: 8, x: 0, y: 4)
                        }
                        .padding(.horizontal)
                        .padding(.top, 8)
                        .padding(.bottom, 30)
                        .opacity(isVisible ? 1 : 0)
                        .offset(y: isVisible ? 0 : 20)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7).delay(0.4), value: isVisible)
                    }
                }
            }
            .confettiCannon(trigger: $confettiCannon, num: 300, radius: 600, hapticFeedback: true)
            .onAppear {
                isVisible = true
                if checkInScore.overallScore >= 80 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                        confettiCannon += 1
                    }
                }
                checkinCount += 1
                
                if checkinCount == 5 || checkinCount == 30 {
                    requestReview()
                }
            }
            .onDisappear {
                checkInScore.physicalStrength = 3
                checkInScore.mentalStrength = 3
                checkInScore.recovered = 3
                checkInScore.confidence = 3
                checkInScore.sleep = 3
                checkInScore.energy = 3
                checkInScore.stress = 3
                checkInScore.soreness = 3
                checkInScore.goal = ""
            }
            .navigationTitle("Check-In Submitted!")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                AnalyticsManager.shared.trackScreenView("CheckinConfirmation")
            }
        }
    }
}

struct ResultsSection: View {
    @Environment(\.colorScheme) var colorScheme
    @Bindable var checkInScore: CheckInScore
    @State private var isVisible: Bool = false
    
    private var scoreColor: Color {
        if checkInScore.overallScore >= 80 {
            return .green
        } else if checkInScore.overallScore >= 60 {
            return .orange
        } else {
            return .red
        }
    }
    
    func motivationalMessage(for score: Int) -> String {
        switch score {
        case 90...100:
            return "You're crushing it!"
        case 75...89:
            return "Looking strong today!"
        case 60...74:
            return "Ready to work!"
        case 40...59:
            return "Time to dig deep today!"
        default:
            return "Consider taking today a little easier"
        }
    }
    
    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [scoreColor.opacity(0.3), scoreColor.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 14
                        )
                        .frame(width: 180, height: 180)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(checkInScore.overallScore) / 100)
                        .stroke(
                            LinearGradient(
                                colors: [scoreColor, scoreColor.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 14, lineCap: .round)
                        )
                        .frame(width: 180, height: 180)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 1.2, dampingFraction: 0.8), value: checkInScore.overallScore)
                    
                    VStack(spacing: 4) {
                        Text("\(checkInScore.overallScore)%")
                            .font(.system(size: 52, weight: .bold))
                            .foregroundStyle(scoreColor)
                    }
                }
                
                Text("Overall Readiness")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                Text(motivationalMessage(for: checkInScore.overallScore))
                    .font(.subheadline)
                    .foregroundStyle(scoreColor)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
            .padding(.top, 8)
            
            Rectangle()
                .fill(colorScheme == .light ? Color.black.opacity(0.06) : Color.white.opacity(0.08))
                .frame(height: 1)
                .padding(.horizontal, 24)
            
            HStack(spacing: 24) {
                ReadinessScoreCircle(
                    score: checkInScore.physicalScore,
                    label: "Physical",
                    icon: "figure.strengthtraining.traditional"
                )
                
                ReadinessScoreCircle(
                    score: checkInScore.mentalScore,
                    label: "Mental",
                    icon: "brain.head.profile"
                )
            }
            .padding(.bottom, 8)
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: scoreColor.opacity(0.1), radius: 16, x: 0, y: 6)
                .shadow(color: Color.black.opacity(0.06), radius: 8, x: 0, y: 3)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(
                    LinearGradient(
                        colors: [scoreColor.opacity(0.25), scoreColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding()
        .opacity(isVisible ? 1 : 0)
        .offset(y: isVisible ? 0 : 30)
        .animation(.spring(response: 0.6, dampingFraction: 0.7).delay(0.1), value: isVisible)
        .onAppear {
            isVisible = true
        }
    }
}

struct ReadinessScoreCircle: View {
    @Environment(\.colorScheme) var colorScheme
    var score: Int
    var label: String
    var icon: String
    
    private var scoreColor: Color {
        if score >= 80 {
            return .green
        } else if score >= 60 {
            return .orange
        } else {
            return .red
        }
    }
    
    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [scoreColor.opacity(0.25), scoreColor.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 8
                    )
                    .frame(width: 110, height: 110)
                
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(
                        LinearGradient(
                            colors: [scoreColor, scoreColor.opacity(0.7)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .frame(width: 110, height: 110)
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 1.2, dampingFraction: 0.8), value: score)
                
                Text("\(score)%")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(scoreColor)
            }
            
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.subheadline)
                    .foregroundStyle(scoreColor)
                
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
            }
        }
    }
}

#Preview {
    struct CheckinConfirmation_PreviewContainer: View {
        @State private var checkInScore = CheckInScore()
        @State private var selectedLift: String = "Snatch"
        @State private var selectedIntensity: String = "Moderate"
        
        var body: some View {
            CheckinConfirmation(
                checkInScore: checkInScore,
                selectedLift: $selectedLift,
                selectedIntensity: $selectedIntensity
            )
        }
    }

    return CheckinConfirmation_PreviewContainer()
}
