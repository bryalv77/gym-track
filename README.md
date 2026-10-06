# GymTrack

A multi-gym, multi-role training app built with **React Native + Expo + TypeScript**, styled after the **native iOS UI**, powered by **Firebase (Email/Password Auth + Realtime Database)**, and running on **iOS, Android and the Web** from one codebase.

## Roles

| Role | What they do |
| --- | --- |
| **Admin** | Manages gyms, users (role + gym membership) and the exercise library |
| **Coach** | Belongs to one gym. Assigns library exercises to their members per day with a personalized prescription (sets/reps/weight, minutes/speed…). Manages the library too. |
| **Member** | Belongs to one gym. Sees their daily exercises, checks them off (time saved), tracks streak/dashboard and weight & body measurements. |

The exercise library holds each exercise with **demo media** (inline image/GIF + link to a demo video) and **type-driven metrics**:
- Strength → sets, reps, weight
- Cardio → time, speed
- Other → custom metric fields you define per exercise

## Tech

| Layer | Choice |
| --- | --- |
| App | React Native (Expo) + TypeScript |
| Web | React Native Web (`pnpm web`) |
| State | Redux Toolkit (`src/store`) |
| UI | Custom iOS-style component kit (`src/ui`) |
| Backend | Firebase Auth + Firebase Realtime Database |

## Project structure

```
src/
├── ui/            # UI component library (iOS style, zero app knowledge)
├── theme/         # iOS design tokens (colors, SF type ramp, spacing, radius)
├── components/    # App components (forms, sheets, media viewer, data sync)
├── screens/
│   ├── LoginScreen / SignUpScreen (with gym picker)
│   ├── member/    # Today (checkbox + exercise detail), Dashboard, Progress
│   ├── coach/     # Plan (assign per member), Members
│   ├── admin/     # Gyms, Users
│   └── shared/    # ExercisesLibraryScreen (coach + admin)
├── navigation/    # Root navigator (auth ↔ member ↔ coach ↔ admin tabs)
├── store/         # Redux Toolkit store + slices (auth, assignments, exercises,
│                  #   gyms, completions, measurements, members)
├── services/      # Firebase read/write helpers
├── config/        # Firebase init + coach signup code
└── utils/         # Date keys, metric presets, confirm dialog, link opener
```

## Data model (Realtime Database)

```
gyms/{gymId}                          → { name, createdAt }
users/{uid}                           → { uid, name, email, role: 'admin'|'coach'|'member', gymId?, createdAt }
exercises/{exerciseId}                → { name, type: 'strength'|'cardio'|'other', description?,
                                          imageUrl?, videoUrl?, metricFields[], createdBy, createdAt }
assignments/{YYYY-MM-DD}/{id}         → { exerciseId, memberId, coachId, metrics: {sets…}, notes?, createdAt }
completions/{uid}/{YYYY-MM-DD}/{id}   → { completedAt }
measurements/{uid}/{entryId}          → { dateKey, weightKg?, chestCm?, waistCm?, armCm?, thighCm?, createdAt }
```

## Firebase setup

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Build → Realtime Database → Create database** (the app uses RTDB, not Firestore).
4. **Rules** → paste [`database.rules.json`](./database.rules.json) → **Publish**.
5. Paste your web app config into **`src/config/firebase.ts`**.

### Roles bootstrap

- Members and coaches sign up themselves: everyone picks their **gym** at sign-up; coaches also enter the coach code (`GYM-COACH` by default, change it in `src/config/firebase.ts`).
- The **first admin** is created by setting `role: "admin"` on the user's node in `users/` from the Firebase console (or seed it like we did). Admins can then change any user's role/gym from the Users tab.

## Running the app

```bash
pnpm install
pnpm web         # http://localhost:8081
pnpm ios         # Expo Go / simulator
pnpm android
pnpm typecheck   # tsc --noEmit
pnpm build:web   # static site in dist/
```

## How it works

1. **Admin** creates gyms and curates the exercise library (media + metric fields per type).
2. **Coach** opens Plan, picks a day and a member, chooses an exercise from the library and sets the prescription (steppers per metric). Edits and unassigns anytime.
3. **Member** sees the workout instantly (RTDB listeners): checks exercises off — each check stores the timestamp — and can open each exercise for the demo media and coach notes. Dashboard computes streak, weekly volume and 30-day history; Progress tracks weight & measures.
4. Everything syncs live across all devices signed in to the same gym.
