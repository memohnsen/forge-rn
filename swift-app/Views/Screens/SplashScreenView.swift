//
//  SplashScreenView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/30/25.
//

import SwiftUI

struct SplashScreenView: View {
    @Binding var isActive: Bool
    @State private var logoScale: CGFloat = 0.7
    @State private var logoOpacity: Double = 0.0
        
    var body: some View {
        ZStack {
            blueEnergy
                .ignoresSafeArea()
            
            Image("app-icon")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(width: 140, height: 140)
                .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
                .shadow(color: Color.white.opacity(0.5), radius: 20, x: 0, y: 0)
                .scaleEffect(logoScale)
                .opacity(logoOpacity)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.6)) {
                logoScale = 1.0
                logoOpacity = 1.0
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                withAnimation(.easeInOut(duration: 0.4)) {
                    isActive = false
                }
            }
        }
    }
}

#Preview {
    SplashScreenView(isActive: .constant(true))
}
