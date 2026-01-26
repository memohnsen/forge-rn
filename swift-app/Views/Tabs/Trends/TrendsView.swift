//
//  TrendsView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Charts
import Clerk

struct TrendsView: View {
    @Environment(\.clerk) private var clerk
    @State private var vm = TrendsViewModel()
    @State private var selectedGraphConfig: GraphDetailConfig?
    @State private var selectedDateRange = "Last 30 Days"
    @State private var showChartSelection = false
    
    var isOuraConnected: Bool {
        guard let userId = clerk.user?.id else { return false }
        return vm.ouraService.getAccessToken(userId: userId) != nil
    }
    
    var isWhoopConnected: Bool {
        guard let userId = clerk.user?.id else { return false }
        return vm.whoopService.getAccessToken(userId: userId) != nil
    }
    
    var filterOptions: [String] {
        var options = ["Check-Ins", "Workouts", "Meets"]
        if isOuraConnected {
            options.append("Oura")
        }
        if isWhoopConnected {
            options.append("Whoop")
        }
        return options
    }
        
    var body: some View {
        NavigationStack{
            ZStack{
                BackgroundColor()
                
                ScrollView{
                    Filter(selected: $vm.selectedFilter, options: filterOptions)
                        .onChange(of: vm.selectedFilter) { _, newValue in
                            AnalyticsManager.shared.trackTrendsFilterChanged(filter: newValue)
                            if newValue == "Oura" {
                                Task {
                                    await vm.fetchOuraData(user: clerk.user?.id)
                                }
                            } else if newValue == "Whoop" {
                                Task {
                                    await vm.fetchWhoopData(user: clerk.user?.id)
                                }
                            }
                        }
                    
                    AIAnalysisCard {
                        vm.aiShown = true
                        AnalyticsManager.shared.trackAIAnalysisRequested(filter: vm.selectedFilter)
                    }
                    
                    if vm.selectedFilter == "Check-Ins" {
                        if vm.hasSelectedCharts(for: "Check-Ins") {
                            CheckInGraphView(vm: vm, onGraphTap: { config in selectedGraphConfig = config })
                        } else {
                            NoChartsSelectedView()
                        }
                    } else if vm.selectedFilter == "Workouts" {
                        if vm.hasSelectedCharts(for: "Workouts") {
                            WorkoutsGraphView(vm: vm, onGraphTap: { config in selectedGraphConfig = config })
                        } else {
                            NoChartsSelectedView()
                        }
                    } else if vm.selectedFilter == "Oura" {
                        if vm.isLoadingOuraData {
                            ChartSkeletonView(count: 4)
                        } else if vm.ouraSleepData.isEmpty {
                            Text("No Oura data available")
                                .foregroundColor(.secondary)
                                .padding()
                        } else if vm.hasSelectedCharts(for: "Oura") {
                            OuraGraphView(vm: vm, onGraphTap: { config in selectedGraphConfig = config })
                        } else {
                            NoChartsSelectedView()
                        }
                    } else if vm.selectedFilter == "Whoop" {
                        if vm.isLoadingWhoopData {
                            ChartSkeletonView(count: 6)
                        } else if vm.whoopData.isEmpty {
                            Text("No WHOOP data available")
                                .foregroundColor(.secondary)
                                .padding()
                        } else if vm.hasSelectedCharts(for: "Whoop") {
                            WhoopGraphView(vm: vm, onGraphTap: { config in selectedGraphConfig = config })
                        } else {
                            NoChartsSelectedView()
                        }
                    } else {
                        if vm.hasSelectedCharts(for: "Meets") {
                            MeetsGraphView(vm: vm, onGraphTap: { config in selectedGraphConfig = config })
                        } else {
                            NoChartsSelectedView()
                        }
                    }
                }
            }
            .navigationTitle("Trends")
            .toolbarTitleDisplayMode(.inlineLarge)
            .toolbar{
                ToolbarItem{
                    Menu{
                        Button{
                            vm.selectedTimeFrame = "Last 30 Days"
                            AnalyticsManager.shared.trackTrendsTimeFrameChanged(timeFrame: "Last 30 Days")
                            selectedDateRange = "Last 30 Days"
                        } label: {
                            HStack{
                                Text("Last 30 Days")
                                if selectedDateRange == "Last 30 Days" {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                        
                        Button{
                            vm.selectedTimeFrame = "Last 90 Days"
                            AnalyticsManager.shared.trackTrendsTimeFrameChanged(timeFrame: "Last 90 Days")
                            selectedDateRange = "Last 90 Days"
                        }  label: {
                            HStack{
                                Text("Last 90 Days")
                                if selectedDateRange == "Last 90 Days" {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                        
                        Button{
                            vm.selectedTimeFrame = "Last 6 Months"
                            AnalyticsManager.shared.trackTrendsTimeFrameChanged(timeFrame: "Last 6 Months")
                            selectedDateRange = "Last 6 Months"
                        } label: {
                            HStack{
                                Text("Last 6 Months")
                                if selectedDateRange == "Last 6 Months" {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                        
                        Button{
                            vm.selectedTimeFrame = "Last 1 Year"
                            AnalyticsManager.shared.trackTrendsTimeFrameChanged(timeFrame: "Last 1 Year")
                            selectedDateRange = "Last 1 Year"
                        } label: {
                            HStack{
                                Text("Last 1 Year")
                                if selectedDateRange == "Last 1 Year" {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                        
                        Button{
                            vm.selectedTimeFrame = "All Time"
                            AnalyticsManager.shared.trackTrendsTimeFrameChanged(timeFrame: "All Time")
                            selectedDateRange = "All Time"
                        } label: {
                            HStack{
                                Text("All Time")
                                if selectedDateRange == "All Time" {
                                    Spacer()
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease")
                    }
                }
                ToolbarItem {
                    Button {
                        showChartSelection = true
                    } label: {
                        Image(systemName: "chart.bar.xaxis")
                    }
                }
            }
            .sheet(isPresented: $vm.aiShown) {
                AIResults(vm: vm)
            }
            .sheet(isPresented: $showChartSelection) {
                ChartSelectionSheet(vm: vm)
            }
            .sheet(item: $selectedGraphConfig) { config in
                GraphDetailView(config: config)
            }
            .task {
                await vm.fetchAllData(user: clerk.user?.id, isOuraConnected: isOuraConnected, isWhoopConnected: isWhoopConnected)
            }
        }
    }
}

struct AIResults: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [aiPurple.opacity(0.3), colorScheme == .dark ? Color.black : Color(.secondarySystemBackground)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()
    
                VStack {
                    if vm.checkIns.count >= 10 || vm.sessionReport.count >= 10 || vm.compReport.count >= 3 {
                        if vm.aiModel.isLoading || vm.aiModel.response.isEmpty {
                            VStack(spacing: 20) {
                                ZStack {
                                    Circle()
                                        .fill(aiPurple.opacity(0.15))
                                        .frame(width: 80, height: 80)
                                    
                                    Image(systemName: "sparkles")
                                        .font(.system(size: 32, weight: .semibold))
                                        .foregroundStyle(aiPurple)
                                        .symbolEffect(.pulse, options: .repeating)
                                }
                                
                                Text("Analyzing your data...")
                                    .font(.headline)
                                    .foregroundStyle(.secondary)
                            }
                        } else {
                            ScrollView {
                                VStack(alignment: .leading, spacing: 16) {
                                    HStack(spacing: 10) {
                                        Image(systemName: "sparkles")
                                            .font(.title3.weight(.semibold))
                                            .foregroundStyle(aiPurple)
                                        
                                        Text("Your Insights")
                                            .font(.title3.bold())
                                    }
                                    .padding(.bottom, 4)
                                    
                                    Text(vm.aiModel.response.replacingOccurrences(of: "*", with: "\n"))
                                        .font(.body)
                                        .lineSpacing(4)
                                }
                                .padding(20)
                                .background(
                                    RoundedRectangle(cornerRadius: 20)
                                        .fill(colorScheme == .light ? .white : Color(white: 0.1))
                                        .shadow(color: aiPurple.opacity(0.08), radius: 12, x: 0, y: 4)
                                        .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(
                                            LinearGradient(
                                                colors: [aiPurple.opacity(0.2), aiPurple.opacity(0.05)],
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            ),
                                            lineWidth: 1
                                        )
                                )
                                .padding()
                            }
                        }
                    } else {
                        AIInsufficientDataView()
                    }
                }
            }
            .navigationTitle("AI Trend Analysis")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem {
                    if #available(iOS 26.0, *) {
                        Button("Done", role: .confirm, action: { dismiss() })
                    } else {
                        Button("Done", action: { dismiss() })
                    }
                }
            }
            .task {
                if vm.checkIns.count >= 10 || vm.sessionReport.count >= 10 || vm.compReport.count >= 3 {
                    try? await vm.aiModel.query(prompt: vm.prompt)
                    AnalyticsManager.shared.trackAIAnalysisCompleted(filter: vm.selectedFilter, dataPoints: vm.checkIns.count)
                }
            }
        }
    }
}

struct AIInsufficientDataView: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [aiPurple.opacity(0.2), aiPurple.opacity(0.08)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 100, height: 100)
                
                Image(systemName: "chart.bar.doc.horizontal")
                    .font(.system(size: 40, weight: .semibold))
                    .foregroundStyle(aiPurple)
            }
            
            VStack(spacing: 12) {
                Text("More Data Needed")
                    .font(.title2.bold())
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                Text("Complete at least 2 weeks of training to unlock personalized insights. The more data you provide, the more accurate the analysis.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
        }
        .padding()
    }
}

private let aiPurple = Color(red: 140/255, green: 100/255, blue: 200/255)

struct AIAnalysisCard: View {
    @Environment(\.colorScheme) var colorScheme
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [aiPurple.opacity(0.3), aiPurple.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 48, height: 48)
                    
                    Image(systemName: "sparkles")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [aiPurple, Color(red: 180/255, green: 140/255, blue: 255/255)],
                                startPoint: .bottomLeading,
                                endPoint: .topTrailing
                            )
                        )
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("AI Trend Analysis")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                    
                    Text("Get personalized insights from your data")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(aiPurple)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(colorScheme == .light ? .white : Color(white: 0.1))
                    .shadow(color: aiPurple.opacity(0.1), radius: 12, x: 0, y: 4)
                    .shadow(color: Color.black.opacity(0.06), radius: 6, x: 0, y: 2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(
                        LinearGradient(
                            colors: [aiPurple.opacity(0.25), aiPurple.opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

struct NoChartsSelectedView: View {
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [blueEnergy.opacity(0.2), blueEnergy.opacity(0.08)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)
                
                Image(systemName: "chart.bar.xaxis")
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(blueEnergy)
            }
            
            VStack(spacing: 8) {
                Text("No Charts Selected")
                    .font(.headline)
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                Text("Use the chart icon in the toolbar to select which charts to display.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }
}

struct ChartSelectionSheet: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        ChartSectionView(title: "Check-Ins", charts: ChartID.charts(for: "Check-Ins"), vm: vm, accentColor: Color(red: 90/255, green: 180/255, blue: 140/255))
                        ChartSectionView(title: "Workouts", charts: ChartID.charts(for: "Workouts"), vm: vm, accentColor: blueEnergy)
                        ChartSectionView(title: "Meets", charts: ChartID.charts(for: "Meets"), vm: vm, accentColor: gold)
                        ChartSectionView(title: "Oura", charts: ChartID.charts(for: "Oura"), vm: vm, accentColor: Color(red: 100/255, green: 180/255, blue: 220/255))
                        ChartSectionView(title: "Whoop", charts: ChartID.charts(for: "Whoop"), vm: vm, accentColor: Color(red: 220/255, green: 100/255, blue: 100/255))
                    }
                    .padding()
                    .padding(.bottom, 20)
                }
            }
            .navigationTitle("Select Charts")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem {
                    if #available(iOS 26.0, *) {
                        Button("Done", role: .confirm, action: { dismiss() })
                    } else {
                        Button("Done", action: { dismiss() })
                    }
                }
            }
        }
    }
}

struct ChartSectionView: View {
    @Environment(\.colorScheme) var colorScheme
    let title: String
    let charts: [ChartID]
    var vm: TrendsViewModel
    var accentColor: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                Circle()
                    .fill(accentColor)
                    .frame(width: 8, height: 8)
                
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 4)
            
            VStack(spacing: 8) {
                ForEach(charts, id: \.self) { chart in
                    Button {
                        vm.toggleChart(chart)
                    } label: {
                        HStack(spacing: 12) {
                            Text(chart.displayName)
                                .font(.subheadline)
                                .foregroundStyle(colorScheme == .light ? .black : .white)
                            
                            Spacer()
                            
                            ZStack {
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(vm.isChartSelected(chart) ? accentColor : Color.gray.opacity(0.3), lineWidth: 1.5)
                                    .frame(width: 22, height: 22)
                                
                                if vm.isChartSelected(chart) {
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(accentColor)
                                        .frame(width: 22, height: 22)
                                    
                                    Image(systemName: "checkmark")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(.white)
                                }
                            }
                        }
                        .padding(14)
                        .background(
                            RoundedRectangle(cornerRadius: 14)
                                .fill(colorScheme == .light ? .white : Color(white: 0.1))
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(
                                    vm.isChartSelected(chart) ? accentColor.opacity(0.3) : Color.clear,
                                    lineWidth: 1
                                )
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct CheckInGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    var onGraphTap: (GraphDetailConfig) -> Void
    
    var body: some View {
        VStack{
            if vm.isChartSelected(.checkInOverall) {
                LineGraphView(
                    title: "Overall Readiness",
                    data: vm.checkInOverallScoreChartData,
                timeFrame: vm.selectedTimeFrame,
                trendThreshold: 3.0,
                yAxisStepCount: 20.0,
                chartYScale: [0, 100],
                trendIconColorInverted: false,
                onTap: {
                    onGraphTap(GraphDetailConfig(
                        title: "Overall Readiness",
                        data: vm.allCheckInOverallScoreData,
                        chartYScale: [0, 100],
                        yAxisStepCount: 20.0,
                        trendIconColorInverted: false,
                        trendThreshold: 3.0,
                        zones: vm.zonesForMetric("overallReadiness"),
                        unit: "%",
                        metricKey: "overallReadiness",
                        descriptiveTextGenerator: { value, trend, zone in
                            vm.descriptiveTextForMetric("overallReadiness", value: value, trend: trend, zone: zone)
                        }
                    ))
                }
            )
            }
            
            if vm.isChartSelected(.checkInPhysical) {
                LineGraphView(
                    title: "Physical Readiness",
                    data: vm.checkInPhysicalScoreChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 100],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Physical Readiness",
                            data: vm.allCheckInPhysicalScoreData,
                            chartYScale: [0, 100],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("physicalReadiness"),
                            unit: "%",
                            metricKey: "physicalReadiness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("physicalReadiness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInMental) {
                LineGraphView(
                    title: "Mental Readiness",
                    data: vm.checkInMentalScoreChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 100],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Mental Readiness",
                            data: vm.allCheckInMentalScoreData,
                            chartYScale: [0, 100],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("mentalReadiness"),
                            unit: "%",
                            metricKey: "mentalReadiness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("mentalReadiness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInPhysicalStrength) {
                LineGraphView(
                    title: "Physical Strength",
                    data: vm.checkInPhysicalStrengthChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Physical Strength",
                            data: vm.allCheckInPhysicalStrengthData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("physicalStrength"),
                            unit: "",
                            metricKey: "physicalStrength",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("physicalStrength", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInMentalStrength) {
                LineGraphView(
                    title: "Mental Strength",
                    data: vm.checkInMentalStrengthChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Mental Strength",
                            data: vm.allCheckInMentalStrengthData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("mentalStrength"),
                            unit: "",
                            metricKey: "mentalStrength",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("mentalStrength", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInRecovered) {
                LineGraphView(
                    title: "Recovery",
                    data: vm.checkInRecoveredChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Recovery",
                            data: vm.allCheckInRecoveredData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("recovered"),
                            unit: "",
                            metricKey: "recovered",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("recovered", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInConfidence) {
                LineGraphView(
                    title: "Confidence",
                    data: vm.checkInConfidenceChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Confidence",
                            data: vm.allCheckInConfidenceData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("confidence"),
                            unit: "",
                            metricKey: "confidence",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("confidence", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInSleep) {
                LineGraphView(
                    title: "Sleep Quality",
                    data: vm.checkInSleepChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Sleep Quality",
                            data: vm.allCheckInSleepData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("sleepQuality"),
                            unit: "",
                            metricKey: "sleepQuality",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("sleepQuality", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInEnergy) {
                LineGraphView(
                    title: "Energy",
                    data: vm.checkInEnergyChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Energy",
                            data: vm.allCheckInEnergyData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("energy"),
                            unit: "",
                            metricKey: "energy",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("energy", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInStress) {
                LineGraphView(
                    title: "Stress",
                    data: vm.checkInStressChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Stress",
                            data: vm.allCheckInStressData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: true,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("stress"),
                            unit: "",
                            metricKey: "stress",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("stress", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInSoreness) {
                LineGraphView(
                    title: "Soreness",
                    data: vm.checkInSorenessChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Soreness",
                            data: vm.allCheckInSorenessData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: true,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("soreness"),
                            unit: "",
                            metricKey: "soreness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("soreness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInReadiness) {
                LineGraphView(
                    title: "Readiness",
                    data: vm.checkInReadinessChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Readiness",
                            data: vm.allCheckInReadinessData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("readiness"),
                            unit: "",
                            metricKey: "readiness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("readiness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInFocus) {
                LineGraphView(
                    title: "Focus",
                    data: vm.checkInFocusChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Focus",
                            data: vm.allCheckInFocusData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("focus"),
                            unit: "",
                            metricKey: "focus",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("focus", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInExcitement) {
                LineGraphView(
                    title: "Excitement",
                    data: vm.checkInExcitementChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Excitement",
                            data: vm.allCheckInExcitementData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("excitement"),
                            unit: "",
                            metricKey: "excitement",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("excitement", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.checkInBodyConnection) {
                LineGraphView(
                    title: "Body Connection",
                    data: vm.checkInBodyConnectionChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Body Connection",
                            data: vm.allCheckInBodyConnectionData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("bodyConnection"),
                            unit: "",
                            metricKey: "bodyConnection",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("bodyConnection", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
        }
        .padding(.bottom, 30)
    }
}

struct WorkoutsGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    var onGraphTap: (GraphDetailConfig) -> Void

    var body: some View {
        VStack{
            if vm.isChartSelected(.workoutRPE) {
                LineGraphView(
                    title: "Session RPE",
                    data: vm.sessionRPEChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Session RPE",
                            data: vm.allSessionRPEData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: true,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("sessionRPE"),
                            unit: "",
                            metricKey: "sessionRPE",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("sessionRPE", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutMovementQuality) {
                LineGraphView(
                    title: "Movement Quality",
                    data: vm.sessionMovementQualityChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Movement Quality",
                            data: vm.allSessionMovementQualityData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("movementQuality"),
                            unit: "",
                            metricKey: "movementQuality",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("movementQuality", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutFocus) {
                LineGraphView(
                    title: "Focus",
                    data: vm.sessionFocusChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Focus",
                            data: vm.allSessionFocusData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("focus"),
                            unit: "",
                            metricKey: "focus",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("focus", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutMisses) {
                LineGraphView(
                    title: "Misses",
                    data: vm.sessionMissesChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [0, 5],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Misses",
                            data: vm.allSessionMissesData,
                            chartYScale: [0, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: true,
                            trendThreshold: 0.3,
                            zones: nil,
                            unit: "",
                            metricKey: "misses",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("misses", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutFeeling) {
                LineGraphView(
                    title: "Feeling",
                    data: vm.sessionFeelingChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Feeling",
                            data: vm.allSessionFeelingData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("feeling"),
                            unit: "",
                            metricKey: "feeling",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("feeling", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutSatisfaction) {
                LineGraphView(
                    title: "Satisfaction",
                    data: vm.sessionSatisfactionChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Satisfaction",
                            data: vm.allSessionSatisfactionData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("satisfaction"),
                            unit: "",
                            metricKey: "satisfaction",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("satisfaction", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.workoutConfidence) {
                LineGraphView(
                    title: "Confidence",
                    data: vm.sessionConfidenceChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Confidence",
                            data: vm.allSessionConfidenceData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("confidence"),
                            unit: "",
                            metricKey: "confidence",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("confidence", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
        }
    }
}

struct MeetsGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    @AppStorage("userSport") private var userSport: String = ""
    var vm: TrendsViewModel
    var onGraphTap: (GraphDetailConfig) -> Void
    
    var body: some View {
        VStack{
            if vm.isChartSelected(.meetPerformance) {
                LineGraphView(
                    title: "Performance Rating",
                    data: vm.compPerformanceChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Performance Rating",
                            data: vm.allCompPerformanceData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("performanceRating"),
                            unit: "",
                            metricKey: "performanceRating",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("performanceRating", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetPhysicalPreparedness) {
                LineGraphView(
                    title: "Physical Preparedness",
                    data: vm.compPhysicalPreparednessChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Physical Preparedness",
                            data: vm.allCompPhysicalPreparednessData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("physicalPreparedness"),
                            unit: "",
                            metricKey: "physicalPreparedness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("physicalPreparedness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetMentalPreparedness) {
                LineGraphView(
                    title: "Mental Preparedness",
                    data: vm.compMentalPreparednessChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Mental Preparedness",
                            data: vm.allCompMentalPreparednessData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("mentalPreparedness"),
                            unit: "",
                            metricKey: "mentalPreparedness",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("mentalPreparedness", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetTotal) {
                if userSport == "Olympic Weightlifting" {
                    LineGraphView(
                        title: "Total",
                        data: vm.compWLTotalChartData,
                        timeFrame: vm.selectedTimeFrame,
                        trendThreshold: 3.0,
                        yAxisStepCount: 100.0,
                        chartYScale: [0, 500],
                        trendIconColorInverted: false,
                        onTap: {
                            onGraphTap(GraphDetailConfig(
                                title: "Total",
                                data: vm.allCompWLTotalData,
                                chartYScale: [0, 500],
                                yAxisStepCount: 100.0,
                                trendIconColorInverted: false,
                                trendThreshold: 3.0,
                                zones: nil,
                                unit: "kg",
                                metricKey: "total",
                                descriptiveTextGenerator: { value, trend, zone in
                                    vm.descriptiveTextForMetric("total", value: value, trend: trend, zone: zone)
                                }
                            ))
                        }
                    )
                } else {
                    LineGraphView(
                        title: "Total",
                        data: vm.compPLTotalChartData,
                        timeFrame: vm.selectedTimeFrame,
                        trendThreshold: 3.0,
                        yAxisStepCount: 200.0,
                        chartYScale: [0, 1000],
                        trendIconColorInverted: false,
                        onTap: {
                            onGraphTap(GraphDetailConfig(
                                title: "Total",
                                data: vm.allCompPLTotalData,
                                chartYScale: [0, 1000],
                                yAxisStepCount: 200.0,
                                trendIconColorInverted: false,
                                trendThreshold: 3.0,
                                zones: nil,
                                unit: "kg",
                                metricKey: "total",
                                descriptiveTextGenerator: { value, trend, zone in
                                    vm.descriptiveTextForMetric("total", value: value, trend: trend, zone: zone)
                                }
                            ))
                        }
                    )
                }
            }
            
            if vm.isChartSelected(.meetSatisfaction) {
                LineGraphView(
                    title: "Satisfaction",
                    data: vm.compSatisfactionChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Satisfaction",
                            data: vm.allCompSatisfactionData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("satisfaction"),
                            unit: "",
                            metricKey: "satisfaction",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("satisfaction", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetConfidence) {
                LineGraphView(
                    title: "Confidence",
                    data: vm.compConfidenceChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Confidence",
                            data: vm.allCompConfidenceData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("confidence"),
                            unit: "",
                            metricKey: "confidence",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("confidence", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetPressureHandling) {
                LineGraphView(
                    title: "Pressure Handling",
                    data: vm.compPressureHandlingChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.3,
                    yAxisStepCount: 1.0,
                    chartYScale: [1, 5],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Pressure Handling",
                            data: vm.allCompPressureHandlingData,
                            chartYScale: [1, 5],
                            yAxisStepCount: 1.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.3,
                            zones: vm.zonesForMetric("pressureHandling"),
                            unit: "",
                            metricKey: "pressureHandling",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("pressureHandling", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetBodyweight) {
                LineGraphView(
                    title: "Bodyweight",
                    data: vm.compBodyweightChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 1.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 200],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Bodyweight",
                            data: vm.allCompBodyweightData,
                            chartYScale: [0, 200],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 1.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "bodyweight",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("bodyweight", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetSnatchBest) && userSport == "Olympic Weightlifting" {
                LineGraphView(
                    title: "Snatch Best",
                    data: vm.compSnatchBestChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 2.0,
                    yAxisStepCount: 50.0,
                    chartYScale: [0, 250],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Snatch Best",
                            data: vm.allCompSnatchBestData,
                            chartYScale: [0, 250],
                            yAxisStepCount: 50.0,
                            trendIconColorInverted: false,
                            trendThreshold: 2.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "snatchBest",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("snatchBest", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetCJBest) && userSport == "Olympic Weightlifting" {
                LineGraphView(
                    title: "Clean & Jerk Best",
                    data: vm.compCJBestChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 2.0,
                    yAxisStepCount: 50.0,
                    chartYScale: [0, 300],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Clean & Jerk Best",
                            data: vm.allCompCJBestData,
                            chartYScale: [0, 300],
                            yAxisStepCount: 50.0,
                            trendIconColorInverted: false,
                            trendThreshold: 2.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "cjBest",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("cjBest", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetSquatBest) && userSport == "Powerlifting" {
                LineGraphView(
                    title: "Squat Best",
                    data: vm.compSquatBestChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 5.0,
                    yAxisStepCount: 100.0,
                    chartYScale: [0, 500],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Squat Best",
                            data: vm.allCompSquatBestData,
                            chartYScale: [0, 500],
                            yAxisStepCount: 100.0,
                            trendIconColorInverted: false,
                            trendThreshold: 5.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "squatBest",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("squatBest", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetBenchBest) && userSport == "Powerlifting" {
                LineGraphView(
                    title: "Bench Best",
                    data: vm.compBenchBestChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 50.0,
                    chartYScale: [0, 300],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Bench Best",
                            data: vm.allCompBenchBestData,
                            chartYScale: [0, 300],
                            yAxisStepCount: 50.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "benchBest",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("benchBest", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.meetDeadliftBest) && userSport == "Powerlifting" {
                LineGraphView(
                    title: "Deadlift Best",
                    data: vm.compDeadliftBestChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 5.0,
                    yAxisStepCount: 100.0,
                    chartYScale: [0, 500],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Deadlift Best",
                            data: vm.allCompDeadliftBestData,
                            chartYScale: [0, 500],
                            yAxisStepCount: 100.0,
                            trendIconColorInverted: false,
                            trendThreshold: 5.0,
                            zones: nil,
                            unit: "kg",
                            metricKey: "deadliftBest",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("deadliftBest", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
        }
        .padding(.bottom, 30)
    }
}

struct OuraGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    var onGraphTap: (GraphDetailConfig) -> Void
    
    var body: some View {
        VStack{
            if vm.isChartSelected(.ouraSleep) {
                LineGraphView(
                    title: "Sleep Duration",
                    data: vm.sleepChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.25,
                    yAxisStepCount: 3.0,
                    chartYScale: [0, 12],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Sleep Duration",
                            data: vm.allSleepData,
                            chartYScale: [0, 12],
                            yAxisStepCount: 3.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.25,
                            zones: vm.zonesForMetric("ouraSleep"),
                            unit: "hrs",
                            metricKey: "ouraSleep",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("ouraSleep", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.ouraHRV) {
                LineGraphView(
                    title: "HRV",
                    data: vm.ouraHRVChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 50.0,
                    chartYScale: [0, 200],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "HRV",
                            data: vm.allOuraHRVData,
                            chartYScale: [0, 200],
                            yAxisStepCount: 50.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("ouraHRV"),
                            unit: "ms",
                            metricKey: "ouraHRV",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("ouraHRV", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.ouraHeartRate) {
                LineGraphView(
                    title: "Average Heart Rate",
                    data: vm.heartRateChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 1.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [20, 80],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Average Heart Rate",
                            data: vm.allHeartRateData,
                            chartYScale: [20, 80],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: true,
                            trendThreshold: 1.0,
                            zones: vm.zonesForMetric("heartRate"),
                            unit: "bpm",
                            metricKey: "heartRate",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("heartRate", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.ouraReadiness) {
                LineGraphView(
                    title: "Readiness Score",
                    data: vm.readinessChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 100],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Readiness Score",
                            data: vm.allReadinessData,
                            chartYScale: [0, 100],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("readinessScore"),
                            unit: "%",
                            metricKey: "readinessScore",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("readinessScore", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
        }
        .padding(.bottom, 30)
    }
}

struct WhoopGraphView: View {
    @Environment(\.colorScheme) var colorScheme
    var vm: TrendsViewModel
    var onGraphTap: (GraphDetailConfig) -> Void

    var body: some View {
        VStack {
            if vm.isChartSelected(.whoopRecovery) {
                LineGraphView(
                    title: "Recovery Score",
                    data: vm.recoveryChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 100],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Recovery Score",
                            data: vm.allRecoveryData,
                            chartYScale: [0, 100],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("recoveryScore"),
                            unit: "%",
                            metricKey: "recoveryScore",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("recoveryScore", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.whoopSleep) {
                LineGraphView(
                    title: "Sleep Duration",
                    data: vm.sleepDurationChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 0.25,
                    yAxisStepCount: 3.0,
                    chartYScale: [0, 12],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Sleep Duration",
                            data: vm.allSleepDurationData,
                            chartYScale: [0, 12],
                            yAxisStepCount: 3.0,
                            trendIconColorInverted: false,
                            trendThreshold: 0.25,
                            zones: vm.zonesForMetric("whoopSleep"),
                            unit: "hrs",
                            metricKey: "whoopSleep",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("whoopSleep", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.whoopSleepPerformance) {
                LineGraphView(
                    title: "Sleep Performance",
                    data: vm.sleepPerformanceChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [0, 100],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Sleep Performance",
                            data: vm.allSleepPerformanceData,
                            chartYScale: [0, 100],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("sleepPerformance"),
                            unit: "%",
                            metricKey: "sleepPerformance",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("sleepPerformance", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.whoopStrain) {
                LineGraphView(
                    title: "Strain Score",
                    data: vm.strainChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 1.0,
                    yAxisStepCount: 3.0,
                    chartYScale: [0, 21],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Strain Score",
                            data: vm.allStrainData,
                            chartYScale: [0, 21],
                            yAxisStepCount: 3.0,
                            trendIconColorInverted: true,
                            trendThreshold: 1.0,
                            zones: vm.zonesForMetric("strainScore"),
                            unit: "",
                            metricKey: "strainScore",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("strainScore", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.whoopHRV) {
                LineGraphView(
                    title: "HRV",
                    data: vm.whoopHRVChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 3.0,
                    yAxisStepCount: 50.0,
                    chartYScale: [0, 200],
                    trendIconColorInverted: false,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "HRV",
                            data: vm.allWhoopHRVData,
                            chartYScale: [0, 200],
                            yAxisStepCount: 50.0,
                            trendIconColorInverted: false,
                            trendThreshold: 3.0,
                            zones: vm.zonesForMetric("whoopHRV"),
                            unit: "ms",
                            metricKey: "whoopHRV",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("whoopHRV", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
            
            if vm.isChartSelected(.whoopRestingHeartRate) {
                LineGraphView(
                    title: "Resting Heart Rate",
                    data: vm.restingHeartRateChartData,
                    timeFrame: vm.selectedTimeFrame,
                    trendThreshold: 1.0,
                    yAxisStepCount: 20.0,
                    chartYScale: [20, 80],
                    trendIconColorInverted: true,
                    onTap: {
                        onGraphTap(GraphDetailConfig(
                            title: "Resting Heart Rate",
                            data: vm.allRestingHeartRateData,
                            chartYScale: [20, 80],
                            yAxisStepCount: 20.0,
                            trendIconColorInverted: true,
                            trendThreshold: 1.0,
                            zones: vm.zonesForMetric("restingHeartRate"),
                            unit: "bpm",
                            metricKey: "restingHeartRate",
                            descriptiveTextGenerator: { value, trend, zone in
                                vm.descriptiveTextForMetric("restingHeartRate", value: value, trend: trend, zone: zone)
                            }
                        ))
                    }
                )
            }
        }
        .padding(.bottom, 30)
    }
}

#Preview {
    TrendsView()
}
