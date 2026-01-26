import SwiftUI

struct ExternalAnchorView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    @State private var vm = ViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                backgroundGradient
                    .ignoresSafeArea()
                    .animation(.easeInOut(duration: 0.5), value: vm.currentStep)
                
                VStack(spacing: 0) {
                    progressBar
                        .padding(.top, 16)
                        .padding(.horizontal)
                    
                    Spacer()
                    
                    stepContent
                        .padding(.horizontal)
                    
                    Spacer()
                    
                    submitButton
                        .padding(.horizontal)
                        .padding(.bottom, 30)
                }
            }
            .navigationTitle("External Anchor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarVisibility(.hidden, for: .tabBar)
            .onAppear {
                vm.currentInput = vm.userInputs[vm.currentStep]
            }
        }
    }
    
    var backgroundGradient: LinearGradient {
        let bottomColor = colorScheme == .dark ? Color.black : Color.white
        return LinearGradient(
            colors: [vm.stepColor, bottomColor],
            startPoint: .top,
            endPoint: .bottom
        )
    }
    
    private var progressBar: some View {
        HStack(spacing: 6) {
            ForEach(0..<7, id: \.self) { index in
                Capsule()
                    .fill(
                        index <= vm.currentStep
                            ? LinearGradient(colors: [blueEnergy, blueEnergy.opacity(0.8)], startPoint: .leading, endPoint: .trailing)
                            : LinearGradient(colors: [Color.gray.opacity(0.2), Color.gray.opacity(0.15)], startPoint: .leading, endPoint: .trailing)
                    )
                    .frame(height: 6)
                    .animation(.spring(response: 0.3), value: vm.currentStep)
            }
        }
    }
    
    private var stepContent: some View {
        VStack(spacing: 24) {
            VStack(spacing: 12) {
                Text(vm.currentStepInfo.instruction)
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Text(vm.currentStepInfo.description)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .padding(.horizontal)
            }
            .padding(.bottom, 20)
            
            if vm.currentStepInfo.count != nil {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Your \(vm.currentStepInfo.sense ?? "observations")")
                        .font(.headline.bold())
                    
                    TextField(
                        "List \(vm.currentStepInfo.count ?? 0) things...",
                        text: $vm.currentInput,
                        axis: .vertical
                    )
                    .lineLimit(5...10)
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(colorScheme == .light ? .white.opacity(0.9) : Color.black.opacity(0.3))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(blueEnergy.opacity(0.3), lineWidth: 1)
                    )
                }
                .cardStyling()
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "wind")
                        .font(.system(size: 60))
                        .foregroundStyle(blueEnergy.opacity(0.6))
                        .symbolEffect(.pulse, options: .repeating)
                }
                .frame(height: 120)
            }
        }
        .transition(.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal: .move(edge: .leading).combined(with: .opacity)
        ))
        .id(vm.currentStep)
    }
    
    private var submitButton: some View {
        Button {
            handleSubmit()
        } label: {
            HStack(spacing: 8) {
                if vm.currentStep < 6 {
                    Text("Continue")
                } else {
                    Text("Complete")
                }
                Image(systemName: "arrow.right")
            }
            .font(.headline)
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
        .disabled(vm.currentStepInfo.count != nil && vm.currentInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .opacity(vm.currentStepInfo.count != nil && vm.currentInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1.0)
    }
    
    private func handleSubmit() {
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
        
        if vm.currentStepInfo.count != nil {
            vm.userInputs[vm.currentStep] = vm.currentInput
        }
        
        if vm.currentStep < 6 {
            withAnimation(.easeInOut(duration: 0.4)) {
                vm.currentStep += 1
            }
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                vm.currentInput = vm.userInputs[vm.currentStep]
            }
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                dismiss()
            }
        }
    }
}

#Preview {
    ExternalAnchorView()
}

