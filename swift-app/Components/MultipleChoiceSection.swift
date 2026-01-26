//
//  MultipleChoiceSection.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI

struct MultipleChoiceSection: View {
    var colorScheme: ColorScheme
    var title: String
    var arrayOptions: [String]
    @Binding var selected: String
    
    var body: some View {
        VStack(spacing: 14) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal)
                .multilineTextAlignment(.center)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(arrayOptions, id: \.self) { option in
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
                .padding(.horizontal, 18)
                .padding(.bottom, 4)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 18)
        .foregroundStyle(colorScheme == .light ? .black : .white)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: blueEnergy.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
        .padding(.bottom, 12)
    }
}
