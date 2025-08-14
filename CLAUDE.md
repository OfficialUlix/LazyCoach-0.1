# CLAUDE.md — LazyCoach Rules

• Stay on Expo SDK 52; install native deps via npx expo install.
• Keep react-native-reanimated Babel plugin LAST.
• TS strict; no any; extend expo/tsconfig.base.
• Do NOT touch .env or identifiers.
• Prefer small composable UI; NO heavy calendar libs (use AvailabilityPicker).
• Every screen must handle loading/empty/error; use Loading & ErrorBoundary.
• EAS profiles: ios-dev-sim + android-dev-apk; cli.appVersionSource="remote".
