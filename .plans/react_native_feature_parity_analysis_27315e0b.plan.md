---
name: React Native Feature Parity Analysis
overview: Compare the React Native app with the Swift app to identify missing features and create an implementation plan for feature parity.
todos:
  - id: notifications
    content: "Implement notification settings: training schedule management, permission handling, and notification scheduling"
    status: pending
  - id: analytics
    content: Set up PostHog analytics integration throughout the app
    status: pending
  - id: revenuecat
    content: Implement RevenueCat pay wall to end of onboarding
    status: pending
isProject: false
---

# React Native vs Swift App Feature Comparison

## Overview

The Swift app is the reference implementation with full feature set. The React Native app has basic structure but is missing several key features.

## Feature Comparison Matrix

### ✅ Implemented in Both Apps

- Home screen with meet countdown, daily check-in section, reflection section, history section
- Daily Check-In form (complete)
- Session Reflection form (complete)
- Competition Reflection form (complete)
- Basic Trends screen with filters
- Basic Settings screen structure
- History viewing

### ❌ Missing in React Native App

#### 1. Settings Features

**Notification Settings** (`app/settings/notifications.tsx`)

- Training schedule management (select days of week + times)
- Enable/disable notifications toggle
- Check-in reminders (scheduled based on training days)
- Session reflection reminders (scheduled after training time)
- Competition reminders (scheduled before meet date)
- Notification permission handling
- Implementation needed:
  - `utils/notificationManager.ts` - Notification scheduling logic
  - `hooks/use-notifications.ts` - Notification state management
  - Training days storage/retrieval from Supabase
  - Integration with `expo-notifications`

#### 5. Additional Features

**Widget Support**

- iOS WidgetKit integration
- Meet countdown widget
- Implementation needed:
  - Native module or separate widget app
  - Shared data storage (App Groups)

**Analytics Integration**

- PostHog integration
- Event tracking throughout app
- Implementation needed:
  - `posthog-react-native` setup
  - `utils/analytics.ts` - Analytics wrapper
  - Event tracking in key user actions

**RevenueCat Integration**

- Subscription management
- Entitlement checking
- Customer Center
- Implementation needed:
  - `react-native-purchases` setup
  - Entitlement checking utilities
  - Paywall UI (if needed)

**User Profile View**

- Profile editing
- User avatar display
- Implementation needed:
  - Profile screen
  - Avatar upload (if needed)

## Implementation Priority

### High Priority

1. Notification Settings (core functionality)

### Medium Priority

10. Analytics integration

### Low Priority

11. Widget support
13. User Profile View

## Technical Dependencies Needed

### New Packages

- `expo-notifications` - Already installed, needs implementation
- `expo-sharing` or `expo-file-system` - For CSV export
- `expo-linking` - Already installed, needs OAuth deep linking setup
- `react-native-purchases` - Already installed, needs implementation
- `posthog-react-native` - Already installed, needs implementation

### Backend Requirements

- Supabase Edge Functions for:
  - Oura token exchange
  - Whoop token exchange
  - Weekly email sending
  - Oura/Whoop webhook handlers

### Environment Variables Needed

- `EXPO_PUBLIC_OURA_CLIENT_ID`
- `EXPO_PUBLIC_WHOOP_CLIENT_ID`
- `EXPO_PUBLIC_POSTHOG_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY`

## File Structure to Create

```
app/
  settings/
    notifications.tsx
    connected-apps.tsx
    export.tsx
    auto-send.tsx
    support.tsx
  exercises/
    box-breathing.tsx
    visualization.tsx
    objective-review.tsx
    external-anchor.tsx
  onboarding.tsx

utils/
  notificationManager.ts
  csvExport.ts
  objectiveReview.ts
  analytics.ts

services/
  oura.ts
  whoop.ts

hooks/
  use-notifications.ts
```

## Notes

- The Swift app uses MVVM architecture; React Native should follow similar separation of concerns
- Many UI components already exist and can be reused
- Focus on feature parity first, then optimize
- Consider creating shared utilities for common patterns (OAuth flows, token management)
