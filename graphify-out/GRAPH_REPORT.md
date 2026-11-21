# Graph Report - gym-track  (2026-11-16)

## Corpus Check
- 131 files · ~72,120 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 814 nodes · 2431 edges · 23 communities (19 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4554fba4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TodayScreen.tsx
- i18n/index.ts
- useTheme
- schema.sql
- DataSync.tsx
- services/auth.ts
- types/index.ts
- slices/exercisesSlice.ts
- expo
- Realtime Database Data Model
- Firebase → Hono (Cloudflare Workers / Wrangler) + Neon Postgres Migration Plan
- Migration Status Tracker (`status_migration_plan.md`)
- dependencies
- compilerOptions
- migrate.mjs
- scripts
- eslint.config.js
- tsconfig.json
- defaultExerciseData.ts
- graphify.js
- Q: Why does useTheme() connect to 7 communities?
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 100 edges
2. `useAppSelector` - 50 edges
3. `apiRequest()` - 43 edges
4. `emitSyncInvalidate()` - 37 edges
5. `AppText()` - 36 edges
6. `isRecord()` - 25 edges
7. `Button()` - 22 edges
8. `asNumber()` - 21 edges
9. `createPoller()` - 20 edges
10. `exerciseName()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `AuthUser` --references--> `Role`  [EXTRACTED]
  api/src/types.ts → src/types/index.ts
- `IconButton()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/RoutineFormModal.tsx → src/theme/ThemeProvider.tsx
- `GymsScreen()` --indirect_call--> `selectGymsSorted()`  [INFERRED]
  src/screens/admin/GymsScreen.tsx → src/store/slices/gymsSlice.ts
- `Metric()` --calls--> `useTheme()`  [EXTRACTED]
  src/screens/member/ProgressScreen.tsx → src/theme/ThemeProvider.tsx
- `ExercisesLibraryScreen()` --indirect_call--> `selectExercisesSorted()`  [INFERRED]
  src/screens/shared/ExercisesLibraryScreen.tsx → src/store/slices/exercisesSlice.ts

## Import Cycles
- 2-file cycle: `src/theme/ThemeProvider.tsx -> src/theme/index.ts -> src/theme/ThemeProvider.tsx`

## Hyperedges (group relationships)
- **Coach-to-Member Daily Training Flow** — readme_admin_role, readme_coach_role, readme_member_role, readme_exercise_library, readme_prescription, readme_completion_tracking [EXTRACTED 0.95]
- **Firebase Backend Layer** — readme_firebase_auth, readme_realtime_database_model, readme_rtdb_live_sync, readme_database_rules, readme_firebase_config [EXTRACTED 0.95]
- **Native iOS-Style Presentation Stack** — readme_react_native_expo_platform, readme_react_native_web, readme_ios_ui_kit, readme_ios_design_tokens [INFERRED 0.85]

## Communities (23 total, 4 thin omitted)

### Community 0 - "TodayScreen.tsx"
Cohesion: 0.06
Nodes (93): AssignRoutineModal(), styles, DatePager(), ExerciseDetailSheet(), styles, AuthStack, Tab, GymsScreen() (+85 more)

### Community 1 - "i18n/index.ts"
Cohesion: 0.08
Nodes (25): App(), deviceLanguage(), getLanguageOverride(), isSupported(), LanguageCode, LANGUAGES, SECTIONS, setLanguage() (+17 more)

### Community 2 - "useTheme"
Cohesion: 0.06
Nodes (68): styles, ExerciseMediaView(), styles, ROLE_OPTIONS, styles, UserEditModal(), updateUserProfile(), selectGymsSorted() (+60 more)

### Community 3 - "schema.sql"
Cohesion: 0.33
Nodes (9): app_meta, assignments, completions, exercises, gyms, measurements, routines, selfies (+1 more)

### Community 4 - "DataSync.tsx"
Cohesion: 0.06
Nodes (78): AssignExerciseModal(), styles, DataSync(), ExerciseFormModal(), styles, TYPE_OPTIONS, GymFormModal(), styles (+70 more)

### Community 5 - "services/auth.ts"
Cohesion: 0.09
Nodes (37): ApiError, getAuthToken(), isFirebaseConfigured, setAuthToken(), AuthStackParamList, RootNavigator(), LoginScreen(), LoginScreenProps (+29 more)

### Community 6 - "types/index.ts"
Cohesion: 0.07
Nodes (81): generateId(), getSql(), SqlClient, mapAssignmentRow(), mapAssignmentsToByDate(), mapCompletionsToByDate(), mapCompletionsToByUser(), mapExerciseRow() (+73 more)

### Community 7 - "slices/exercisesSlice.ts"
Cohesion: 0.07
Nodes (53): exercisesSlice, ExercisesState, initialState, normalizeExercises(), normalizeFields(), VALID_TYPES, AppDispatch, RootState (+45 more)

### Community 8 - "expo"
Cohesion: 0.07
Nodes (28): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, projectId, expo (+20 more)

### Community 9 - "Realtime Database Data Model"
Cohesion: 0.14
Nodes (25): Admin Role, Day-and-Member Assignment Workflow (Coach Plan Screen), Weight and Body Measurement Tracking (Progress), Coach Role, Private Coach Routines, Completion Tracking with Timestamps, database.rules.json (Realtime Database Security Rules), Exercise Library (+17 more)

### Community 10 - "Firebase → Hono (Cloudflare Workers / Wrangler) + Neon Postgres Migration Plan"
Cohesion: 0.09
Nodes (22): 1. Executive Summary & Target Architecture, 2. Blast Radius Analysis (From Knowledge Graph), 3. Postgres Schema Design (NeonDB), 4. Parallel Execution Strategy for Agents & Subagents, 5. Detailed Tasks & Subtasks Breakdown, Firebase → Hono (Cloudflare Workers / Wrangler) + Neon Postgres Migration Plan, Task `T10` (Agent C3) — Routines, Assignments & Completions Client Services, Task `T11` (Agent C4) — Measurements, Selfies & UI/DataSync Wiring (+14 more)

### Community 11 - "Migration Status Tracker (`status_migration_plan.md`)"
Cohesion: 0.10
Nodes (20): Agent Activity Log, Migration Status Tracker (`status_migration_plan.md`), Overall Progress Summary, Status Legend, `T10` (Agent Track `C3`) — Routines, Assignments & Completions Client Services, `T11` (Agent Track `C4`) — Measurements, Selfies & UI/DataSync Wiring, `T12` — Firebase Removal, Env/Docs Update & End-to-End Verification, `T1` — Workspace, Cloudflare Wrangler & Hono Scaffold (+12 more)

### Community 12 - "dependencies"
Cohesion: 0.04
Nodes (49): expo, expo-image-manipulator, expo-image-picker, expo-localization, @expo/metro-runtime, expo-status-bar, expo-updates, @expo/vector-icons (+41 more)

### Community 13 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, esModuleInterop, isolatedModules, lib, module, moduleResolution, noEmit, resolveJsonModule (+10 more)

### Community 15 - "scripts"
Cohesion: 0.06
Nodes (34): @cloudflare/workers-types, eslint, eslint-config-expo, husky, devDependencies, @cloudflare/workers-types, eslint, eslint-config-expo (+26 more)

### Community 21 - "tsconfig.json"
Cohesion: 0.22
Nodes (8): api, dist, expo/tsconfig.base, node_modules, compilerOptions, strict, exclude, extends

### Community 22 - "defaultExerciseData.ts"
Cohesion: 0.27
Nodes (10): DEFAULT_EXERCISES, DefaultExercise, exerciseDescription(), findDefaultByName(), Lang, LANGS, matchesDefault(), normalize() (+2 more)

### Community 25 - "graphify.js"
Cohesion: 0.47
Nodes (5): hasGraph(), location, IMPORTANT: keep the reminder string free of backticks and $(...) constructs., server(), setup()

### Community 26 - "Q: Why does useTheme() connect to 7 communities?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why does useTheme() connect to 7 communities?, Source Nodes

## Knowledge Gaps
- **234 isolated node(s):** `location`, `exercises`, `assignments`, `app_meta`, `SqlClient` (+229 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `useTheme` to `TodayScreen.tsx`, `DataSync.tsx`, `services/auth.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `expo-localization` connect `expo` to `i18n/index.ts`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `location`, `exercises`, `assignments` to the rest of the system?**
  _234 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TodayScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05868653935724266 - nodes in this community are weakly interconnected._
- **Should `i18n/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._
- **Should `useTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.05605670103092784 - nodes in this community are weakly interconnected._
- **Should `DataSync.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05891016200294551 - nodes in this community are weakly interconnected._