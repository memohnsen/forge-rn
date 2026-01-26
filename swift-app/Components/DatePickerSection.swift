//
//  DatePickerSection.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/26/25.
//

import SwiftUI

struct DatePickerSection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    @Binding var selectedDate: Date
    
    var body: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [blueEnergy.opacity(0.25), blueEnergy.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 44, height: 44)
                
                Image(systemName: "calendar")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(blueEnergy)
            }
            
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colorScheme == .light ? .black : .white)
            
            Spacer()
            
            DatePicker(
                "",
                selection: $selectedDate,
                displayedComponents: [.date]
            )
            .datePickerStyle(.compact)
            .labelsHidden()
        }
        .padding(16)
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
