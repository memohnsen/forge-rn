//
//  PrivacyBulletPoint.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 1/1/26.
//

import SwiftUI

struct PrivacyBulletPoint: View {
    let text: String
    let textColor: Color
    var accentColor: Color = blueEnergy
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.25), accentColor.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 24, height: 24)
                
                Image(systemName: "checkmark")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(accentColor)
            }
            
            Text(text)
                .font(.subheadline)
                .foregroundStyle(textColor)
        }
    }
}
