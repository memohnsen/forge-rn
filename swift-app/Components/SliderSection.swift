//
//  SliderSection.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI

struct SliderSection: View {
    var colorScheme: ColorScheme
    var title: String
    @Binding var value: Int
    var minString: String
    var maxString: String
    
    @State private var dragOffset: CGFloat = 0
    @State private var lineWidth: CGFloat = 0
    
    var minValue: Int
    var maxValue: Int
    var inverseColorRating: Bool
    
    var colorByRating: Color {
        if title == "How many years have you been training?" || title == "How many meets do you do per year?" {
            blueEnergy
        } else {
            if value <= 2 {
                .red
            } else if value == 3 {
                blueEnergy
            } else {
                .green
            }
        }
    }
    
    var inverseColorByRating: Color {
        if value <= 2 {
            .green
        } else if value == 3 {
            blueEnergy
        } else {
            .red
        }
    }
    
    var decideColor: Color {
        if inverseColorRating {
            inverseColorByRating
        } else {
            colorByRating
        }
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
                .padding(.horizontal)
                .multilineTextAlignment(.center)
            
            ZStack {
                Circle()
                    .stroke(
                        LinearGradient(
                            colors: [decideColor.opacity(0.4), decideColor.opacity(0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 4
                    )
                    .frame(width: 80, height: 80)
                
                Text("\(value)")
                    .font(.system(size: 36, weight: .bold))
                    .foregroundStyle(decideColor)
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [decideColor.opacity(0.15), decideColor.opacity(0.08)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(height: 6)
                    
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [decideColor, decideColor.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: progressWidth(in: geometry.size.width), height: 6)
                    
                    HStack(spacing: 0) {
                        ForEach(minValue...maxValue, id: \.self) { position in
                            Circle()
                                .fill(value >= position ? decideColor : decideColor.opacity(0.2))
                                .frame(width: 10, height: 10)
                            
                            if position < maxValue {
                                Spacer()
                            }
                        }
                    }
                    .padding(.horizontal, 18)
                    
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [decideColor, decideColor.opacity(0.85)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .frame(width: 32, height: 32)
                        .overlay(
                            Circle()
                                .stroke(Color.white.opacity(0.3), lineWidth: 2)
                        )
                        .shadow(color: decideColor.opacity(0.4), radius: 6, x: 0, y: 3)
                        .offset(x: circlePosition(in: geometry.size.width))
                        .gesture(
                            DragGesture()
                                .onChanged { gesture in
                                    let totalWidth = geometry.size.width - 32
                                    let newOffset = gesture.location.x - 16
                                    dragOffset = min(max(newOffset, 0), totalWidth)
                                    
                                    let segmentWidth = totalWidth / CGFloat(maxValue - minValue)
                                    let newValue = Int(round(dragOffset / segmentWidth)) + minValue
                                    value = min(max(newValue, minValue), maxValue)
                                }
                                .onEnded { _ in
                                    dragOffset = 0
                                }
                        )
                }
                .frame(height: 32)
                .onAppear {
                    lineWidth = geometry.size.width
                }
            }
            .frame(height: 32)
            .padding(.horizontal, 18)
            
            HStack {
                Text(minString)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                Spacer()
                Text(maxString)
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 18)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 2)
        .foregroundStyle(colorScheme == .light ? .black : .white)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: decideColor.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [decideColor.opacity(0.2), decideColor.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
        .padding(.bottom, 12)
    }
    
    private func circlePosition(in width: CGFloat) -> CGFloat {
        let totalWidth = width - 32
        let segmentWidth = totalWidth / CGFloat(maxValue - minValue)
        return CGFloat(value - minValue) * segmentWidth
    }
    
    private func progressWidth(in width: CGFloat) -> CGFloat {
        let totalWidth = width
        let progress = CGFloat(value - minValue) / CGFloat(maxValue - minValue)
        return totalWidth * progress
    }
}
