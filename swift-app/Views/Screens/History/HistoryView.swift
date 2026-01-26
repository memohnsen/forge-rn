//
//  HistoryView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/25/25.
//

import SwiftUI
import Clerk

struct HistoryView: View {
    @AppStorage("userSport") private var userSport: String = ""
    @Environment(\.clerk) private var clerk
    @State private var vm = HistoryViewModel()
    
    var body: some View {
        NavigationStack{
            ZStack{
                BackgroundColor()
                
                ScrollView{
                    VStack{
                        Filter(selected: $vm.selected)
                        
                        if vm.isLoading {
                            CustomProgressView(maxNum: 3)
                        } else {
                            HistoryCardSection(selection: vm.selected, userSport: userSport, vm: vm)
                        }
                    }
                    .padding(.bottom, 30)
                    .refreshable {
                        await vm.fetchCompReports(user_id: clerk.user?.id ?? "")
                        await vm.fetchCheckins(user_id: clerk.user?.id ?? "")
                        await vm.fetchSessionReport(user_id: clerk.user?.id ?? "")
                    }
                }
            }
            .navigationTitle("History")
            .toolbarTitleDisplayMode(.inlineLarge)
            .task {
                AnalyticsManager.shared.trackScreenView("HistoryView")
                await vm.fetchCompReports(user_id: clerk.user?.id ?? "")
                await vm.fetchCheckins(user_id: clerk.user?.id ?? "")
                await vm.fetchSessionReport(user_id: clerk.user?.id ?? "")
            }
        }
    }
}

struct HistoryCardSection: View {
    @Environment(\.colorScheme) var colorScheme
    var selection: String
    var userSport: String
    var vm: HistoryViewModel
     
    var body: some View {
        if selection == "Meets" {
            if vm.compReport.isEmpty {
                EmptyHistoryState(
                    title: "No Competitions Reported",
                    subtitle: "Complete a competition report to see your history here.",
                    icon: "trophy.fill",
                    accentColor: gold
                )
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(vm.compReport, id: \.self) { report in
                        if userSport == "Olympic Weightlifting" {
                            HistoryComponent(
                                colorScheme: colorScheme,
                                searchTerm: report.meet,
                                title: report.meet,
                                subtitle1: "\(dateFormat(report.meet_date) ?? "N/A")",
                                subtitle2: "• \(report.snatch_best ?? 0)/\(report.cj_best ?? 0)/\((report.snatch_best ?? 0) + (report.cj_best ?? 0))",
                                selection: selection,
                                date: report.meet_date,
                                reportId: report.id
                            )
                        } else {
                            HistoryComponent(
                                colorScheme: colorScheme,
                                searchTerm: report.meet,
                                title: report.meet,
                                subtitle1: "\(dateFormat(report.meet_date) ?? "N/A")",
                                subtitle2: "• \(report.squat_best ?? 0)/\(report.bench_best ?? 0)/\(report.deadlift_best ?? 0)/\((report.squat_best ?? 0) + (report.bench_best ?? 0) + (report.deadlift_best ?? 0))",
                                selection: selection,
                                date: report.meet_date,
                                reportId: report.id
                            )
                        }
                    }
                }
                .padding(.horizontal)
            }
        } else if selection == "Workouts" {
            if vm.sessionReport.isEmpty {
                EmptyHistoryState(
                    title: "No Workouts Logged",
                    subtitle: "Complete a session reflection to see your history here.",
                    icon: "figure.strengthtraining.traditional",
                    accentColor: blueEnergy
                )
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(vm.sessionReport, id: \.self) { report in
                        HistoryComponent(
                            colorScheme: colorScheme,
                            searchTerm: report.selected_lift,
                            title: "\(report.selected_intensity) \(report.selected_lift) Session",
                            subtitle1: "\(dateFormat(report.session_date) ?? "N/A")",
                            selection: selection,
                            date: report.session_date,
                            reportId: report.id,
                            scoreValue: report.session_rpe,
                            maxScore: 5
                        )
                    }
                }
                .padding(.horizontal)
            }
        } else {
            if vm.checkIns.isEmpty {
                EmptyHistoryState(
                    title: "No Check-Ins Submitted",
                    subtitle: "Complete a daily check-in to see your history here.",
                    icon: "clipboard.fill",
                    accentColor: Color(red: 90/255, green: 180/255, blue: 140/255)
                )
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(vm.checkIns, id: \.self) { report in
                        HistoryComponent(
                            colorScheme: colorScheme,
                            searchTerm: report.selected_lift,
                            title: "\(report.selected_intensity) \(report.selected_lift) Session",
                            subtitle1: "\(dateFormat(report.check_in_date) ?? "N/A")",
                            selection: selection,
                            date: report.check_in_date,
                            reportId: report.id,
                            scoreValue: report.overall_score
                        )
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

struct EmptyHistoryState: View {
    @Environment(\.colorScheme) var colorScheme
    var title: String
    var subtitle: String
    var icon: String
    var accentColor: Color
    
    var body: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [accentColor.opacity(0.2), accentColor.opacity(0.08)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 72, height: 72)
                
                Image(systemName: icon)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(accentColor)
            }
            
            VStack(spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(colorScheme == .light ? .black : .white)
                
                Text(subtitle)
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

struct HistoryComponent: View {
    var colorScheme: ColorScheme
    var searchTerm: String
    var title: String
    var subtitle1: String
    var subtitle2: String?
    var selection: String
    var date: String
    var reportId: Int?
    var scoreValue: Int?
    var maxScore: Int?
    
    private var accentColor: Color {
        switch selection {
        case "Meets":
            return gold
        case "Workouts":
            return blueEnergy
        default:
            return Color(red: 90/255, green: 180/255, blue: 140/255)
        }
    }
    
    private var scoreColor: Color {
        guard let score = scoreValue else { return accentColor }
        
        if selection == "Check-Ins" {
            if score >= 80 {
                return Color(red: 90/255, green: 180/255, blue: 140/255)
            } else if score >= 60 {
                return Color(red: 255/255, green: 180/255, blue: 80/255)
            } else {
                return Color(red: 220/255, green: 100/255, blue: 100/255)
            }
        } else if selection == "Workouts" {
            if score <= 2 {
                return Color(red: 90/255, green: 180/255, blue: 140/255)
            } else if score <= 3 {
                return Color(red: 255/255, green: 180/255, blue: 80/255)
            } else {
                return Color(red: 220/255, green: 100/255, blue: 100/255)
            }
        }
        return accentColor
    }
    
    var body: some View {
        NavigationLink(destination: HistoryDetailsView(title: title, searchTerm: searchTerm, selection: selection, date: date, reportId: reportId)) {
            HStack(spacing: 14) {
                if let score = scoreValue {
                    ZStack {
                        Circle()
                            .stroke(
                                LinearGradient(
                                    colors: [scoreColor.opacity(0.4), scoreColor.opacity(0.15)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 3
                            )
                            .frame(width: 48, height: 48)
                        
                        if let max = maxScore {
                            Text("\(score)/\(max)")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(scoreColor)
                        } else {
                            Text("\(score)")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(scoreColor)
                        }
                    }
                } else {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [accentColor.opacity(0.25), accentColor.opacity(0.1)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 48, height: 48)
                        
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(accentColor)
                    }
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(colorScheme == .light ? .black : .white)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    
                    HStack(spacing: 0) {
                        Text(subtitle1)
                        if let sub2 = subtitle2 {
                            Text(" \(sub2)")
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(colorScheme == .light ? .white : Color(white: 0.1))
                    .shadow(color: (scoreValue != nil ? scoreColor : accentColor).opacity(0.06), radius: 8, x: 0, y: 2)
                    .shadow(color: Color.black.opacity(0.04), radius: 4, x: 0, y: 1)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(
                            colors: [(scoreValue != nil ? scoreColor : accentColor).opacity(0.15), (scoreValue != nil ? scoreColor : accentColor).opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
        }
    }
}

#Preview {
    HistoryView()
}
