---
name: React Native Feature Parity Analysis
overview: Compare the React Native app with the Swift app to identify missing features and create an implementation plan for feature parity.
todos:
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

#### 5. Additional Features

**Widget Support**

- iOS WidgetKit integration
- Meet countdown widget
- Implementation needed:
  - Native module or separate widget app
  - Shared data storage (App Groups)

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

### Low Priority

11. Widget support
13. User Profile View

## Technical Dependencies Needed

### New Packages

- `expo-linking` - Already installed, needs OAuth deep linking setup
- `react-native-purchases` - Already installed, needs implementation

## Notes

- The Swift app uses MVVM architecture; React Native should follow similar separation of concerns
- Many UI components already exist and can be reused
- Focus on feature parity first, then optimize
- Consider creating shared utilities for common patterns (OAuth flows, token management)
