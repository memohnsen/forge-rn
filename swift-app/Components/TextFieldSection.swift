//
//  TextFieldSection.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI

struct TextFieldSection: View {
    @Binding var field: String
    var title: String
    var colorScheme: ColorScheme
    var keyword: String
    
    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            
            TextField("Enter your \(keyword)...", text: $field, axis: .vertical)
                .font(.body)
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [blueEnergy.opacity(0.08), blueEnergy.opacity(0.04)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(blueEnergy.opacity(0.15), lineWidth: 1)
                )
        }
        .frame(maxWidth: .infinity)
        .padding(18)
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
