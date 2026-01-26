import SwiftUI
import Charts

struct GraphDetailView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    @State private var vm: GraphDetailViewModel
    
    init(config: GraphDetailConfig) {
        _vm = State(initialValue: GraphDetailViewModel(config: config))
    }
    
    private var themeColor: Color {
        if let zone = vm.currentZone {
            return zone.color
        }
        return blueEnergy
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [themeColor.opacity(0.5), colorScheme == .dark ? Color.black : Color.white],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        headerSection
                        dateNavigationSection
                        chartSection
                        statisticsSection
                    }
                    .padding(.bottom, 30)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
    
    private var headerSection: some View {
        VStack(spacing: 12) {
            HStack(spacing: 8) {
                if let zone = vm.currentZone {
                    Image(systemName: "heart.fill")
                        .foregroundColor(zone.color)
                }
                Text(vm.config.title)
                    .font(.title3.bold())
                    .foregroundColor(themeColor)
            }
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(formatValue(vm.currentValue))
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                
                Text(vm.config.unit)
                    .font(.title2)
                    .foregroundColor(.secondary)
            }
            
            if let latestDate = vm.filteredData.last?.date {
                Text(latestDate, style: .date)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            
            if let description = vm.descriptiveText {
                Text(description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                    .padding(.top, 8)
            }
            
            Divider()
                .padding(.top, 8)
        }
        .padding(.horizontal)
        .padding(.top, 16)
    }
    
    private var dateNavigationSection: some View {
        VStack(spacing: 16) {
            HStack {
                Button {
                    vm.navigateBackward()
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundColor(vm.canNavigateBackward ? .primary : .secondary.opacity(0.3))
                        .padding(12)
                        .background(Circle().fill(colorScheme == .dark ? Color.black.opacity(0.3) : Color.white.opacity(0.8)))
                }
                .disabled(!vm.canNavigateBackward)
                
                Spacer()
                
                Text(vm.dateRangeString)
                    .font(.subheadline.weight(.medium))
                
                Spacer()
                
                Button {
                    vm.navigateForward()
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.title3)
                        .foregroundColor(vm.canNavigateForward ? .primary : .secondary.opacity(0.3))
                        .padding(12)
                        .background(Circle().fill(colorScheme == .dark ? Color.black.opacity(0.3) : Color.white.opacity(0.8)))
                }
                .disabled(!vm.canNavigateForward)
            }
            .padding(.horizontal)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(["Last 30 Days", "Last 90 Days", "Last 6 Months", "Last 1 Year", "All Time"], id: \.self) { option in
                        Button {
                            vm.setTimeFrame(option)
                        } label: {
                            Text(option)
                                .font(.subheadline.weight(.medium))
                                .foregroundColor(vm.selectedTimeFrame == option ? .white : .primary)
                                .padding(.vertical, 8)
                                .padding(.horizontal, 12)
                                .background(
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(vm.selectedTimeFrame == option ? themeColor : (colorScheme == .dark ? Color.black.opacity(0.3) : Color.white.opacity(0.8)))
                                )
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
    }
    
    private var chartSection: some View {
        VStack {
            Chart {
                if let zones = vm.config.zones {
                    ForEach(zones) { zone in
                        RectangleMark(
                            xStart: nil,
                            xEnd: nil,
                            yStart: .value("Start", zone.minValue),
                            yEnd: .value("End", zone.maxValue)
                        )
                        .foregroundStyle(zone.color.opacity(0.15))
                    }
                }
                
                ForEach(vm.filteredData) { dataPoint in
                    LineMark(
                        x: .value("Date", dataPoint.date),
                        y: .value("Value", dataPoint.averageScore)
                    )
                    .foregroundStyle(themeColor)
                    .interpolationMethod(.catmullRom)
                    .lineStyle(.init(lineWidth: 2))
                }
                
                if let lastPoint = vm.filteredData.last {
                    PointMark(
                        x: .value("Date", lastPoint.date),
                        y: .value("Value", lastPoint.averageScore)
                    )
                    .foregroundStyle(themeColor)
                    .symbolSize(100)
                }
            }
            .chartYScale(domain: vm.config.chartYScale)
            .chartYAxis {
                AxisMarks(position: .trailing, values: .stride(by: vm.config.yAxisStepCount)) { value in
                    AxisGridLine()
                    AxisValueLabel {
                        if let doubleValue = value.as(Double.self) {
                            Text(formatAxisValue(doubleValue))
                                .font(.caption)
                        }
                    }
                }
            }
            .chartXAxis {
                AxisMarks(preset: .aligned) { value in
                    AxisValueLabel {
                        if let date = value.as(Date.self) {
                            Text(formatAxisDate(date))
                                .font(.caption2)
                        }
                    }
                }
            }
            .frame(height: 250)
            
            if let zones = vm.config.zones {
                HStack(spacing: 16) {
                    ForEach(zones) { zone in
                        HStack(spacing: 4) {
                            Circle()
                                .fill(zone.color)
                                .frame(width: 8, height: 8)
                            Text(zone.label)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(.top, 8)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(colorScheme == .dark ? Color.black.opacity(0.3) : Color.white.opacity(0.8))
        )
        .padding(.horizontal)
    }
    
    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Statistics")
                .font(.headline)
                .padding(.horizontal)
            
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                StatCard(
                    title: "Average",
                    value: formatValue(vm.averageValue),
                    unit: vm.config.unit,
                    color: themeColor
                )
                
                StatCard(
                    title: "Trend",
                    value: String(format: "%+.1f%%", vm.trendPercentage),
                    unit: "",
                    color: trendColor,
                    icon: trendIcon
                )
                
                StatCard(
                    title: "Min",
                    value: formatValue(vm.minValue),
                    unit: vm.config.unit,
                    color: .secondary
                )
                
                StatCard(
                    title: "Max",
                    value: formatValue(vm.maxValue),
                    unit: vm.config.unit,
                    color: .secondary
                )
            }
            .padding(.horizontal)
        }
    }
    
    private var trendColor: Color {
        if vm.config.trendIconColorInverted {
            return vm.trendDirection == .up ? .red : (vm.trendDirection == .down ? .green : blueEnergy)
        }
        return vm.trendDirection == .up ? .green : (vm.trendDirection == .down ? .red : blueEnergy)
    }
    
    private var trendIcon: String? {
        switch vm.trendDirection {
        case .up: return "arrow.up"
        case .down: return "arrow.down"
        case .flat: return nil
        }
    }
    
    private func formatValue(_ value: Double) -> String {
        if value == value.rounded() {
            return String(format: "%.0f", value)
        }
        return String(format: "%.1f", value)
    }
    
    private func formatAxisValue(_ value: Double) -> String {
        if value >= 1000 {
            return String(format: "%.0fK", value / 1000)
        }
        return String(format: "%.0f", value)
    }
    
    private func formatAxisDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        switch vm.selectedTimeFrame {
        case "Last 30 Days":
            formatter.dateFormat = "MMM d"
        case "Last 90 Days":
            formatter.dateFormat = "MMM d"
        case "Last 6 Months", "Last 1 Year":
            formatter.dateFormat = "MMM"
        default:
            formatter.dateFormat = "MMM yy"
        }
        return formatter.string(from: date)
    }
}

struct StatCard: View {
    @Environment(\.colorScheme) var colorScheme
    let title: String
    let value: String
    let unit: String
    let color: Color
    var icon: String? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.title3.bold())
                        .foregroundColor(color)
                }
                
                Text(value)
                    .font(.title2.bold())
                    .foregroundColor(color)
                
                if !unit.isEmpty {
                    Text(unit)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(colorScheme == .dark ? Color.gray.opacity(0.2) : Color.white.opacity(0.8))
        )
        .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)
    }
}

