---
name: Swift to React Native Conversion
overview: Convert the Swift MeetJournal/Forge training journal app to React Native using Expo, preserving all UI polish, functionality, and integrations. The app tracks daily check-ins, workout sessions, competition performance, mental exercises, and provides analytics with AI insights.
todos:
  - id: setup-foundation
    content: "Setup project foundation: configure Expo, install dependencies (Clerk, Supabase, RevenueCat, PostHog), create theme system with exact Swift colors, and build reusable UI components (Card, Button, Slider, MultipleChoice)"
    status: pending
  - id: auth-flow
    content: "Implement authentication flow with Clerk: use Clerk's built-in SignIn and SignUp components, protected routes, user session management, and integration with Supabase JWT tokens"
    status: pending
  - id: home-screen
    content: "Build Home screen: meet countdown card, daily check-in section with streak display, reflection cards, recent activity list, and pull-to-refresh"
    status: pending
  - id: check-in-form
    content: "Create daily check-in form: date picker, multiple choice sections, 12 custom sliders with exact Swift styling, score calculation, form validation, and submission"
    status: pending
  - id: navigation-structure
    content: "Setup navigation: tab bar with 4 tabs (Home, Exercises, Trends, Settings), stack navigation for detail screens, and proper deep linking"
    status: pending
  - id: charts-system
    content: "Implement charts system: line graphs with trend indicators, area fills, customizable scales, chart selection UI, time frame filtering, and tap-to-detail navigation"
    status: pending
  - id: trends-screen
    content: "Build Trends screen: filter tabs, AI analysis card, chart rendering for Check-Ins/Workouts/Meets/Oura/Whoop, and chart detail modals"
    status: pending
  - id: history-views
    content: "Create History views: list screen with check-ins and sessions, detail screen with full data, search/filter functionality, and navigation"
    status: pending
  - id: mental-exercises
    content: "Implement mental exercises: box breathing with animation, visualization player, objective review form, and external anchor exercise"
    status: pending
  - id: workout-competition-forms
    content: "Build workout reflection and competition analysis forms: all input fields, validation, submission, and confirmation screens"
    status: pending
  - id: settings-screen
    content: "Create Settings screen: notification settings, connected apps (Oura/Whoop), data export, coach email, customer support, and delete data functionality"
    status: pending
  - id: oauth-integrations
    content: "Implement OAuth integrations: Oura and Whoop connection flows, token storage with SecureStore, data syncing, and connection status display"
    status: pending
  - id: notifications
    content: "Setup push notifications: permission requests, training day reminders, meet countdown notifications, and notification scheduling"
    status: pending
  - id: subscription-paywall
    content: "Implement subscription system: RevenueCat integration, paywall screen, subscription status checking, purchase flow, and restore purchases"
    status: pending
  - id: streak-calculation
    content: "Build streak calculation logic: match Swift StreakManager exactly, training days consideration, rest day handling, and visual indicators"
    status: pending
  - id: ai-analysis
    content: "Implement AI analysis: OpenRouter integration, prompt generation from user data, response display, and loading states"
    status: pending
  - id: onboarding-flow
    content: "Create onboarding flow: multi-step form collecting user profile data, training days selection, meet information, and initial setup"
    status: pending
  - id: polish-animations
    content: "Add polish: match all SwiftUI animations with Reanimated, entrance animations for cards, smooth transitions, and gesture interactions"
    status: pending
  - id: error-handling
    content: "Implement comprehensive error handling: network errors, validation errors, user-friendly error messages, retry mechanisms, and offline states"
    status: pending
  - id: testing-optimization
    content: "Testing and optimization: component testing, integration testing, performance optimization, memory leak checks, and app store preparation"
    status: pending
isProject: false
---

# Swift to React Native Conversion Plan

## Project Overview

Converting a comprehensive SwiftUI training journal app to React Native with Expo. The app serves powerlifters and weightlifters with daily check-ins, session tracking, competition analysis, mental exercises, and data visualization with AI insights.

## Architecture & Tech Stack

### Current Swift Stack

- **UI**: SwiftUI with MVVM architecture
- **Auth**: Clerk
- **Backend**: Supabase
- **Subscriptions**: RevenueCat
- **Analytics**: PostHog
- **Integrations**: Oura, Whoop
- **Charts**: Swift Charts

### React Native Stack

- **Framework**: Expo (~54.0.32) with Expo Router
- **UI Library**: React Native Reanimated, React Native Gesture Handler
- **Charts**: `react-native-chart-kit` or `victory-native` for line graphs
- **Auth**: `@clerk/clerk-expo`
- **Backend**: `@supabase/supabase-js`
- **Subscriptions**: `react-native-purchases` (RevenueCat)
- **Analytics**: PostHog React Native SDK
- **State Management**: React Context + hooks (or Zustand if needed)
- **Styling**: StyleSheet with theme system (matching Swift colors)

## File Structure

```
app/
  (auth)/
    _layout.tsx          # Auth flow wrapper with Clerk's SignIn/SignUp components
  (tabs)/
    _layout.tsx          # Tab navigation
    index.tsx            # Home tab
    exercises.tsx        # Mental exercises tab
    trends.tsx           # Trends/analytics tab
    settings.tsx         # Settings tab
  check-in/
    index.tsx            # Daily check-in form
    confirmation.tsx     # Check-in confirmation
  workout/
    index.tsx            # Session reflection form
  competition/
    index.tsx            # Competition analysis form
  history/
    index.tsx            # History list
    [id].tsx             # History detail view
  exercises/
    box-breathing/
      index.tsx          # Box breathing setup
      player.tsx         # Breathing animation
    visualization/
      index.tsx          # Visualization setup
      player.tsx         # Visualization player
    objective-review/
      index.tsx          # Objective review
      history.tsx        # Review history
    anchor/
      index.tsx          # External anchor exercise
  onboarding/
    index.tsx            # Onboarding flow
  _layout.tsx            # Root layout with splash screen

components/
  ui/
    Card.tsx             # Reusable card component
    Slider.tsx           # Custom slider (matches Swift design)
    MultipleChoice.tsx   # Horizontal pill selector
    TextField.tsx        # Styled text input
    LineGraph.tsx        # Line chart component
    Button.tsx           # Gradient button
    ProgressView.tsx     # Loading skeleton
  sections/
    DailyCheckInSection.tsx
    ReflectionSection.tsx
    HistorySection.tsx
    MeetCountdownCard.tsx
    ExerciseCard.tsx
    SettingsRow.tsx
  charts/
    LineGraphView.tsx    # Chart wrapper with trend indicators
    TrendIcon.tsx        # Trend direction indicator

models/
  CheckIn.ts             # DailyCheckIn model
  Session.ts              # SessionReport model
  Competition.ts         # CompReport model
  User.ts                 # Users model
  ObjectiveReview.ts      # ObjectiveReviewModel

services/
  supabase.ts            # Supabase client setup
  clerk.ts               # Clerk configuration
  revenuecat.ts          # RevenueCat setup
  analytics.ts            # PostHog analytics
  oura.ts                 # Oura integration
  whoop.ts                # Whoop integration
  notifications.ts        # Push notifications
  ai.ts                   # OpenRouter AI service

hooks/
  useCheckIn.ts          # Check-in logic
  useStreak.ts            # Streak calculation
  useCharts.ts            # Chart data processing
  useAuth.ts              # Auth state
  useSubscription.ts      # RevenueCat subscription

utils/
  colors.ts               # Color constants (blueEnergy, gold, etc.)
  dateFormatter.ts        # Date formatting utilities
  checkInScore.ts         # Score calculation logic
  streakManager.ts        # Streak calculation

constants/
  theme.ts                # Theme system (light/dark)
```

## Key UI Components to Recreate

### 1. Custom Slider Component

The Swift app has a sophisticated slider with:

- Circular progress indicator showing value
- Gradient-filled track
- Color-coded by value (red/yellow/green)
- Smooth drag gestures
- Min/max labels

**Implementation**: Use `react-native-gesture-handler` PanGestureHandler with `react-native-reanimated` for smooth animations. Match the exact visual design with gradients and circular indicator.

### 2. Multiple Choice Pills

Horizontal scrolling pill buttons with:

- Selected state with gradient background
- Unselected state with subtle border
- Smooth spring animations
- Horizontal ScrollView

**Implementation**: FlatList with horizontal scrolling, animated style changes on selection.

### 3. Card Components

All cards share:

- Rounded corners (20px)
- Dual shadow system (colored + black)
- Gradient border overlays
- Light/dark mode support
- Accent color theming

**Implementation**: Reusable Card component with shadow props and gradient borders using `react-native-linear-gradient` or `expo-linear-gradient`.

### 4. Line Graphs

Charts with:

- Catmull-Rom interpolation (smooth curves)
- Area fill gradients
- Trend indicators (up/down/flat arrows)
- Customizable Y-axis scales
- Tap to view detail

**Implementation**: Use `victory-native` or `react-native-chart-kit` with custom styling. May need `react-native-svg` for precise control.

### 5. Glass Morphism Header

iOS 26+ glass effect header on HomeView:

- Liquid glass effect (not just blur)
- Translucent material
- Gradient overlay

**Implementation**: Use `expo-glass-effect` package with `GlassView` component for the native iOS liquid glass effect (iOS 26+). Use `isLiquidGlassAvailable()` and `isGlassEffectAPIAvailable()` to check availability. Fallback to semi-transparent background for older iOS if glass effect is not available.

## Color System

Match exact Swift colors:

```typescript
export const colors = {
  blueEnergy: "#5386E4",
  vintageGrape: "#4C4B63",
  rosyGranite: "#949396",
  paleSlate: "#ABA8B2",
  silver: "#C3C3C3",
  gold: "#FFBF00",
  checkInOrange: "#FFA050",
  aiPurple: "#8C64C8",
  // ... etc
};
```

## Data Flow & State Management

### MVVM to React Pattern

- **ViewModels** → Custom hooks (e.g., `useHomeViewModel`)
- **@Observable** → React state + Context
- **@State** → `useState`
- **@Binding** → Props with callbacks

### Example: HomeViewModel → useHome

```typescript
// Swift: HomeViewModel.fetchUsers()
// React: useHome hook
const useHome = () => {
  const [users, setUsers] = useState<Users[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);

  const fetchUsers = async (userId: string) => {
    // Supabase query
  };

  return { users, checkIns, fetchUsers, ... };
};
```

## Critical Features to Implement

### 1. Authentication Flow

- Clerk integration with `@clerk/clerk-expo`
- Auth state management
- Protected routes
- User profile access

### 2. Subscription/Paywall

- RevenueCat integration
- Paywall screen (match RevenueCat UI or custom)
- Subscription status checking
- Purchase restoration

### 3. Daily Check-In Form

- Date picker
- Multiple choice sections (lift, intensity)
- 12 slider sections with custom styling
- Score calculation
- Form validation
- Submission to Supabase

### 4. Streak Calculation

- Complex logic matching `StreakManager.swift`
- Training days consideration
- Rest day handling
- Visual streak indicators

### 5. Charts & Analytics

- Multiple chart types (Check-Ins, Workouts, Meets, Oura, Whoop)
- Time frame filtering (30 days, 90 days, 6 months, 1 year, all time)
- Chart selection UI
- Trend calculation (7-day comparison)
- AI analysis integration

### 6. Mental Exercises

- Box breathing with animated circle
- Visualization player (audio + text)
- Objective review form
- External anchor exercise

### 7. OAuth Integrations

- Oura OAuth flow
- Whoop OAuth flow
- Token storage (SecureStore)
- Data syncing

### 8. Notifications

- Push notification setup
- Training day reminders
- Meet countdown notifications
- Permission handling

## UI/UX Considerations

### Animations

- Match SwiftUI spring animations
- Use `react-native-reanimated` for 60fps animations
- Entrance animations for cards (staggered)
- Smooth transitions between screens

### Gestures

- Swipe gestures for navigation
- Pull-to-refresh on lists
- Drag gestures for sliders
- Long press interactions

### Responsive Design

- Support iPhone and iPad sizes
- Safe area handling
- Keyboard avoidance
- Landscape orientation (if needed)

### Dark Mode

- Full dark mode support
- System theme detection
- Smooth theme transitions

## Integration Points

### Supabase

- Configure with Clerk JWT tokens
- Real-time subscriptions (if needed)
- File uploads for exports
- Row Level Security policies

### Clerk

- Use built-in `<SignIn />` and `<SignUp />` components from `@clerk/clerk-expo`
- Session management
- User metadata
- OAuth callbacks
- Token refresh handling

### RevenueCat

- Product configuration
- Purchase flow
- Subscription status
- Restore purchases

### PostHog

- Screen view tracking
- Event tracking
- User identification
- Feature flags (if used)

## Testing Strategy

1. **Component Testing**: Test UI components in isolation
2. **Integration Testing**: Test data flows (Supabase, Clerk)
3. **E2E Testing**: Critical user flows (check-in, subscription)
4. **Visual Regression**: Compare UI with Swift app screenshots

## Migration Phases

### Phase 1: Foundation

- Setup project structure
- Configure Expo, Clerk, Supabase, RevenueCat
- Create theme system and color constants
- Build reusable UI components (Card, Button, etc.)

### Phase 2: Core Features

- Authentication flow
- Home screen with meet countdown
- Daily check-in form
- Basic navigation

### Phase 3: Data & Analytics

- History views
- Trends/Charts implementation
- Streak calculation
- AI analysis integration

### Phase 4: Advanced Features

- Mental exercises
- OAuth integrations (Oura/Whoop)
- Notifications
- Settings & data export

### Phase 5: Polish

- Animations
- Performance optimization
- Error handling
- Loading states
- Edge cases

## Dependencies to Add

```json
{
  "@clerk/clerk-expo": "^latest",
  "@supabase/supabase-js": "^latest",
  "react-native-purchases": "^latest",
  "posthog-react-native": "^latest",
  "victory-native": "^latest",
  "react-native-svg": "^latest",
  "expo-linear-gradient": "^latest",
  "expo-blur": "^latest",
  "expo-glass-effect": "^latest",
  "expo-secure-store": "^latest",
  "expo-notifications": "^latest",
  "date-fns": "^latest",
  "zustand": "^latest" // Optional for complex state
}
```

## Notes

- **UI Fidelity**: The UI is as important as functionality. Every visual detail from the Swift app should be matched.
- **Performance**: Use React.memo, useMemo, useCallback appropriately. Optimize chart rendering.
- **Accessibility**: Add accessibility labels and support screen readers.
- **Error Handling**: Comprehensive error states and user feedback.
- **Offline Support**: Consider caching for offline viewing (optional enhancement).

## Success Criteria

- All screens match Swift app visually
- All functionality works identically
- Smooth 60fps animations
- Proper error handling
- Full dark mode support
- All integrations working (Clerk, Supabase, RevenueCat, Oura, Whoop)
- Charts render correctly with proper styling
- AI analysis functional
- Notifications working
- App store ready
