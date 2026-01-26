import SwiftUI
import AVFoundation

struct VisualizationPlayerView: View {
    let audioData: Data
    let script: String
    let movement: String
    let onComplete: () -> Void
    
    @State private var audioPlayer: AVAudioPlayer?
    @State private var isPlaying: Bool = false
    @State private var progress: Double = 0.0
    @State private var duration: TimeInterval = 0.0
    @State private var currentTime: TimeInterval = 0.0
    @State private var timer: Timer?
    @State private var showScript: Bool = false
    @State private var glowPulse: Bool = false
    @State private var playbackStartTime: Date?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()
                
                visualizationAnimation
                
                Spacer()
                
                progressSection
                
                controlsSection
                
                viewScriptButton
                
                doneButton
            }
            .sheet(isPresented: $showScript) {
                ScriptSheetView(script: script, movement: movement)
            }
            .onAppear {
                setupAudio()
                glowPulse = true
            }
            .onDisappear {
                stopPlayback()
            }
            .navigationTitle(movement)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
        }
    }
    
    private var visualizationAnimation: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(
                        blueEnergy.opacity(0.15 - Double(index) * 0.04),
                        lineWidth: 2
                    )
                    .frame(width: 200 + CGFloat(index) * 50, height: 200 + CGFloat(index) * 50)
                    .scaleEffect(isPlaying ? 1.1 : 1.0)
                    .opacity(glowPulse ? 0.8 : 0.4)
                    .animation(
                        .easeInOut(duration: 2.0)
                        .repeatForever(autoreverses: true)
                        .delay(Double(index) * 0.3),
                        value: glowPulse
                    )
            }
            
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            blueEnergy.opacity(0.3),
                            blueEnergy.opacity(0.1),
                            blueEnergy.opacity(0.0)
                        ],
                        center: .center,
                        startRadius: 60,
                        endRadius: 130
                    )
                )
                .frame(width: 300, height: 300)
                .blur(radius: 20)
            
            Circle()
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.4, green: 0.6, blue: 0.95),
                            blueEnergy,
                            Color(red: 0.3, green: 0.5, blue: 0.85)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 180, height: 180)
                .shadow(color: blueEnergy.opacity(0.5), radius: 30, x: 0, y: 0)
                .overlay(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color.white.opacity(0.3),
                                    Color.white.opacity(0.1),
                                    Color.clear
                                ],
                                center: .topLeading,
                                startRadius: 0,
                                endRadius: 90
                            )
                        )
                        .offset(x: -20, y: -20)
                )
            
            Image(systemName: isPlaying ? "waveform" : "play.fill")
                .font(.system(size: isPlaying ? 50 : 40, weight: .medium))
                .foregroundStyle(.white)
                .symbolEffect(.variableColor.iterative, options: .repeating, value: isPlaying)
        }
        .frame(height: 350)
        .onTapGesture {
            togglePlayback()
        }
    }
    
    private var progressSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text(formatTime(currentTime))
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(.secondary)
                
                Spacer()
                
                Text(formatTime(duration))
                    .font(.system(.caption, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal)
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 6)
                    
                    RoundedRectangle(cornerRadius: 4)
                        .fill(blueEnergy)
                        .frame(width: geometry.size.width * progress, height: 6)
                    
                    Circle()
                        .fill(.white)
                        .frame(width: 14, height: 14)
                        .shadow(color: .black.opacity(0.2), radius: 2, x: 0, y: 1)
                        .offset(x: max(0, geometry.size.width * progress - 7))
                }
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            let newProgress = min(max(0, value.location.x / geometry.size.width), 1.0)
                            seek(to: newProgress)
                        }
                )
            }
            .frame(height: 14)
            .padding(.horizontal)
        }
        .padding(.bottom, 20)
    }
    
    private var controlsSection: some View {
        HStack(spacing: 30) {
            Button {
                seekRelative(seconds: -15)
            } label: {
                Image(systemName: "gobackward.15")
                    .font(.title2)
                    .foregroundStyle(.primary)
            }
            
            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 70))
                    .foregroundStyle(blueEnergy)
            }
            
            Button {
                seekRelative(seconds: 15)
            } label: {
                Image(systemName: "goforward.15")
                    .font(.title2)
                    .foregroundStyle(.primary)
            }
        }
        .padding(.bottom, 24)
    }
    
    private var viewScriptButton: some View {
        Button {
            showScript.toggle()
            AnalyticsManager.shared.trackVisualizationScriptViewed(movement: movement)
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "doc.text")
                Text("View Script")
            }
            .font(.subheadline)
            .foregroundStyle(blueEnergy)
        }
        .padding(.top, 16)
    }
    
    private var doneButton: some View {
        Button {
            trackPlaybackCompletion()
            stopPlayback()
            onComplete()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "checkmark")
                Text("Done")
            }
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(blueEnergy)
            .clipShape(.rect(cornerRadius: 12))
            .shadow(color: Color.black.opacity(0.15), radius: 6, x: 0, y: 3)
        }
        .padding(.horizontal)
        .padding(.top, 16)
        .padding(.bottom, 30)
    }
    
    private func setupAudio() {
        do {
            #if os(iOS)
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            #endif
            
            audioPlayer = try AVAudioPlayer(data: audioData)
            audioPlayer?.prepareToPlay()
            duration = audioPlayer?.duration ?? 0
            
            timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
                updateProgress()
            }
            
            playbackStartTime = Date()
            togglePlayback()
            
        } catch {
            print("Audio setup error: \(error.localizedDescription)")
        }
    }
    
    private func trackPlaybackCompletion() {
        guard let startTime = playbackStartTime else { return }
        let playbackDuration = Date().timeIntervalSince(startTime)
        let completed = currentTime >= duration * 0.9
        
        AnalyticsManager.shared.trackVisualizationPlayed(
            movement: movement,
            voice: "unknown",
            playbackDuration: playbackDuration,
            completed: completed
        )
    }
    
    private func togglePlayback() {
        guard let player = audioPlayer else { return }
        
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
        isPlaying = !isPlaying
    }
    
    private func stopPlayback() {
        timer?.invalidate()
        timer = nil
        audioPlayer?.stop()
        isPlaying = false
        
        #if os(iOS)
        try? AVAudioSession.sharedInstance().setActive(false)
        #endif
    }
    
    private func updateProgress() {
        guard let player = audioPlayer else { return }
        currentTime = player.currentTime
        progress = duration > 0 ? currentTime / duration : 0
        
        if currentTime >= duration && duration > 0 {
            isPlaying = false
        }
    }
    
    private func seek(to newProgress: Double) {
        guard let player = audioPlayer else { return }
        let newTime = duration * newProgress
        player.currentTime = newTime
        currentTime = newTime
        progress = newProgress
    }
    
    private func seekRelative(seconds: Double) {
        guard let player = audioPlayer else { return }
        let newTime = max(0, min(duration, player.currentTime + seconds))
        player.currentTime = newTime
        currentTime = newTime
        progress = duration > 0 ? newTime / duration : 0
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct ScriptSheetView: View {
    let script: String
    let movement: String
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(cleanScript(script))
                            .font(.body)
                            .lineSpacing(8)
                            .padding()
                    }
                }
                .background(BackgroundColor())
                .navigationTitle("Visualization Script")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
            }
        }
    }
    
    private func cleanScript(_ script: String) -> String {
        var cleaned = script
        let breakPattern = #"<break\s+time="[^"]*"\s*/>"#
        if let regex = try? NSRegularExpression(pattern: breakPattern, options: []) {
            let range = NSRange(cleaned.startIndex..., in: cleaned)
            cleaned = regex.stringByReplacingMatches(in: cleaned, options: [], range: range, withTemplate: "\n\n")
        }
        return cleaned
    }
}

#Preview {
    VisualizationPlayerView(
        audioData: Data(),
        script: "Sample script for preview",
        movement: "315lb Squat",
        onComplete: {}
    )
}
