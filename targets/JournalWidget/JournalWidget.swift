//
//  JournalWidget.swift
//  JournalWidget
//
//  Created by Maddisen Mohnsen on 12/27/25.
//

import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    let kind: String = "JournalWidget"

    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(
            date: Date(),
            meetName: "State Championships",
            meetDate: "2025-03-15",
            daysUntilMeet: 45,
            sessionsLeft: 18
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let sharedDefaults = UserDefaults(suiteName: "group.com.memohnsen.forge.JournalWidget")
        let meetDate = sharedDefaults?.string(forKey: "meetDate") ?? ""
        let trainingDaysPerWeek = sharedDefaults?.integer(forKey: "trainingDaysPerWeek") ?? 0
        let daysUntilMeet = calculateDaysUntilMeet(meetDate)
        let sessionsLeft = calculateSessionsLeft(daysUntilMeet: daysUntilMeet, trainingDaysPerWeek: trainingDaysPerWeek)
        let entry = SimpleEntry(
            date: Date(),
            meetName: sharedDefaults?.string(forKey: "meetName") ?? "No Meet Coming Up",
            meetDate: meetDate,
            daysUntilMeet: daysUntilMeet,
            sessionsLeft: sessionsLeft
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let sharedDefaults = UserDefaults(suiteName: "group.com.memohnsen.forge.JournalWidget")
        let meetDate = sharedDefaults?.string(forKey: "meetDate") ?? ""
        let trainingDaysPerWeek = sharedDefaults?.integer(forKey: "trainingDaysPerWeek") ?? 0
        let daysUntilMeet = calculateDaysUntilMeet(meetDate)
        let sessionsLeft = calculateSessionsLeft(daysUntilMeet: daysUntilMeet, trainingDaysPerWeek: trainingDaysPerWeek)
        let entry = SimpleEntry(
            date: Date(),
            meetName: sharedDefaults?.string(forKey: "meetName") ?? "No Meet Coming Up",
            meetDate: meetDate,
            daysUntilMeet: daysUntilMeet,
            sessionsLeft: sessionsLeft
        )
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date().addingTimeInterval(3600)
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let meetName: String
    let meetDate: String
    let daysUntilMeet: Int
    let sessionsLeft: Int
}

func dateFormat(_ dateString: String) -> String? {
    let inputFormatter = DateFormatter()
    inputFormatter.dateFormat = "yyyy-MM-dd"
    guard let date = inputFormatter.date(from: dateString) else { return nil }
    
    let outputFormatter = DateFormatter()
    outputFormatter.dateFormat = "MMM d, yyyy"
    return outputFormatter.string(from: date)
}

func parseMeetDate(_ dateString: String) -> Date? {
    if dateString.isEmpty { return nil }
    let inputFormatter = DateFormatter()
    inputFormatter.dateFormat = "yyyy-MM-dd"
    if let date = inputFormatter.date(from: dateString) {
        return date
    }
    return DateFormatter().date(from: dateString)
}

func calculateRawDaysUntilMeet(_ dateString: String) -> Int? {
    guard let date = parseMeetDate(dateString) else { return nil }
    let calendar = Calendar.current
    let startOfToday = calendar.startOfDay(for: Date())
    let startOfMeet = calendar.startOfDay(for: date)
    return calendar.dateComponents([.day], from: startOfToday, to: startOfMeet).day
}

func calculateDaysUntilMeet(_ dateString: String) -> Int {
    let rawDays = calculateRawDaysUntilMeet(dateString) ?? 0
    return max(0, rawDays)
}

func isMeetCompleted(_ dateString: String) -> Bool {
    guard let rawDays = calculateRawDaysUntilMeet(dateString) else { return false }
    return rawDays < 0
}

func calculateSessionsLeft(daysUntilMeet: Int, trainingDaysPerWeek: Int) -> Int {
    if daysUntilMeet <= 0 || trainingDaysPerWeek <= 0 { return 0 }
    let weeksRemaining = Double(daysUntilMeet) / 7.0
    return Int(ceil(weeksRemaining * Double(trainingDaysPerWeek)))
}

func daysUntilMeetText(_ days: Int, dateString: String) -> String {
    if isMeetCompleted(dateString) {
        return "Completed"
    } else if days == 0 {
        return "Today!"
    } else {
        return "\(days)"
    }
}

struct SmallMeetWidget: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .center) {
            Text("\(entry.sessionsLeft)")
                .font(.system(size: 56))
                .bold()
                .foregroundStyle(isMeetCompleted(entry.meetDate) ? .green : .blue)
            Text("Sessions Remaining")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .font(.subheadline)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct MediumMeetWidget: View {
    var entry: Provider.Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .font(.title)
                    .foregroundStyle(.orange)
                
                VStack(alignment: .leading) {
                    Text("Upcoming Meet")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text(entry.meetName)
                        .font(.headline.bold())
                        .lineLimit(1)
                    
                    if let formattedDate = dateFormat(entry.meetDate) {
                        Text(formattedDate)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                
                Spacer()
            }
            .padding(.top)
            

            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Days Left")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text(daysUntilMeetText(entry.daysUntilMeet, dateString: entry.meetDate))
                        .font(.title2.bold())
                        .foregroundStyle(isMeetCompleted(entry.meetDate) ? .green : .blue)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Sessions")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    
                    Text("\(entry.sessionsLeft)")
                        .font(.title2.bold())
                        .foregroundStyle(.purple)
                }
            }
            .padding(.bottom)
        }
        .padding()
    }
}

struct JournalWidget: Widget {
    let kind: String = "JournalWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MeetWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Forge")
        .description("Track your upcoming competition and training sessions")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct MeetWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium:
            MediumMeetWidget(entry: entry)
        default:
            SmallMeetWidget(entry: entry)
        }
    }
}

#Preview(as: .systemSmall) {
    JournalWidget()
} timeline: {
    SimpleEntry(date: .now, meetName: "State Championships", meetDate: "2025-03-15", daysUntilMeet: 45, sessionsLeft: 18)
}

#Preview(as: .systemMedium) {
    JournalWidget()
} timeline: {
    SimpleEntry(date: .now, meetName: "State Championships", meetDate: "2025-03-15", daysUntilMeet: 45, sessionsLeft: 18)
}
