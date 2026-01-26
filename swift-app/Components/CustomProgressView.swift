//
//  CustomProgressView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/27/25.
//

import SwiftUI

struct CustomProgressView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var isAnimating: Bool = false
    var maxNum: Int

    private var shimmerColor: Color {
        colorScheme == .dark 
            ? Color.white.opacity(isAnimating ? 0.15 : 0.05) 
            : Color.gray.opacity(isAnimating ? 0.25 : 0.08)
    }

    var body: some View {
        VStack(spacing: 16) {
            ForEach(0..<maxNum, id: \.self) { _ in
                HStack(spacing: 14) {
                    Circle()
                        .fill(shimmerColor)
                        .frame(width: 48, height: 48)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(shimmerColor)
                            .frame(width: 140, height: 16)
                        
                        RoundedRectangle(cornerRadius: 4)
                            .fill(shimmerColor)
                            .frame(width: 80, height: 12)
                    }
                    
                    Spacer()
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(shimmerColor)
                        .frame(width: 20, height: 20)
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(colorScheme == .light ? .white : Color(white: 0.1))
                        .shadow(color: Color.black.opacity(0.04), radius: 8, x: 0, y: 2)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            colorScheme == .light ? Color.black.opacity(0.04) : Color.white.opacity(0.06),
                            lineWidth: 1
                        )
                )
            }
        }
        .padding(.horizontal)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

#Preview {
    ZStack {
        BackgroundColor()
        CustomProgressView(maxNum: 3)
    }
}
