---
name: React Native Feature Parity Analysis
overview: Compare the React Native app with the Swift app to identify missing features and create an implementation plan for feature parity.
todos:
  - id: notifications
    content: "Implement notification settings: training schedule management, permission handling, and notification scheduling"
    status: pending
  - id: connected-apps
    content: Implement Oura and Whoop OAuth integrations with token management
    status: pending
  - id: visualization
    content: "Visualization exercise implementation"
    status: pending
  - id: onboarding
    content: Create onboarding flow for new users
    status: pending
  - id: analytics
    content: Set up PostHog analytics integration throughout the app
    status: pending
  - id: revenuecat
    content: Implement RevenueCat Customer Center integration
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

**Connected Apps** (`app/settings/connected-apps.tsx`)

- Oura OAuth integration
- Whoop OAuth integration
- Connection status display
- Token storage toggle (store for reports vs. session-only)
- Disconnect functionality
- Implementation needed:
  - `services/oura.ts` - Oura OAuth flow
  - `services/whoop.ts` - Whoop OAuth flow
  - `utils/ouraTokenManager.ts` - Token refresh logic
  - `utils/whoopTokenManager.ts` - Token refresh logic
  - Deep linking setup for OAuth callbacks
  - Keychain/secure storage for tokens

**Export Data** (`app/settings/export.tsx`)

- CSV export functionality
- Include check-ins, workouts, meets data
- Include Oura/Whoop data (if stored)
- File sharing via native share sheet
- Implementation needed:
  - `utils/csvExport.ts` - CSV generation logic
  - `utils/fileSystem.ts` - File creation/writing
  - Integration with `expo-sharing` or `expo-file-system`

**Auto-Send Results** (`app/settings/auto-send.tsx`)

- Coach email input/editing
- Email validation
- Privacy notice display
- Save to user profile
- Backend integration for weekly email sending
- Implementation needed:
  - Form component with email validation
  - Supabase update for `coach_email` field
  - Backend function for weekly email sending (separate service)

**Customer Support** (`app/settings/support.tsx`)

- RevenueCat Customer Center integration
- Implementation needed:
  - `react-native-purchases` integration
  - Customer Center UI component

#### 2. Exercises Screen

All exercise implementations are missing:

**Box Breathing** (`app/exercises/box-breathing.tsx`)

- Breathing animation/visualization
- Timer functionality
- Session tracking

**Visualization** (`app/exercises/visualization.tsx`)

- Guided visualization flow
- Audio playback (optional)
- Session tracking

**Objective Review** (`app/exercises/objective-review.tsx`)

- Text input for venting
- AI reframing integration (OpenRouter API)
- Side-by-side comparison view
- Save to training cues functionality
- History view
- Implementation needed:
  - `services/openrouter.ts` - Already exists, needs integration
  - `utils/objectiveReview.ts` - Reframing logic
  - History storage in Supabase

**External Anchor** (`app/exercises/external-anchor.tsx`)

- Grounding exercise flow
- Session tracking

#### 3. Trends Screen Enhancements

**AI Trend Analysis** (`app/trends/ai.tsx`)

- Partially implemented but needs:
  - Proper data aggregation
  - OpenRouter integration completion
  - Loading states
  - Error handling
  - Insufficient data handling

**Chart Selection** (`app/trends/chart-selection.tsx`)

- Already exists but needs:
  - Persistent storage of selections
  - Better UI/UX

**Time Frame Selection**

- Already exists but needs:
  - Persistent storage
  - Better integration with data fetching

**Detailed Graph Views** (`app/trends/[id].tsx`)

- Partially implemented but needs:
  - Full graph detail view
  - Trend analysis
  - Zone indicators
  - Descriptive text generation

**Oura/Whoop Integration**

- Data fetching from connected services
- Chart generation for wearable data
- Conditional display based on connection status

#### 4. Onboarding Flow

**Onboarding Screen** (`app/onboarding.tsx`)

- User profile creation
- Training days selection
- Meet information input
- Sport selection
- Initial notification permission request
- Implementation needed:
  - Multi-step form
  - Data persistence
  - Navigation flow

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
2. Connected Apps (Oura/Whoop) - needed for trends data
3. Export Data (user data portability)
4. AI Trend Analysis completion
5. Exercise implementations (especially Objective Review)

### Medium Priority

6. Auto-Send Results
7. Onboarding flow
8. Detailed graph views
9. Chart selection persistence
10. Analytics integration

### Low Priority

11. Widget support
12. RevenueCat Customer Center
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
