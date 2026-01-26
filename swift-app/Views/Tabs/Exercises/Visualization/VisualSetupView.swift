import SwiftUI
import Clerk

struct VisualizationSetupView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    
    @State private var vm = VisualizationViewModel()
        
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                if vm.isGenerating {
                    CreatingVisualizationView(
                        status: vm.isGeneratingScript ? "Generating Script..." : "Creating Audio..."
                    )
                } else if vm.isPlayerActive, let audioData = vm.generatedAudioData {
                    VisualizationPlayerView(
                        audioData: audioData,
                        script: vm.generatedScript,
                        movement: vm.movement,
                        onComplete: {
                            vm.isPlayerActive = false
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
                                                    colors: [Color.purple.opacity(0.25), Color.purple.opacity(0.1)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                            .frame(width: 48, height: 48)
                                        
                                        Image(systemName: "brain.head.profile")
                                            .font(.system(size: 20, weight: .semibold))
                                            .foregroundStyle(.purple)
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Visualization")
                                            .font(.title3.weight(.bold))
                                            .foregroundStyle(colorScheme == .light ? .black : .white)
                                        
                                        Text("Mental rehearsal")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                
                                Text("Describe your movement and cues. A personalized guided visualization will help you mentally prepare.")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineSpacing(4)
                            }
                            .cardStyling(accentColor: .purple)
                            
                            ExerciseInputSection(
                                title: "Movement & Weight",
                                placeholder: "e.g., 200kg Squat, 100kg Snatch",
                                text: $vm.movement,
                                icon: "figure.strengthtraining.traditional",
                                accentColor: .purple
                            ) {
                                vm.checkForCachedVersion()
                            }
                            
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 10) {
                                    Image(systemName: "target")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.purple)
                                    
                                    Text("Focus Cues")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(colorScheme == .light ? .black : .white)
                                }
                                
                                TextEditor(text: $vm.cues)
                                    .frame(minHeight: 100)
                                    .padding(12)
                                    .scrollContentBackground(.hidden)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(
                                                LinearGradient(
                                                    colors: [Color.purple.opacity(0.08), Color.purple.opacity(0.04)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(Color.purple.opacity(0.15), lineWidth: 1)
                                    )
                                    .onChange(of: vm.cues) { _, _ in
                                        vm.checkForCachedVersion()
                                    }
                            }
                            .cardStyling(accentColor: .purple)
                            
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 10) {
                                    Image(systemName: "waveform")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(.purple)
                                    
                                    Text("Voice")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(colorScheme == .light ? .black : .white)
                                }
                                
                                HStack(spacing: 10) {
                                    ForEach(VoiceOption.allCases) { voice in
                                        VoiceOptionButton(
                                            voice: voice,
                                            isSelected: vm.selectedVoice == voice,
                                            action: {
                                                vm.selectedVoice = voice
                                                vm.checkForCachedVersion()
                                            }
                                        )
                                    }
                                }
                            }
                            .cardStyling(accentColor: .purple)
                            
                            if vm.hasCachedVersion {
                                HStack(spacing: 14) {
                                    ZStack {
                                        Circle()
                                            .fill(
                                                LinearGradient(
                                                    colors: [Color.green.opacity(0.25), Color.green.opacity(0.1)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                            .frame(width: 40, height: 40)
                                        
                                        Image(systemName: "arrow.down.circle.fill")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundStyle(.green)
                                    }
                                    
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("Saved Version Available")
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(colorScheme == .light ? .black : .white)
                                        Text("Play without using API credits")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    
                                    Spacer()
                                    
                                    Toggle("", isOn: $vm.useCachedVersion)
                                        .labelsHidden()
                                        .tint(.green)
                                }
                                .padding(16)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(colorScheme == .light ? .white : Color(white: 0.1))
                                        .shadow(color: Color.green.opacity(0.08), radius: 12, x: 0, y: 4)
                                        .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(
                                            LinearGradient(
                                                colors: [Color.green.opacity(0.25), Color.green.opacity(0.1)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1
                                        )
                                )
                                .padding(.horizontal)
                                .padding(.bottom, 12)
                            }
                            
                            Button {
                                Task {
                                    await vm.generateVisualization()
                                }
                            } label: {
                                HStack(spacing: 10) {
                                    Image(systemName: "waveform")
                                        .font(.subheadline.weight(.semibold))
                                    Text(vm.useCachedVersion ? "Play Saved Visualization" : "Generate Visualization")
                                        .font(.headline.weight(.semibold))
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .foregroundStyle(.white)
                                .background(
                                    LinearGradient(
                                        colors: vm.canGenerate
                                            ? [Color.purple, Color.purple.opacity(0.85)]
                                            : [Color.gray.opacity(0.5), Color.gray.opacity(0.4)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 14))
                                .shadow(color: vm.canGenerate ? Color.purple.opacity(0.3) : Color.clear, radius: 8, x: 0, y: 4)
                            }
                            .disabled(!vm.canGenerate)
                            .padding(.horizontal)
                            .padding(.top, 8)
                            .padding(.bottom, 30)
                        }
                    }
                }
            }
            .navigationTitle("Visualization")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
            .alert("Error", isPresented: $vm.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(vm.errorMessage)
            }
            .task {
                await vm.loadUserSport()
            }
        }
    }
}

struct ExerciseInputSection: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var placeholder: String
    @Binding var text: String
    var icon: String
    var accentColor: Color
    var onChange: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(accentColor)
                
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
            }
            
            TextField(placeholder, text: $text)
                .font(.body)
                .padding(14)
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(
                            LinearGradient(
                                colors: [accentColor.opacity(0.08), accentColor.opacity(0.04)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(accentColor.opacity(0.15), lineWidth: 1)
                )
                .onChange(of: text) { _, _ in
                    onChange()
                }
        }
        .cardStyling(accentColor: accentColor)
    }
}

struct CreatingVisualizationView: View {
    @Environment(\.colorScheme) var colorScheme
    let status: String
    
    var body: some View {
        ZStack {
            BackgroundColor()
            
            VStack(spacing: 24) {
                Spacer()
                
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [Color.purple.opacity(0.2), Color.purple.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 120, height: 120)
                    
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .purple))
                        .scaleEffect(1.5)
                }
                
                VStack(spacing: 12) {
                    Text("Creating Visualization")
                        .font(.title2.bold())
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                    
                    Text(status)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.purple)
                }
                
                VStack(spacing: 10) {
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(
                                    LinearGradient(
                                        colors: [Color.orange.opacity(0.25), Color.orange.opacity(0.1)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .frame(width: 36, height: 36)
                            
                            Image(systemName: "exclamationmark.triangle.fill")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.orange)
                        }
                        
                        Text("Please do not leave this page")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(colorScheme == .light ? .black : .white)
                    }
                    
                    Text("The visualization is being generated. Leaving the page may interrupt the process.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(18)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(colorScheme == .light ? Color.orange.opacity(0.06) : Color.orange.opacity(0.1))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(
                                colors: [Color.orange.opacity(0.25), Color.orange.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1
                        )
                )
                .padding(.horizontal, 32)
                
                Spacer()
            }
        }
    }
}

struct VoiceOptionButton: View {
    @Environment(\.colorScheme) var colorScheme
    let voice: VoiceOption
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(
                            isSelected
                            ? LinearGradient(
                                colors: [Color.purple.opacity(0.25), Color.purple.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                            : LinearGradient(
                                colors: [Color.gray.opacity(0.1), Color.gray.opacity(0.05)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: "person.wave.2")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(isSelected ? .purple : .secondary)
                }
                
                Text(voice.name)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(isSelected ? .purple : (colorScheme == .light ? .black : .white))
                
                Text(voice.description)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 14)
                    .fill(isSelected ? Color.purple.opacity(0.08) : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(
                        isSelected ? Color.purple.opacity(0.3) : Color.gray.opacity(0.2),
                        lineWidth: isSelected ? 2 : 1
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    VisualizationSetupView()
}
