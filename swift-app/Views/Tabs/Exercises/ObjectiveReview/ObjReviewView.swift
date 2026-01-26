import SwiftUI
import Clerk

enum ObjectiveReviewState {
    case vent
    case processing
    case reframed
}

struct ObjectiveReviewView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    @State private var vm = ObjectiveReviewViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 0) { 
                        if vm.currentState == .vent {
                            ventModeView
                        } else if vm.currentState == .processing {
                            processingView
                        } else {
                            reframedView
                        }
                    }
                    .padding(.bottom, 30)
                    .padding(.top, 16)
                }
            }
            .navigationTitle("Objective Review")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
            .toolbar {
                if !vm.showHistory {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button {
                            vm.showHistory = true
                        } label: {
                            Image(systemName: "clock.arrow.circlepath")
                        }
                    }
                }
            }
            .sheet(isPresented: $vm.showHistory) {
                ObjectiveReviewHistoryView()
            }
            .alert("Error", isPresented: $vm.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(vm.errorMessage)
            }
            .alert(vm.alertTitle, isPresented: $vm.showWriteAlert) {
                Button("OK", role: .cancel) {
                    if vm.alertTitle == "Success!" {
                        vm.resetView()
                    }
                }
            } message: {
                Text(vm.alertMessage)
            }
            .onChange(of: vm.alertShown) { _, newValue in
                vm.showWriteAlert = newValue
            }
            .task {
                guard let userId = Clerk.shared.user?.id else { return }
                await vm.fetchUserSport(user_id: userId)
                vm.userSport = vm.sport.first?.sport ?? "Olympic Weightlifting"
            }
        }
    }
    
    private var ventModeView: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.orange.opacity(0.25), Color.orange.opacity(0.1)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: "flame.fill")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(.orange)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("What happened?")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(colorScheme == .light ? .black : .white)
                        
                        Text("Share your honest reaction")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Text("Let it out, then we'll transform it into objective coaching cues.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineSpacing(4)
            }
            .cardStyling(accentColor: .orange)
            
            VStack(alignment: .leading, spacing: 12) {
                TextEditor(text: $vm.ventText)
                    .frame(minHeight: 180)
                    .padding(12)
                    .scrollContentBackground(.hidden)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(
                                LinearGradient(
                                    colors: [Color.orange.opacity(0.08), Color.orange.opacity(0.04)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.orange.opacity(0.15), lineWidth: 1)
                    )
            }
            .cardStyling(accentColor: .orange)
            
            Button {
                Task {
                    await vm.processReframing()
                }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.subheadline.weight(.semibold))
                    Text("Convert to Coach Perspective")
                        .font(.headline.weight(.semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .foregroundStyle(.white)
                .background(
                    LinearGradient(
                        colors: vm.canProcess
                            ? [Color.orange, Color.orange.opacity(0.85)]
                            : [Color.gray.opacity(0.5), Color.gray.opacity(0.4)],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: vm.canProcess ? Color.orange.opacity(0.3) : Color.clear, radius: 8, x: 0, y: 4)
            }
            .disabled(!vm.canProcess)
            .padding(.horizontal)
            .padding(.top, 8)
        }
    }
    
    private var processingView: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 120, height: 120)
                
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: blueEnergy))
                    .scaleEffect(1.5)
            }
            
            Text("Take a deep breath")
                .font(.title2.bold())
                .foregroundStyle(colorScheme == .light ? .black : .white)
                .opacity(vm.breathingTextOpacity)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 80)
        .onAppear {
            withAnimation(.easeIn(duration: 1.5)) {
                vm.breathingTextOpacity = 1.0
            }
        }
    }
    
    private var reframedView: some View {
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
                        
                        Image(systemName: "lightbulb.fill")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(blueEnergy)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Reframed Cues")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(colorScheme == .light ? .black : .white)
                        
                        Text("Compare perspectives")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .cardStyling()
            
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "person.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Text("The Athlete's Voice")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                
                Text(vm.ventText)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(colorScheme == .light ? Color.black.opacity(0.03) : Color.white.opacity(0.03))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        colorScheme == .light ? Color.black.opacity(0.06) : Color.white.opacity(0.08),
                        lineWidth: 1
                    )
            )
            .padding(.horizontal)
            .padding(.bottom, 12)
            
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Image(systemName: "person.badge.shield.checkmark.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(blueEnergy)
                    Text("The Coach's Voice")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(blueEnergy)
                }
                
                Text(vm.coachReframe)
                    .font(.body)
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(colorScheme == .light ? .white : Color(white: 0.1))
                    .shadow(color: blueEnergy.opacity(0.1), radius: 12, x: 0, y: 4)
                    .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [blueEnergy.opacity(0.3), blueEnergy.opacity(0.1)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 2
                    )
            )
            .padding(.horizontal)
            .padding(.bottom, 20)
            
            Button {
                Task {
                    await vm.saveToTrainingCues()
                }
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "plus.circle.fill")
                        .font(.subheadline.weight(.semibold))
                    Text("Add to Training Cues")
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
            .disabled(vm.isLoading)
            .padding(.horizontal)
        }
    }
}

#Preview {
    ObjectiveReviewView()
}
