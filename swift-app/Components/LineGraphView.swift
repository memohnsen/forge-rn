//
//  Chart.swift
//  Forge
//
//  Created by Maddisen Mohnsen on 1/10/26.
//

import SwiftUI
import Charts

struct AggregatedDataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let averageScore: Double
}

enum TrendDirection {
    case up, down, flat
}

struct LineGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var data: [AggregatedDataPoint]
    
    var timeFrame: String
    var trendThreshold: Double
    
    var yAxisStepCount: Double
    var chartYScale: [Int]
    
    var trendIconColorInverted: Bool
    var onTap: (() -> Void)? = nil
    
    func calculateTrend(from data: [AggregatedDataPoint]) -> TrendDirection {
        guard data.count >= 2 else { return .flat }
        
        let sortedData = data.sorted { $0.date < $1.date }
        guard let latestDate = sortedData.last?.date else { return .flat }

        let calendar = Calendar.current
        let cutoffDate = calendar.date(byAdding: .day, value: -7, to: latestDate) ?? latestDate
        
        let recentData = sortedData.filter { $0.date > cutoffDate }
        let previousData = sortedData.filter { $0.date <= cutoffDate }

        if previousData.isEmpty {
            return .flat
        }
        
        let recentAverage = recentData.map(\.averageScore).reduce(0, +) / Double(recentData.count)
        let previousAverage = previousData.map(\.averageScore).reduce(0, +) / Double(previousData.count)
        
        if recentAverage > previousAverage + trendThreshold {
            return .up
        } else if recentAverage < previousAverage - trendThreshold {
            return .down
        } else {
            return .flat
        }
    }
    
    var xAxisFormat: Date.FormatStyle {
        switch timeFrame {
        case "Last 30 Days":
            return .dateTime.month(.abbreviated)
        case "Last 90 Days":
            return .dateTime.month(.abbreviated)
        case "Last 6 Months", "Last 1 Year":
            return .dateTime.month(.abbreviated)
        case "All Time":
            return .dateTime.month(.abbreviated).year()
        default:
            return .dateTime.month(.abbreviated)
        }
    }
    
    var xAxisStride: Calendar.Component {
        switch timeFrame {
        case "Last 30 Days":
            return .month
        case "Last 90 Days":
            return .month
        case "Last 6 Months":
            return .month
        case "Last 1 Year":
            return .month
        case "All Time":
            return .month
        default:
            return .month
        }
    }
    
    var needsDiagonalLabels: Bool {
        switch timeFrame {
        case "Last 6 Months", "Last 1 Year", "All Time":
            return true
        default:
            return false
        }
    }
    
    private var trend: TrendDirection {
        calculateTrend(from: data)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                TrendIcon(direction: trend, isColorInverted: trendIconColorInverted)
                
                Spacer()
                
                Image(systemName: "info.circle")
                    .font(.subheadline)
                    .foregroundStyle(.tertiary)
            }
            .padding(.bottom, 16)
            
            Chart {
                ForEach(data) { dataPoint in
                    LineMark(x: .value("Date", dataPoint.date), y: .value("Score", dataPoint.averageScore))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [blueEnergy, blueEnergy.opacity(0.7)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .interpolationMethod(.catmullRom)
                        .lineStyle(.init(lineWidth: 2.5))
                        .symbol {
                            Circle()
                                .fill(blueEnergy)
                                .frame(width: 10, height: 10)
                                .overlay(
                                    Circle()
                                        .stroke(Color.white.opacity(0.3), lineWidth: 1.5)
                                )
                        }
                    
                    AreaMark(x: .value("Date", dataPoint.date), y: .value("Score", dataPoint.averageScore))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.02)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                }
            }
            .chartXAxis {
                AxisMarks(preset: .extended, values: .stride(by: xAxisStride)) { value in
                    AxisValueLabel {
                        if needsDiagonalLabels {
                            if let date = value.as(Date.self) {
                                Text(date.formatted(xAxisFormat))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                    .rotationEffect(.degrees(-45))
                                    .offset(y: 10)
                                    .padding(.vertical)
                            }
                        } else {
                            if let date = value.as(Date.self) {
                                Text(date.formatted(xAxisFormat))
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .chartYAxis {
                AxisMarks(preset: .extended, position: .trailing, values: .stride(by: yAxisStepCount)) { value in
                    AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5, dash: [4, 4]))
                        .foregroundStyle(Color.secondary.opacity(0.3))
                    AxisValueLabel()
                        .foregroundStyle(.secondary)
                }
            }
            .chartYScale(domain: chartYScale)
        }
        .frame(height: needsDiagonalLabels ? 250 : 200)
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                .shadow(color: blueEnergy.opacity(0.08), radius: 12, x: 0, y: 4)
                .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20)
                .stroke(
                    LinearGradient(
                        colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
        .padding(.horizontal)
        .padding(.bottom, 12)
        .contentShape(Rectangle())
        .onTapGesture {
            onTap?()
        }
    }
}

struct TrendIcon: View {
    var direction: TrendDirection
    var isColorInverted: Bool
    
    private var iconName: String {
        switch direction {
        case .up: return "arrow.up.right"
        case .down: return "arrow.down.right"
        case .flat: return "arrow.right"
        }
    }
    
    private var iconColor: Color {
        if isColorInverted {
            switch direction {
            case .up: return .red
            case .down: return .green
            case .flat: return blueEnergy
            }
        } else {
            switch direction {
            case .up: return .green
            case .down: return .red
            case .flat: return blueEnergy
            }
        }
    }
    
    var body: some View {
        Image(systemName: iconName)
            .font(.caption.weight(.bold))
            .foregroundStyle(iconColor)
            .padding(6)
            .background(
                Circle()
                    .fill(iconColor.opacity(0.15))
            )
    }
}
