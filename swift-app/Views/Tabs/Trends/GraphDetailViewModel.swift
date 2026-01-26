import Foundation
import SwiftUI

struct ZoneRange: Identifiable {
    let id = UUID()
    let label: String
    let minValue: Double
    let maxValue: Double
    let color: Color
}

struct GraphDetailConfig: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let data: [AggregatedDataPoint]
    let chartYScale: [Int]
    let yAxisStepCount: Double
    let trendIconColorInverted: Bool
    let trendThreshold: Double
    let zones: [ZoneRange]?
    let unit: String
    let metricKey: String
    let descriptiveTextGenerator: (Double, TrendDirection, ZoneRange?) -> String
    
    static func == (lhs: GraphDetailConfig, rhs: GraphDetailConfig) -> Bool {
        lhs.id == rhs.id
    }
}

@Observable
class GraphDetailViewModel {
    var config: GraphDetailConfig
    var selectedTimeFrame: String = "Last 30 Days"
    var dateRangeEnd: Date = Date()
    
    private let timeFrameOptions = ["Last 30 Days", "Last 90 Days", "Last 6 Months", "Last 1 Year", "All Time"]
    
    init(config: GraphDetailConfig) {
        self.config = config
    }
    
    var dateRangeStart: Date {
        let calendar = Calendar.current
        switch selectedTimeFrame {
        case "Last 30 Days":
            return calendar.date(byAdding: .day, value: -30, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 90 Days":
            return calendar.date(byAdding: .day, value: -90, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 6 Months":
            return calendar.date(byAdding: .month, value: -6, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 1 Year":
            return calendar.date(byAdding: .year, value: -1, to: dateRangeEnd) ?? dateRangeEnd
        case "All Time":
            return Date.distantPast
        default:
            return calendar.date(byAdding: .day, value: -30, to: dateRangeEnd) ?? dateRangeEnd
        }
    }
    
    var filteredData: [AggregatedDataPoint] {
        let rawFiltered = config.data.filter { $0.date >= dateRangeStart && $0.date <= dateRangeEnd }
        return aggregateData(rawFiltered)
    }
    
    private func aggregateData(_ data: [AggregatedDataPoint]) -> [AggregatedDataPoint] {
        let calendar = Calendar.current
        
        let shouldAggregate: Bool
        let groupingComponent: Calendar.Component
        
        switch selectedTimeFrame {
        case "Last 30 Days":
            shouldAggregate = false
            groupingComponent = .day
        case "Last 90 Days":
            shouldAggregate = true
            groupingComponent = .weekOfYear
        case "Last 6 Months", "Last 1 Year", "All Time":
            shouldAggregate = true
            groupingComponent = .month
        default:
            shouldAggregate = false
            groupingComponent = .day
        }
        
        if !shouldAggregate {
            return data.sorted { $0.date < $1.date }
        }
        
        var groupedData: [DateComponents: [Double]] = [:]
        
        for point in data {
            let components: DateComponents
            if groupingComponent == .weekOfYear {
                components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: point.date)
            } else {
                components = calendar.dateComponents([.year, .month], from: point.date)
            }
            
            if groupedData[components] == nil {
                groupedData[components] = []
            }
            groupedData[components]?.append(point.averageScore)
        }
        
        return groupedData.compactMap { (components, scores) in
            let average = scores.reduce(0, +) / Double(scores.count)
            
            var representativeDate: Date?
            if groupingComponent == .weekOfYear {
                representativeDate = calendar.date(from: components)
            } else {
                var monthComponents = components
                monthComponents.day = 1
                representativeDate = calendar.date(from: monthComponents)
            }
            
            if let date = representativeDate {
                return AggregatedDataPoint(date: date, averageScore: average)
            }
            return nil
        }.sorted { $0.date < $1.date }
    }
    
    var currentValue: Double {
        filteredData.last?.averageScore ?? 0
    }
    
    var averageValue: Double {
        guard !filteredData.isEmpty else { return 0 }
        return filteredData.map(\.averageScore).reduce(0, +) / Double(filteredData.count)
    }
    
    var minValue: Double {
        filteredData.map(\.averageScore).min() ?? 0
    }
    
    var maxValue: Double {
        filteredData.map(\.averageScore).max() ?? 0
    }
    
    var trendPercentage: Double {
        guard filteredData.count >= 2 else { return 0 }
        
        let sortedData = filteredData.sorted { $0.date < $1.date }
        let midpoint = sortedData.count / 2
        
        let firstHalf = Array(sortedData.prefix(midpoint))
        let secondHalf = Array(sortedData.suffix(from: midpoint))
        
        guard !firstHalf.isEmpty && !secondHalf.isEmpty else { return 0 }
        
        let firstAvg = firstHalf.map(\.averageScore).reduce(0, +) / Double(firstHalf.count)
        let secondAvg = secondHalf.map(\.averageScore).reduce(0, +) / Double(secondHalf.count)
        
        guard firstAvg != 0 else { return 0 }
        
        return ((secondAvg - firstAvg) / firstAvg) * 100
    }
    
    var trendDirection: TrendDirection {
        if trendPercentage > config.trendThreshold {
            return .up
        } else if trendPercentage < -config.trendThreshold {
            return .down
        }
        return .flat
    }
    
    var currentZone: ZoneRange? {
        guard let zones = config.zones else { return nil }
        return zones.first { currentValue >= $0.minValue && currentValue < $0.maxValue }
    }
    
    var descriptiveText: String? {
        config.descriptiveTextGenerator(currentValue, trendDirection, currentZone)
    }
    
    var dateRangeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        
        if selectedTimeFrame == "All Time" {
            if let earliest = filteredData.first?.date {
                return "\(formatter.string(from: earliest)) – \(formatter.string(from: dateRangeEnd))"
            }
            return "All Time"
        }
        
        return "\(formatter.string(from: dateRangeStart)) – \(formatter.string(from: dateRangeEnd))"
    }
    
    var canNavigateForward: Bool {
        let calendar = Calendar.current
        return !calendar.isDateInToday(dateRangeEnd) && dateRangeEnd < Date()
    }
    
    var canNavigateBackward: Bool {
        guard let earliestData = config.data.min(by: { $0.date < $1.date }) else { return false }
        return dateRangeStart > earliestData.date
    }
    
    func navigateBackward() {
        let calendar = Calendar.current
        switch selectedTimeFrame {
        case "Last 30 Days":
            dateRangeEnd = calendar.date(byAdding: .day, value: -30, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 90 Days":
            dateRangeEnd = calendar.date(byAdding: .day, value: -90, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 6 Months":
            dateRangeEnd = calendar.date(byAdding: .month, value: -6, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 1 Year":
            dateRangeEnd = calendar.date(byAdding: .year, value: -1, to: dateRangeEnd) ?? dateRangeEnd
        default:
            break
        }
    }
    
    func navigateForward() {
        let calendar = Calendar.current
        let now = Date()
        
        var newEnd: Date
        switch selectedTimeFrame {
        case "Last 30 Days":
            newEnd = calendar.date(byAdding: .day, value: 30, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 90 Days":
            newEnd = calendar.date(byAdding: .day, value: 90, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 6 Months":
            newEnd = calendar.date(byAdding: .month, value: 6, to: dateRangeEnd) ?? dateRangeEnd
        case "Last 1 Year":
            newEnd = calendar.date(byAdding: .year, value: 1, to: dateRangeEnd) ?? dateRangeEnd
        default:
            return
        }
        
        dateRangeEnd = min(newEnd, now)
    }
    
    func setTimeFrame(_ timeFrame: String) {
        selectedTimeFrame = timeFrame
        dateRangeEnd = Date()
    }
}

