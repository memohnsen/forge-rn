import SwiftUI
import Clerk

struct ObjectiveReviewHistoryView: View {
    @Environment(\.colorScheme) var colorScheme
    @Environment(\.dismiss) var dismiss
    @State private var vm = ObjectiveReviewViewModel()
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    if vm.isLoading {
                        VStack(spacing: 16) {
                            ForEach(0..<3, id: \.self) { index in
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(Color.gray.opacity(0.1))
                                    .frame(height: 100)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .stroke(
                                                LinearGradient(
                                                    colors: [Color.gray.opacity(0.15), Color.gray.opacity(0.05)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 1
                                            )
                                    )
                                    .opacity(0.6)
                            }
                            
                            ProgressView()
                                .padding(.top, 8)
                        }
                        .padding(.horizontal)
                        .padding(.top, 16)
                    } else if vm.objectiveReviews.isEmpty {
                        VStack(spacing: 20) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [blueEnergy.opacity(0.15), blueEnergy.opacity(0.05)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 100, height: 100)
                                
                                Image(systemName: "clock.arrow.circlepath")
                                    .font(.system(size: 40, weight: .medium))
                                    .foregroundStyle(blueEnergy)
                            }
                            
                            VStack(spacing: 8) {
                                Text("No Previous Conversations")
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                
                                Text("Your reframed training cues will appear here")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .multilineTextAlignment(.center)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 80)
                        .padding(.horizontal, 40)
                    } else {
                        ForEach(vm.objectiveReviews) { review in
                            ObjectiveReviewCard(
                                review: review,
                                isExpanded: vm.expandedItems.contains(vm.reviewIdentifier(review)),
                                onToggle: {
                                    let identifier = vm.reviewIdentifier(review)
                                    if vm.expandedItems.contains(identifier) {
                                        vm.expandedItems.remove(identifier)
                                    } else {
                                        vm.expandedItems.insert(identifier)
                                    }
                                }
                            )
                        }
                    }
                }
                .padding(.top, 16)
                .padding(.bottom, 30)
            }
            .navigationTitle("History")
            .toolbarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .task {
                await vm.loadReviews()
            }
        }
    }
}

struct ObjectiveReviewCard: View {
    @Environment(\.colorScheme) var colorScheme
    let review: ObjectiveReview
    let isExpanded: Bool
    let onToggle: () -> Void
    
    private var formattedDate: String {
        dateFormat(review.created_at) ?? ""
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.1)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 36, height: 36)
                        
                        Image(systemName: "text.bubble.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(blueEnergy)
                    }
                    
                    Text(formattedDate)
                        .font(.subheadline.bold())
                }
                
                Spacer()
                
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        onToggle()
                    }
                } label: {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(blueEnergy)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                        .padding(8)
                        .background(
                            Circle()
                                .fill(blueEnergy.opacity(0.1))
                        )
                }
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "person.fill")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(.secondary)
                            Text("The Athlete's Voice")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                                .textCase(.uppercase)
                                .tracking(0.5)
                        }
                        
                        Text(review.athlete_vent)
                            .font(.body)
                            .foregroundStyle(.secondary)
                            .lineSpacing(4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(colorScheme == .light ? Color.gray.opacity(0.08) : Color.gray.opacity(0.15))
                    )
                    
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "shield.checkmark.fill")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(blueEnergy)
                            Text("The Coach's Voice")
                                .font(.caption.bold())
                                .foregroundStyle(blueEnergy)
                                .textCase(.uppercase)
                                .tracking(0.5)
                        }
                        
                        Text(review.coach_reframe)
                            .font(.body)
                            .foregroundStyle(.primary)
                            .lineSpacing(4)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.06)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(blueEnergy.opacity(0.2), lineWidth: 1)
                    )
                }
                .padding(.top, 4)
            } else {
                Text(review.coach_reframe)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .lineSpacing(4)
            }
        }
        .cardStyling()
    }
}

#Preview {
    NavigationStack {
        ObjectiveReviewHistoryView()
    }
}

