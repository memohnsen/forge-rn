//
//  NotificationSettingsView.swift
//  MeetJournal
//
//  Created by Maddisen Mohnsen on 12/30/25.
//

import SwiftUI
import Clerk

struct NotificationSettingsView: View {
    @Environment(\.clerk) private var clerk
    @Environment(\.colorScheme) var colorScheme
    @State private var vm = ViewModel()
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 12) {
                            Toggle(isOn: Binding(
                                get: { vm.notificationManager.isEnabled },
                                set: { newValue in
                                    Task {
                                        if newValue {
                                            let granted = await vm.notificationManager.requestPermission()
                                            if granted {
                                                vm.notificationManager.scheduleNotifications()
                                            }
                                        } else {
                                            vm.notificationManager.isEnabled = false
                                            vm.notificationManager.cancelAll()
                                        }
                                    }
                                }
                            )) {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle()
                                            .fill(
                                                LinearGradient(
                                                    colors: [
                                                        (vm.notificationManager.isEnabled ? Color.orange : Color.gray).opacity(0.25),
                                                        (vm.notificationManager.isEnabled ? Color.orange : Color.gray).opacity(0.1)
                                                    ],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                            .frame(width: 40, height: 40)
                                        
                                        Image(systemName: "bell.fill")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundStyle(vm.notificationManager.isEnabled ? .orange : .secondary)
                                    }
                                    
                                    Text("Enable Notifications")
                                        .font(.subheadline.weight(.semibold))
                                }
                            }
                            .tint(blueEnergy)
                            
                            Text("Receive reminders for daily check-ins, session reflections, and competition analysis")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .cardStyling()
                        
                        if vm.notificationManager.isEnabled {
                            VStack(alignment: .leading, spacing: 16) {
                                HStack {
                                    Text("Training Schedule")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(colorScheme == .light ? .black : .white)
                                    Spacer()
                                    Button {
                                        vm.showEditTrainingDays = true
                                    } label: {
                                        Text("Edit")
                                            .font(.subheadline.weight(.medium))
                                            .foregroundStyle(blueEnergy)
                                    }
                                }
                                
                                if vm.trainingDays.isEmpty {
                                    Text("No training days set")
                                        .foregroundStyle(.tertiary)
                                        .font(.subheadline)
                                } else {
                                    let sortedDays = vm.trainingDays.keys.sorted { day1, day2 in
                                        let weekdayOrder = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                                        let index1 = weekdayOrder.firstIndex(of: day1) ?? 999
                                        let index2 = weekdayOrder.firstIndex(of: day2) ?? 999
                                        return index1 < index2
                                    }
                                    
                                    ForEach(sortedDays, id: \.self) { day in
                                        TrainingDayCard(
                                            day: day,
                                            trainingTime: vm.trainingDays[day] ?? "",
                                            sessionTime: vm.calculateSessionTime(from: vm.trainingDays[day] ?? ""),
                                            colorScheme: colorScheme
                                        )
                                    }
                                }
                            }
                            .cardStyling()
                            
                            if let meetDate = UserDefaults.standard.string(forKey: "meetDate"),
                               let meetName = UserDefaults.standard.string(forKey: "meetName") {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Competition Reminder")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(colorScheme == .light ? .black : .white)
                                    
                                    HStack(spacing: 14) {
                                        ZStack {
                                            Circle()
                                                .fill(
                                                    LinearGradient(
                                                        colors: [gold.opacity(0.25), gold.opacity(0.1)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                                .frame(width: 44, height: 44)
                                            
                                            Image(systemName: "trophy.fill")
                                                .font(.system(size: 18, weight: .semibold))
                                                .foregroundStyle(gold)
                                        }
                                        
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(meetName)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundStyle(colorScheme == .light ? .black : .white)
                                            Text("Notification at 5:00 PM on \(vm.formatMeetDate(meetDate))")
                                                .font(.caption)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                    }
                                    .padding(14)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14)
                                            .fill(
                                                LinearGradient(
                                                    colors: [gold.opacity(0.08), gold.opacity(0.03)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                )
                                            )
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(gold.opacity(0.15), lineWidth: 1)
                                    )
                                }
                                .cardStyling()
                            }
                        }
                    }
                    .padding(.top)
                    .padding(.bottom, 30)
                }
            }
            .navigationTitle("Notifications")
            .toolbarTitleDisplayMode(.inlineLarge)
            .toolbarVisibility(.hidden, for: .tabBar)
            .task {
                AnalyticsManager.shared.trackNotificationSettingsViewed()
                vm.loadTrainingDays()
            }
            .sheet(isPresented: $vm.showEditTrainingDays) {
                EditTrainingScheduleView(
                    trainingDays: $vm.trainingDays,
                    onSave: { newTrainingDays in
                        Task {
                            await vm.saveTrainingDays(newTrainingDays, userId: clerk.user?.id ?? "")
                        }
                        vm.showEditTrainingDays = false
                    }
                )
            }
        }
    }
}

struct TrainingDayCard: View {
    var day: String
    var trainingTime: String
    var sessionTime: String
    var colorScheme: ColorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(day)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(colorScheme == .light ? .black : .white)
            
            HStack(spacing: 16) {
                NotificationTimeRow(icon: "sun.max.fill", iconColor: .orange, label: "Check-in", time: trainingTime)
                
                NotificationTimeRow(icon: "figure.strengthtraining.traditional", iconColor: blueEnergy, label: "Reflection", time: sessionTime)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(colorScheme == .light ? Color.black.opacity(0.02) : Color.white.opacity(0.03))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(
                    colorScheme == .light ? Color.black.opacity(0.04) : Color.white.opacity(0.06),
                    lineWidth: 1
                )
        )
    }
}

struct NotificationTimeRow: View {
    var icon: String
    var iconColor: Color
    var label: String
    var time: String
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(iconColor)
                .frame(width: 16)
            
            Text("\(label) \(time)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct EditTrainingScheduleView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.colorScheme) var colorScheme
    @Binding var trainingDays: [String: String]
    let onSave: ([String: String]) -> Void
    
    @State private var editableTrainingDays: [String: String] = [:]
    @State private var showingTimePicker: String? = nil
    
    let daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    let timeOptions = [
        "4:00 AM", "5:00 AM", "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"
    ]
    
    func isDaySelected(_ day: String) -> Bool {
        return editableTrainingDays[day] != nil
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                BackgroundColor()
                
                ScrollView {
                    VStack(spacing: 16) {
                        Text("When do you train?")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                            .padding(.bottom, 4)
                        
                        ForEach(daysOfWeek, id: \.self) { day in
                            HStack(spacing: 12) {
                                Button {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        if isDaySelected(day) {
                                            editableTrainingDays.removeValue(forKey: day)
                                            showingTimePicker = nil
                                        } else {
                                            editableTrainingDays[day] = timeOptions[0]
                                        }
                                    }
                                } label: {
                                    Text(day)
                                        .font(.subheadline.weight(.semibold))
                                        .frame(width: 110)
                                        .padding(.vertical, 12)
                                        .foregroundStyle(isDaySelected(day) ? .white : blueEnergy)
                                        .background(
                                            Capsule()
                                                .fill(
                                                    isDaySelected(day)
                                                    ? LinearGradient(
                                                        colors: [blueEnergy, blueEnergy.opacity(0.85)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                    : LinearGradient(
                                                        colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.08)],
                                                        startPoint: .topLeading,
                                                        endPoint: .bottomTrailing
                                                    )
                                                )
                                        )
                                        .overlay(
                                            Capsule()
                                                .stroke(
                                                    isDaySelected(day) ? Color.clear : blueEnergy.opacity(0.3),
                                                    lineWidth: 1
                                                )
                                        )
                                }
                                .buttonStyle(.plain)
                                
                                if isDaySelected(day) {
                                    Button {
                                        showingTimePicker = day
                                    } label: {
                                        Text(editableTrainingDays[day] ?? timeOptions[0])
                                            .font(.subheadline.weight(.medium))
                                            .padding(.vertical, 12)
                                            .frame(maxWidth: .infinity)
                                            .foregroundStyle(blueEnergy)
                                            .background(
                                                Capsule()
                                                    .fill(
                                                        LinearGradient(
                                                            colors: [blueEnergy.opacity(0.12), blueEnergy.opacity(0.08)],
                                                            startPoint: .topLeading,
                                                            endPoint: .bottomTrailing
                                                        )
                                                    )
                                            )
                                            .overlay(
                                                Capsule()
                                                    .stroke(blueEnergy.opacity(0.3), lineWidth: 1)
                                            )
                                    }
                                    .buttonStyle(.plain)
                                    .sheet(isPresented: Binding(
                                        get: { showingTimePicker == day },
                                        set: { if !$0 { showingTimePicker = nil } }
                                    )) {
                                        TimePickerSheet(
                                            day: day,
                                            selectedTime: Binding(
                                                get: { editableTrainingDays[day] ?? timeOptions[0] },
                                                set: { editableTrainingDays[day] = $0 }
                                            ),
                                            timeOptions: timeOptions,
                                            onDone: { showingTimePicker = nil }
                                        )
                                    }
                                } else {
                                    Text("Select time")
                                        .font(.subheadline)
                                        .padding(.vertical, 12)
                                        .frame(maxWidth: .infinity)
                                        .foregroundStyle(.tertiary)
                                        .background(
                                            Capsule()
                                                .fill(Color.gray.opacity(0.1))
                                        )
                                }
                            }
                        }
                    }
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
                }
            }
            .navigationTitle("Edit Training Days")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", role: .cancel) {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if #available(iOS 26.0, *) {
                        Button("Save", role: .confirm) {
                            onSave(editableTrainingDays)
                            dismiss()
                        }
                    } else {
                        Button("Save") {
                            onSave(editableTrainingDays)
                            dismiss()
                        }
                    }
                }
            }
        }
        .onAppear {
            editableTrainingDays = trainingDays
        }
    }
}

struct TimePickerSheet: View {
    var day: String
    @Binding var selectedTime: String
    var timeOptions: [String]
    var onDone: () -> Void
    
    var body: some View {
        VStack(spacing: 0) {
            Text("Select Time")
                .font(.headline.weight(.semibold))
                .padding(.top, 20)
                .padding(.bottom, 8)
            
            Picker("Time", selection: $selectedTime) {
                ForEach(timeOptions, id: \.self) { time in
                    Text(time).tag(time)
                }
            }
            .pickerStyle(.wheel)
            .padding(.horizontal)
            
            Button {
                onDone()
            } label: {
                Text("Done")
                    .font(.headline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(
                        LinearGradient(
                            colors: [blueEnergy, blueEnergy.opacity(0.85)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding()
        }
        .presentationDetents([.height(350)])
    }
}

#Preview {
    NotificationSettingsView()
}
