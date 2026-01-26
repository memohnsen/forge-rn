//
//  Filter.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/26/25.
//

import SwiftUI

struct Filter: View {
    @Environment(\.colorScheme) var colorScheme
    @Binding var selected: String
    var options: [String] = ["Check-Ins", "Workouts", "Meets"]
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(options, id: \.self) { option in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selected = option
                        }
                    } label: {
                        Text(option)
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 10)
                            .foregroundStyle(selected == option ? .white : blueEnergy)
                            .background(
                                Capsule()
                                    .fill(
                                        selected == option
                                        ? LinearGradient(
                                            colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                        : LinearGradient(
                                            colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.08)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                            )
                            .overlay(
                                Capsule()
                                    .stroke(
                                        selected == option
                                        ? Color.clear
                                        : blueEnergy.opacity(0.3),
                                        lineWidth: 1
                                    )
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
    }
}
