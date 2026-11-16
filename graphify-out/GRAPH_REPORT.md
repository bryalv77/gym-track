# Graph Report - gym-track  (2026-11-16)

## Corpus Check
- Corpus is ~41,098 words - fits in a single context window. You may not need a graph.

## Summary
- 629 nodes · 2325 edges · 34 communities (22 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Gym Admin Management Screens
- User Editing & Internationalization
- Theme Tokens & UI Kit
- Coach Plan & Progress Screens
- Firebase Data Sync Layer
- App Shell & Navigation
- Routine Assignment Services
- Data Normalization & Slices
- Expo App Configuration
- Product Concepts (README)
- Exercise Catalog & CRUD
- Redux Store Wiring
- Runtime Dependencies
- Gym Onboarding & Codes
- Package Manifest & Tooling
- Build & Deploy Scripts
- Coach Exercise Slice
- Completions Slice
- ESLint Configuration
- Gyms Slice
- Routines Slice
- TypeScript Configuration
- Dep: Expo Image Manipulator
- Dep: Expo Image Picker
- Dep: Expo Localization
- Dep: Expo Metro Runtime
- Dep: Expo Status Bar
- Dep: Expo Updates
- Dep: Expo Vector Icons
- Dep: i18next
- Dep: React Native Screens
- Dep: React Native Web
- Dep: Bottom Tabs Navigator
- Dep: React Redux

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 100 edges
2. `AppText()` - 73 edges
3. `react-native` - 52 edges
4. `react` - 50 edges
5. `useAppSelector` - 50 edges
6. `Button()` - 42 edges
7. `react-i18next` - 29 edges
8. `ProfileScreen()` - 29 edges
9. `TodayScreen()` - 28 edges
10. `NavBar()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `RootNavigator()`  [EXTRACTED]
  App.tsx → src/navigation/RootNavigator.tsx
- `App()` --calls--> `ThemeProvider()`  [EXTRACTED]
  App.tsx → src/theme/ThemeProvider.tsx
- `GymsScreen()` --indirect_call--> `selectGymsSorted()`  [INFERRED]
  src/screens/admin/GymsScreen.tsx → src/store/slices/gymsSlice.ts
- `RoutinesScreen()` --indirect_call--> `selectRoutinesSorted()`  [INFERRED]
  src/screens/coach/RoutinesScreen.tsx → src/store/slices/routinesSlice.ts
- `ProgressScreen()` --indirect_call--> `selectSelfiesSorted()`  [INFERRED]
  src/screens/member/ProgressScreen.tsx → src/store/slices/selfiesSlice.ts

## Import Cycles
- 2-file cycle: `src/theme/ThemeProvider.tsx -> src/theme/index.ts -> src/theme/ThemeProvider.tsx`

## Hyperedges (group relationships)
- **Coach-to-Member Daily Training Flow** — readme_admin_role, readme_coach_role, readme_member_role, readme_exercise_library, readme_prescription, readme_completion_tracking [EXTRACTED 0.95]
- **Firebase Backend Layer** — readme_firebase_auth, readme_realtime_database_model, readme_rtdb_live_sync, readme_database_rules, readme_firebase_config [EXTRACTED 0.95]
- **Native iOS-Style Presentation Stack** — readme_react_native_expo_platform, readme_react_native_web, readme_ios_ui_kit, readme_ios_design_tokens [INFERRED 0.85]

## Communities (34 total, 12 thin omitted)

### Community 0 - "Gym Admin Management Screens"
Cohesion: 0.11
Nodes (68): ExerciseDetailSheet(), styles, GymsScreen(), styles, FILTERS, RoleFilter, styles, UserRow() (+60 more)

### Community 1 - "User Editing & Internationalization"
Cohesion: 0.06
Nodes (54): ROLE_OPTIONS, styles, UserEditModal(), firebaseAuth, deviceLanguage(), getLanguageOverride(), isSupported(), LanguageCode (+46 more)

### Community 2 - "Theme Tokens & UI Kit"
Cohesion: 0.08
Nodes (45): react, react-native, react-native-safe-area-context, darkColors, lightColors, radius, spacing, ThemeColors (+37 more)

### Community 3 - "Coach Plan & Progress Screens"
Cohesion: 0.09
Nodes (45): react-i18next, AssignRoutineModal(), styles, DatePager(), styles, MeasurementFormModal(), NUMERIC, styles (+37 more)

### Community 4 - "Firebase Data Sync Layer"
Cohesion: 0.08
Nodes (28): firebase, DataSync(), authApi, db, firebaseConfig, subscribeToAssignments(), subscribeToAllCompletions(), subscribeToCompletions() (+20 more)

### Community 5 - "App Shell & Navigation"
Cohesion: 0.11
Nodes (21): App(), ExerciseMediaView(), styles, isFirebaseConfigured, AdminTabs(), AuthNavigator(), AuthStack, AuthStackParamList (+13 more)

### Community 6 - "Routine Assignment Services"
Cohesion: 0.15
Nodes (24): AssignExerciseModal(), styles, defaultMetrics(), DraftItem, IconButton(), RoutineFormModal(), styles, createAssignment() (+16 more)

### Community 7 - "Data Normalization & Slices"
Cohesion: 0.18
Nodes (26): normalizeExercises(), normalizeFields(), normalizeAssignments(), normalizeMetrics(), normalizeExercises(), normalizeFields(), normalizeMeasurements(), initialState (+18 more)

### Community 8 - "Expo App Configuration"
Cohesion: 0.07
Nodes (27): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, projectId, expo (+19 more)

### Community 9 - "Product Concepts (README)"
Cohesion: 0.14
Nodes (25): Admin Role, Day-and-Member Assignment Workflow (Coach Plan Screen), Weight and Body Measurement Tracking (Progress), Coach Role, Private Coach Routines, Completion Tracking with Timestamps, database.rules.json (Realtime Database Security Rules), Exercise Library (+17 more)

### Community 10 - "Exercise Catalog & CRUD"
Cohesion: 0.19
Nodes (18): ExerciseFormModal(), styles, TYPE_OPTIONS, createExercise(), deleteExercise(), updateExercise(), exercisesReducer, exercisesSlice (+10 more)

### Community 11 - "Redux Store Wiring"
Cohesion: 0.16
Nodes (14): @reduxjs/toolkit, AppDispatch, RootState, assignmentsReducer, assignmentsSlice, AssignmentsState, initialState, authReducer (+6 more)

### Community 12 - "Runtime Dependencies"
Cohesion: 0.12
Nodes (17): dependencies, expo@~57.0.24, firebase@^12.19.0, react@19.2.3, react-dom@19.2.3, react-i18next@^17.0.16, react-native@0.86.3, @react-native-async-storage/async-storage@2.2.0 (+9 more)

### Community 13 - "Gym Onboarding & Codes"
Cohesion: 0.25
Nodes (11): GymFormModal(), styles, SignUpScreenProps, styles, createGym(), regenerateGymCode(), renameGym(), subscribeToGymCode() (+3 more)

### Community 14 - "Package Manifest & Tooling"
Cohesion: 0.19
Nodes (12): devDependencies, husky@^9.1.7, @types/react@~19.2.2, typescript@~6.0.3, main, name, packageManager, private (+4 more)

### Community 15 - "Build & Deploy Scripts"
Cohesion: 0.18
Nodes (11): scripts, android, build:web, deploy:mobile, deploy:web, ios, lint, prepare (+3 more)

### Community 16 - "Coach Exercise Slice"
Cohesion: 0.20
Nodes (7): exercisesReducer, exercisesSlice, ExercisesState, initialState, VALID_TYPES, ExercisesState, ExercisesById

### Community 17 - "Completions Slice"
Cohesion: 0.24
Nodes (8): completionsReducer, completionsSlice, CompletionsState, initialState, normalizeAllCompletions(), normalizeUserDays(), CompletionsByDate, CompletionsByUser

### Community 18 - "ESLint Configuration"
Cohesion: 0.29
Nodes (6): { defineConfig }, expoConfig, eslint@^9.0.0, eslint-config-expo@~57.0.2, eslint, eslint-config-expo

### Community 19 - "Gyms Slice"
Cohesion: 0.33
Nodes (6): gymsReducer, gymsSlice, GymsState, initialState, normalizeGyms(), GymsById

### Community 20 - "Routines Slice"
Cohesion: 0.33
Nodes (5): initialState, routinesReducer, routinesSlice, RoutinesState, RoutinesById

### Community 21 - "TypeScript Configuration"
Cohesion: 0.40
Nodes (4): expo/tsconfig.base, compilerOptions, strict, extends

## Knowledge Gaps
- **2 isolated node(s):** `expo/tsconfig.base`, `React Native Web Target (pnpm web)`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 153 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Theme Tokens & UI Kit` to `Gym Admin Management Screens`, `User Editing & Internationalization`, `Coach Plan & Progress Screens`, `Firebase Data Sync Layer`, `App Shell & Navigation`, `Routine Assignment Services`, `Exercise Catalog & CRUD`, `Runtime Dependencies`, `Gym Onboarding & Codes`, `Package Manifest & Tooling`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `React Native Web Target (pnpm web)` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Gym Admin Management Screens` be split into smaller, more focused modules?**
  _Cohesion score 0.11288711288711288 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Theme Tokens & UI Kit` to `Gym Admin Management Screens`, `User Editing & Internationalization`, `Coach Plan & Progress Screens`, `Firebase Data Sync Layer`, `App Shell & Navigation`, `Routine Assignment Services`, `Exercise Catalog & CRUD`, `Runtime Dependencies`, `Gym Onboarding & Codes`, `Package Manifest & Tooling`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Should `User Editing & Internationalization` be split into smaller, more focused modules?**
  _Cohesion score 0.055533199195171024 - nodes in this community are weakly interconnected._
- **Why does `useTheme()` connect `Gym Admin Management Screens` to `User Editing & Internationalization`, `Theme Tokens & UI Kit`, `Coach Plan & Progress Screens`, `App Shell & Navigation`, `Routine Assignment Services`, `Exercise Catalog & CRUD`, `Gym Onboarding & Codes`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `Theme Tokens & UI Kit` be split into smaller, more focused modules?**
  _Cohesion score 0.08364389233954451 - nodes in this community are weakly interconnected._