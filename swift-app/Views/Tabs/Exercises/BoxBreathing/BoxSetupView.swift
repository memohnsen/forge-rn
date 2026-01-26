import SwiftUI

struct BoxBreathingSetupView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    
    @State private var holdDuration: Int = 4
    @State private var numberOfRounds: Int = 10
    @State private var isExerciseActive: Bool = false
    
    var totalTime: Int {
        return holdDuration * 4 * numberOfRounds
    }
    
    var totalTimeFormatted: String {
        let minutes = totalTime / 60
        let seconds = totalTime % 60
        if minutes > 0 {
            return "\(minutes) min \(seconds) sec"
        } else {
            return "\(seconds) sec"
        }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                if isExerciseActive {
                    BreathingExerciseView(
                        holdDuration: holdDuration,
                        numberOfRounds: numberOfRounds,
                        onComplete: {
                            isExerciseActive = false
                        }
                    )
                } else {
                    ScrollView {
                        VStack(spacing: 0) {
                            VStack(alignment: .leading, spacing: 12) {
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
                                            .frame(width: 48, height: 48)
                                        
                                        Image(systemName: "wind")
                                            .font(.system(size: 20, weight: .semibold))
                                            .foregroundStyle(blueEnergy)
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Box Breathing")
                                            .font(.title3.weight(.bold))
                                            .foregroundStyle(colorScheme == .light ? .black : .white)
                                        
                                        Text("\(holdDuration)-\(holdDuration)-\(holdDuration)-\(holdDuration) pattern")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                
                                Text("Inhale, hold, exhale, hold. Each phase lasts the same duration to calm your mind and body.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineSpacing(4)
                            }
                            .cardStyling()
                            
                            BreathingSliderSection(
                                title: "Breath Duration",
                                subtitle: "seconds per phase",
                                value: $holdDuration,
                                range: 2...8,
                                icon: "timer"
                            )
                            
                            BreathingSliderSection(
                                title: "Number of Rounds",
                                subtitle: "complete cycles",
                                value: $numberOfRounds,
                                range: 1...20,
                                icon: "arrow.trianglehead.2.clockwise.rotate.90"
                            )
                            
                            VStack(spacing: 8) {
                                Text("Total Time")
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.secondary)
                                
                                Text(totalTimeFormatted)
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundStyle(blueEnergy)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 24)
                            .cardStyling()
                            
                            Button {
                                isExerciseActive = true
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "play.fill")
                                        .font(.subheadline.weight(.semibold))
                                    Text("Start Breathing")
                                        .font(.headline.weight(.semibold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .foregroundStyle(.white)
                                .background(
                                    LinearGradient(
                                        colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .shadow(color: blueEnergy.opacity(0.3), radius: 8, x: 0, y: 4)
                            }
                            .padding(.horizontal)
                            .padding(.top, 8)
                            .padding(.bottom, 30)
                        }
                        .padding(.top, 16)
                    }
                }
            }
            .navigationTitle("Box Breathing")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
        }
    }
}

struct BreathingSliderSection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var subtitle: String
    @Binding var value: Int
    var range: ClosedRange<Int>
    var icon: String
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [blueEnergy.opacity(0.25), blueEnergy.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 40, height: 40)
                    
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(blueEnergy)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                
                Spacer()
                
                Text("\(value)")
                    .font(.title.weight(.bold))
                    .foregroundStyle(blueEnergy)
                    .frame(minWidth: 44)
            }
            
            HStack(spacing: 12) {
                Text("\(range.lowerBound)")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .frame(width: 20)
                
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [blueEnergy.opacity(0.15), blueEnergy.opacity(0.08)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(height: 6)
                        
                        Capsule()
                            .fill(
                                LinearGradient(
                                    colors: [blueEnergy, blueEnergy.opacity(0.7)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: progressWidth(in: geometry.size.width), height: 6)
                        
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .frame(width: 28, height: 28)
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(0.3), lineWidth: 2)
                            )
                            .shadow(color: blueEnergy.opacity(0.4), radius: 4, x: 0, y: 2)
                            .offset(x: thumbPosition(in: geometry.size.width))
                            .gesture(
                                DragGesture()
                                    .onChanged { gesture in
                                        let totalWidth = geometry.size.width - 28
                                        let newOffset = min(max(gesture.location.x - 14, 0), totalWidth)
                                        let percentage = newOffset / totalWidth
                                        let rangeSize = range.upperBound - range.lowerBound
                                        let newValue = range.lowerBound + Int(round(percentage * Double(rangeSize)))
                                        value = min(max(newValue, range.lowerBound), range.upperBound)
                                    }
                            )
                    }
                    .frame(height: 28)
                }
                .frame(height: 28)
                
                Text("\(range.upperBound)")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .frame(width: 20)
            }
        }
        .cardStyling()
    }
    
    private func thumbPosition(in width: CGFloat) -> CGFloat {
        let totalWidth = width - 28
        let rangeSize = range.upperBound - range.lowerBound
        let percentage = Double(value - range.lowerBound) / Double(rangeSize)
        return totalWidth * CGFloat(percentage)
    }
    
    private func progressWidth(in width: CGFloat) -> CGFloat {
        let rangeSize = range.upperBound - range.lowerBound
        let percentage = Double(value - range.lowerBound) / Double(rangeSize)
        return width * CGFloat(percentage)
    }
}

struct BreathingExerciseView: View {
    let holdDuration: Int
    let numberOfRounds: Int
    let onComplete: () -> Void
    
    @State private var currentRound: Int = 1
    @State private var currentPhase: Int = 0
    @State private var timeRemaining: Int = 0
    @State private var progress: Double = 0.0
    @State private var bubbleScale: CGFloat = 0.4
    @State private var timer: Timer?
    @State private var startTime: Date?
    @State private var isPaused: Bool = false
    @State private var pausedElapsed: TimeInterval = 0
    @State private var pauseStartTime: Date?
    @State private var glowPulse: Bool = false
    
    let phases = ["Inhale", "Hold", "Exhale", "Hold"]
    
    private let minScale: CGFloat = 0.6
    private let maxScale: CGFloat = 1.0
    
    var totalTime: Int {
        holdDuration * 4 * numberOfRounds
    }
    
    private var bubbleGradient: LinearGradient {
        let colors: [Color]
        switch currentPhase {
        case 0:
            colors = [
                Color(red: 0.4, green: 0.8, blue: 0.95),
                Color(red: 0.2, green: 0.6, blue: 0.9),
                Color(red: 0.3, green: 0.5, blue: 0.85)
            ]
        case 1:
            colors = [
                Color(red: 0.6, green: 0.5, blue: 0.9),
                Color(red: 0.5, green: 0.4, blue: 0.85),
                Color(red: 0.4, green: 0.3, blue: 0.8)
            ]
        case 2:
            colors = [
                Color(red: 0.95, green: 0.6, blue: 0.5),
                Color(red: 0.9, green: 0.5, blue: 0.55),
                Color(red: 0.85, green: 0.4, blue: 0.5)
            ]
        case 3:
            colors = [
                Color(red: 0.7, green: 0.6, blue: 0.9),
                Color(red: 0.6, green: 0.5, blue: 0.85),
                Color(red: 0.5, green: 0.4, blue: 0.8)
            ]
        default:
            colors = [blueEnergy, blueEnergy.opacity(0.7)]
        }
        return LinearGradient(
            colors: colors,
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
    
    private var glowColor: Color {
        switch currentPhase {
        case 0: return Color(red: 0.3, green: 0.7, blue: 0.95)
        case 1: return Color(red: 0.5, green: 0.4, blue: 0.85)
        case 2: return Color(red: 0.9, green: 0.5, blue: 0.5)
        case 3: return Color(red: 0.6, green: 0.5, blue: 0.85)
        default: return blueEnergy
        }
    }
    
    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("Round \(currentRound)/\(numberOfRounds)")
                    .font(.title2.bold())
                
                Text(formatTime(timeRemaining))
                    .font(.system(size: 18, weight: .medium, design: .rounded))
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 20)
            
            Spacer()
            
            ZStack {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .stroke(
                            glowColor.opacity(0.15 - Double(index) * 0.04),
                            lineWidth: 2
                        )
                        .frame(width: 220 + CGFloat(index) * 40, height: 220 + CGFloat(index) * 40)
                        .scaleEffect(bubbleScale * (1.0 + CGFloat(index) * 0.1))
                        .opacity(glowPulse ? 0.8 : 0.4)
                }
                
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                glowColor.opacity(0.3),
                                glowColor.opacity(0.1),
                                glowColor.opacity(0.0)
                            ],
                            center: .center,
                            startRadius: 80,
                            endRadius: 150
                        )
                    )
                    .frame(width: 350, height: 350)
                    .scaleEffect(bubbleScale)
                    .blur(radius: 20)
                
                Circle()
                    .fill(bubbleGradient)
                    .frame(width: 250, height: 250)
                    .scaleEffect(bubbleScale)
                    .shadow(color: glowColor.opacity(0.5), radius: 30, x: 0, y: 0)
                    .shadow(color: glowColor.opacity(0.3), radius: 60, x: 0, y: 0)
                    .overlay(
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        Color.white.opacity(0.4),
                                        Color.white.opacity(0.1),
                                        Color.clear
                                    ],
                                    center: .topLeading,
                                    startRadius: 0,
                                    endRadius: 125
                                )
                            )
                            .frame(width: 250, height: 250)
                            .scaleEffect(bubbleScale)
                            .offset(x: -25, y: -25)
                    )
                    .overlay(
                        Circle()
                            .fill(Color.white.opacity(0.6))
                            .frame(width: 35, height: 35)
                            .blur(radius: 10)
                            .offset(x: -60 * bubbleScale, y: -60 * bubbleScale)
                    )
                
                VStack(spacing: 8) {
                    Text(phases[currentPhase])
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                    
                    Text("\(holdDuration - Int(progress * Double(holdDuration)))")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.9))
                        .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                        .contentTransition(.numericText())
                }
                .scaleEffect(max(0.7, bubbleScale * 0.9))
            }
            .frame(height: 350)
            .animation(.easeInOut(duration: 0.3), value: currentPhase)
            
            Spacer()
            
            HStack(spacing: 16) {
                ForEach(0..<4, id: \.self) { index in
                    VStack(spacing: 6) {
                        Circle()
                            .fill(index == currentPhase ? glowColor : Color.gray.opacity(0.3))
                            .frame(width: 12, height: 12)
                            .scaleEffect(index == currentPhase ? 1.3 : 1.0)
                            .animation(.spring(response: 0.3), value: currentPhase)
                        
                        Text(phases[index])
                            .font(.caption2)
                            .foregroundStyle(index == currentPhase ? glowColor : .secondary)
                    }
                }
            }
            .padding(.bottom, 20)
            
            HStack(spacing: 12) {
                Button {
                    if isPaused {
                        resumeExercise()
                    } else {
                        pauseExercise()
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: isPaused ? "play.fill" : "pause.fill")
                        Text(isPaused ? "Resume" : "Pause")
                    }
                    .font(.headline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(
                        LinearGradient(
                            colors: isPaused ? [blueEnergy, blueEnergy.opacity(0.85)] : [Color.orange, Color.orange.opacity(0.85)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(color: (isPaused ? blueEnergy : Color.orange).opacity(0.3), radius: 6, x: 0, y: 3)
                }
                
                Button {
                    stopExercise()
                    onComplete()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "stop.fill")
                        Text("Stop")
                    }
                    .font(.headline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(
                        LinearGradient(
                            colors: [Color.red, Color.red.opacity(0.85)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .shadow(color: Color.red.opacity(0.3), radius: 6, x: 0, y: 3)
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 30)
        }
        .onAppear {
            startExercise()
        }
        .onDisappear {
            stopExercise()
        }
    }
    
    private func startExercise() {
        timeRemaining = totalTime
        currentPhase = 0
        progress = 0.0
        bubbleScale = minScale
        startTime = Date()
        pausedElapsed = 0
        isPaused = false
        
        withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            glowPulse = true
        }
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.016, repeats: true) { _ in
            updateExercise()
        }
    }
    
    private func pauseExercise() {
        isPaused = true
        pauseStartTime = Date()
        timer?.invalidate()
        timer = nil
    }
    
    private func resumeExercise() {
        guard let pauseStartTime = pauseStartTime else { return }
        let pauseDuration = Date().timeIntervalSince(pauseStartTime)
        pausedElapsed += pauseDuration
        self.pauseStartTime = nil
        isPaused = false
        
        timer = Timer.scheduledTimer(withTimeInterval: 0.016, repeats: true) { _ in
            updateExercise()
        }
    }
    
    private func updateExercise() {
        guard let startTime = startTime, !isPaused else { return }
        
        let elapsed = Date().timeIntervalSince(startTime) - pausedElapsed
        let elapsedSeconds = Int(elapsed)
        
        timeRemaining = max(0, totalTime - elapsedSeconds)
        
        let totalPhaseTime = Double(holdDuration)
        let cycleTime = totalPhaseTime * 4
        let cycleElapsed = elapsed.truncatingRemainder(dividingBy: cycleTime)
        
        let newPhase = Int(cycleElapsed / totalPhaseTime)
        currentPhase = min(newPhase, 3)
        
        let phaseElapsed = cycleElapsed.truncatingRemainder(dividingBy: totalPhaseTime)
        progress = min(1.0, phaseElapsed / totalPhaseTime)
        
        let targetScale: CGFloat
        switch currentPhase {
        case 0:
            targetScale = minScale + (maxScale - minScale) * CGFloat(progress)
        case 1:
            targetScale = maxScale
        case 2:
            targetScale = maxScale - (maxScale - minScale) * CGFloat(progress)
        case 3:
            targetScale = minScale
        default:
            targetScale = minScale
        }
        
        withAnimation(.easeInOut(duration: 0.1)) {
            bubbleScale = targetScale
        }
        
        let roundIndex = (elapsedSeconds / (holdDuration * 4)) + 1
        currentRound = min(max(1, roundIndex), numberOfRounds)
        
        if timeRemaining <= 0 {
            stopExercise()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                onComplete()
            }
        }
    }
    
    private func stopExercise() {
        timer?.invalidate()
        timer = nil
        isPaused = false
        glowPulse = false
    }
    
    private func formatTime(_ seconds: Int) -> String {
        let mins = seconds / 60
        let secs = seconds % 60
        if mins > 0 {
            return String(format: "%d:%02d", mins, secs)
        } else {
            return "\(secs)s"
        }
    }
}

#Preview {
    BoxBreathingSetupView()
}
