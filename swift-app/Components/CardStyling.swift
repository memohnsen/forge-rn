//
//  CardStyling.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI

struct CardStyling: ViewModifier {
    @Environment(\.colorScheme) var colorScheme
    var accentColor: Color = blueEnergy
    
    func body(content: Content) -> some View {
        content
            .frame(maxWidth: .infinity)
            .padding(18)
            .foregroundStyle(colorScheme == .light ? .black : .white)
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
            .padding(.bottom, 12)
    }
}

extension View {
    func cardStyling() -> some View {
        self.modifier(CardStyling())
    }
    
    func cardStyling(accentColor: Color) -> some View {
        self.modifier(CardStyling(accentColor: accentColor))
    }
}

struct CardStylingSample: View {
    var body: some View {
        ZStack{
            BackgroundColor()
            
            VStack{
                Text("Sample")
            }
            .cardStyling()
        }
    }
}

#Preview {
    CardStylingSample()
}
