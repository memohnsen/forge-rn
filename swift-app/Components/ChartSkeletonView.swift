import SwiftUI

struct ChartSkeletonView: View {
    @Environment(\.colorScheme) var colorScheme
    @State private var isAnimating: Bool = false
    var count: Int = 4
    
    private var shimmerColor: Color {
        colorScheme == .dark 
            ? Color.white.opacity(isAnimating ? 0.15 : 0.05) 
            : Color.gray.opacity(isAnimating ? 0.3 : 0.1)
    }
    
    var body: some View {
        VStack(spacing: 20) {
            ForEach(0..<count, id: \.self) { _ in
                VStack(spacing: 12) {
                    HStack {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(shimmerColor)
                            .frame(width: 140, height: 20)
                        
                        Spacer()
                        
                        RoundedRectangle(cornerRadius: 6)
                            .fill(shimmerColor)
                            .frame(width: 24, height: 24)
                    }
                    .padding(.bottom, 8)
                    
                    HStack(alignment: .bottom, spacing: 8) {
                        ForEach(0..<12, id: \.self) { index in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(shimmerColor)
                                .frame(height: barHeight(for: index))
                        }
                    }
                    .frame(height: 120)
                    
                    HStack {
                        ForEach(0..<4, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 4)
                                .fill(shimmerColor)
                                .frame(width: 40, height: 12)
                            Spacer()
                        }
                    }
                }
                .cardStyling()
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
    
    private func barHeight(for index: Int) -> CGFloat {
        let heights: [CGFloat] = [60, 80, 45, 90, 70, 100, 85, 65, 95, 75, 55, 88]
        return heights[index % heights.count]
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        ChartSkeletonView(count: 3)
            .padding()
    }
}

