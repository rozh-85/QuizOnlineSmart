# EduPulse Mobile (React Native / Expo)

Student mobile app for the EduPulse learning platform. Built with React Native + Expo, connects to the **same Supabase database** as the web app.

## Features

- **Student Login** — Serial ID + PIN authentication with device fingerprint locking
- **Dashboard** — Hero banner, stats (lectures, questions, sections), lecture grid
- **QR Attendance** — Camera-based QR scanning for attendance tracking
- **What's New** — News feed with lectures, materials, questions, announcements
- **Chat / Q&A** — Real-time messaging with teachers per lecture
- **Profile** — Attendance history with stats (rate, present count, hours), filters
- **Lecture Detail** — Overview, materials (PDF/Word/Note), quiz questions, Q&A chat
- **Animated Splash Screen** — Branded splash with logo animation and pulse dots
- **Real-time Updates** — Supabase Realtime subscriptions for live data

## Tech Stack

- **Expo SDK** with TypeScript
- **React Navigation** (Bottom Tabs + Native Stack)
- **Supabase JS** (auth, database, real-time, storage)
- **expo-camera** for QR scanning
- **expo-secure-store** for secure token/session persistence
- **@expo/vector-icons** (Ionicons)

## Getting Started

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Use the **same** Supabase project as the web app.

### 3. Run the app

```bash
npx expo start
```

- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR with **Expo Go** app on your phone

## Project Structure

```
mobile/
├── App.tsx                    # Root — providers, auth flow, splash
├── app.json                   # Expo config
├── .env.example               # Environment template
├── src/
│   ├── api/                   # Supabase API modules (mirrors web)
│   │   ├── authApi.ts
│   │   ├── attendanceApi.ts
│   │   ├── lectureApi.ts
│   │   ├── lectureQAApi.ts
│   │   ├── materialApi.ts
│   │   ├── questionApi.ts
│   │   └── whatsNewApi.ts
│   ├── constants/
│   │   └── app.ts             # Colors, durations, constants
│   ├── context/
│   │   ├── AuthContext.tsx     # Auth state + session management
│   │   └── DataContext.tsx     # Lectures, questions, materials + realtime
│   ├── lib/
│   │   └── supabase.ts        # Supabase client (SecureStore adapter)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Tab nav + stack nav + unread badges
│   ├── screens/
│   │   ├── SplashScreen.tsx   # Animated branded splash
│   │   ├── LoginScreen.tsx    # Serial ID + PIN login
│   │   ├── DashboardScreen.tsx
│   │   ├── NewsScreen.tsx
│   │   ├── QRScanScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── LectureDetailScreen.tsx
│   ├── services/
│   │   └── realtimeService.ts # Supabase Realtime subscriptions
│   ├── types/
│   │   ├── app.ts             # camelCase frontend types
│   │   └── database.ts        # snake_case DB types
│   └── utils/
│       ├── adapters.ts        # snake_case ↔ camelCase mappers
│       ├── device.ts          # Device fingerprint generation
│       ├── format.ts          # Date/time formatting
│       └── serial.ts          # Serial ID utilities
```

## Shared with Web App

The mobile app shares the **same Supabase database and schema**. The API layer (`src/api/`) mirrors the web app's API modules with identical Supabase queries. Types (`src/types/`) are copied from the web app to keep both in sync.

## Building for Production

```bash
# Build for Android
npx expo build:android

# Build for iOS
npx expo build:ios

# Or use EAS Build
npx eas build --platform android
npx eas build --platform ios
```
