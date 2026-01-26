//
//  MentalExercisesView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/31/25.
//

import SwiftUI

struct ExerciseItem: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let buttonName: String
    let icon: String
    let accentColor: Color
}

struct MentalExercisesView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var navigateToBoxBreathing: Bool = false
    @State private var navigateToVisualization: Bool = false
    @State private var navigateToObjectiveReview: Bool = false
    @State private var navigateToExternalAnchor: Bool = false
    @State private var hasAppeared: Bool = false
    
    private let exercises: [ExerciseItem] = [
        ExerciseItem(
            title: "Box Breathing",
            description: "Improve focus, calm the nervous system, and reduce stress.",
            buttonName: "Begin Breathing",
            icon: "wind",
            accentColor: Color(red: 100/255, green: 180/255, blue: 220/255)
        ),
        ExerciseItem(
            title: "Visualization",
            description: "Build consistency and confidence by mentally rehearsing every aspect of your lift.",
            buttonName: "Start Visualizing",
            icon: "eye.circle",
            accentColor: Color(red: 160/255, green: 120/255, blue: 200/255)
        ),
        ExerciseItem(
            title: "Objective Review",
            description: "Transform emotional reactions into actionable coaching cues.",
            buttonName: "Start Reframing",
            icon: "arrow.triangle.2.circlepath",
            accentColor: Color(red: 240/255, green: 150/255, blue: 90/255)
        ),
        ExerciseItem(
            title: "External Anchor",
            description: "Ground yourself in your environment to escape spiraling thoughts.",
            buttonName: "Begin Grounding",
            icon: "leaf",
            accentColor: Color(red: 90/255, green: 180/255, blue: 140/255)
        )
    ]
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 16) {
                        ForEach(Array(exercises.enumerated()), id: \.element.id) { index, exercise in
                            ExerciseCardSection(
                                title: exercise.title,
                                description: exercise.description,
                                buttonName: exercise.buttonName,
                                icon: exercise.icon,
                                accentColor: exercise.accentColor,
                                action: {
                                    triggerNavigation(for: index)
                                }
                            )
                            .opacity(hasAppeared ? 1 : 0)
                            .offset(y: hasAppeared ? 0 : 20)
                            .animation(
                                .spring(response: 0.5, dampingFraction: 0.8)
                                    .delay(Double(index) * 0.08),
                                value: hasAppeared
                            )
                        }
                    }
                    .padding(.bottom, 30)
                    .padding(.top, 16)
                }
            }
            .navigationTitle("Exercises")
            .toolbarTitleDisplayMode(.inlineLarge)
            .navigationDestination(isPresented: $navigateToBoxBreathing) {
                BoxBreathingSetupView()
            }
            .navigationDestination(isPresented: $navigateToVisualization) {
                VisualizationSetupView()
            }
            .navigationDestination(isPresented: $navigateToObjectiveReview) {
                ObjectiveReviewView()
            }
            .navigationDestination(isPresented: $navigateToExternalAnchor) {
                ExternalAnchorView()
            }
            .onAppear {
                withAnimation {
                    hasAppeared = true
                }
            }
        }
    }
    
    private func triggerNavigation(for index: Int) {
        switch index {
        case 0: navigateToBoxBreathing = true
        case 1: navigateToVisualization = true
        case 2: navigateToObjectiveReview = true
        case 3: navigateToExternalAnchor = true
        default: break
        }
    }
}

struct ExerciseCardSection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var description: String
    var buttonName: String
    var icon: String
    var accentColor: Color
    var action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top, spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [accentColor.opacity(0.25), accentColor.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 52, height: 52)
                    
                    Image(systemName: icon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(accentColor)
                }
                
                VStack(alignment: .leading, spacing: 6) {
                    Text(title)
                        .font(.title3.bold())
                    
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.bottom, 18)
            
            Button {
                action()
            } label: {
                HStack(spacing: 8) {
                    Text(buttonName)
                        .font(.subheadline.weight(.semibold))
                    
                    Image(systemName: "arrow.right")
                        .font(.subheadline.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .foregroundStyle(.white)
                .background(
                    LinearGradient(
                        colors: [accentColor, accentColor.opacity(0.85)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(.rect(cornerRadius: 12))
            }
            .buttonStyle(.plain)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: accentColor.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [accentColor.opacity(0.2), accentColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
    }
}

#Preview {
    MentalExercisesView()
}
