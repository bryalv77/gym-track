# Graph Report - gym-track  (2026-11-23)

## Corpus Check
- 116 files · ~50,104 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 782 nodes · 2776 edges · 36 communities (26 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- useTheme() cluster
- types/index.ts cluster
- TodayScreen.tsx cluster
- ui/index.ts cluster
- DataSync.tsx cluster
- RootNavigator.tsx cluster
- i18n/index.ts cluster
- store/index.ts cluster
- expo cluster
- dependencies cluster
- package.json cluster
- compilerOptions cluster
- scripts cluster
- GymTrack cluster
- photo.ts cluster
- 2026-11-16T23-33-51Z__src.md cluster
- migrate.mjs cluster
- eslint.config.js cluster
- tsconfig.json cluster
- Q: Why does useTheme() connect to 7 comm cluster
- Splash icon image (light gray grid with  cluster
- Android adaptive icon background (light  cluster
- Android adaptive icon foreground (blue g cluster
- Android monochrome adaptive icon (gray c cluster
- Favicon (blue chevron/caret-up icon on w cluster
- App icon: blue 3D glossy chevron (caret/ cluster
- Personas: Casey, Alex, Jordan, Sam cluster
- node-crypto.d.ts cluster
- expo-localization cluster
- expo-status-bar cluster
- @expo/vector-icons cluster
- react-dom@19.2.3 cluster
- @react-navigation/native cluster
- P1: Dead-end member directory and chip c cluster
- P1: Silent mutation failures and invisib cluster
- Render-phase setState anti-pattern in se cluster

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 101 edges
2. `AppText()` - 76 edges
3. `react` - 53 edges
4. `react-native` - 52 edges
5. `Button()` - 40 edges
6. `react-i18next` - 31 edges
7. `mutate()` - 31 edges
8. `NavBar()` - 28 edges
9. `radius` - 26 edges
10. `SheetModal()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Questions to Consider` --references--> `selectGymMembers()`  [INFERRED]
  .impeccable/critique/2026-11-16T23-33-51Z__src.md → src/store/slices/membersSlice.ts
- `What's Working` --references--> `useTheme()`  [INFERRED]
  .impeccable/critique/2026-11-16T23-33-51Z__src.md → src/theme/ThemeProvider.tsx
- `Priority Issues` --references--> `RoutineFormModal()`  [INFERRED]
  .impeccable/critique/2026-11-16T23-33-51Z__src.md → src/components/RoutineFormModal.tsx
- `Priority Issues` --references--> `MemberRow()`  [INFERRED]
  .impeccable/critique/2026-11-16T23-33-51Z__src.md → src/screens/coach/MembersScreen.tsx
- `Priority Issues` --references--> `TodayScreen()`  [INFERRED]
  .impeccable/critique/2026-11-16T23-33-51Z__src.md → src/screens/member/TodayScreen.tsx

## Import Cycles
- 2-file cycle: `src/theme/ThemeProvider.tsx -> src/theme/index.ts -> src/theme/ThemeProvider.tsx`

## Hyperedges (group relationships)
- **Impeccable critique priority issues** — impeccable_critique_2026_11_16t23_33_51z_src_p0_workout_checklist, impeccable_critique_2026_11_16t23_33_51z_src_p1_stepper, impeccable_critique_2026_11_16t23_33_51z_src_p1_members_dead_end, impeccable_critique_2026_11_16t23_33_51z_src_p1_silent_failures, impeccable_critique_2026_11_16t23_33_51z_src_p2_accessibility [EXTRACTED 0.95]

## Communities (36 total, 10 thin omitted)

### Community 0 - "useTheme() cluster"
Cohesion: 0.09
Nodes (86): AssignExerciseModal(), styles, TYPE_FILTERS, TypeFilter, AssignRoutineModal(), styles, ExerciseDetailSheet(), defaultMetrics() (+78 more)

### Community 1 - "types/index.ts cluster"
Cohesion: 0.07
Nodes (77): generateId(), getSql(), SqlClient, cleanRoutineItems(), indexBy(), mapAssignmentRow(), mapAssignmentsToByDate(), mapCompletionsToByDate() (+69 more)

### Community 2 - "TodayScreen.tsx cluster"
Cohesion: 0.06
Nodes (75): Priority Issues, react-i18next, DatePager(), styles, styles, MeasurementFormModal(), NUMERIC, styles (+67 more)

### Community 3 - "ui/index.ts cluster"
Cohesion: 0.06
Nodes (59): react, react-native, react-native-safe-area-context, ExerciseMediaView(), styles, darkColors, disabledOpacity, lightColors (+51 more)

### Community 4 - "DataSync.tsx cluster"
Cohesion: 0.07
Nodes (44): ExerciseFormModal(), styles, TYPE_OPTIONS, GymFormModal(), styles, SelfieFormModal(), styles, mutate() (+36 more)

### Community 5 - "RootNavigator.tsx cluster"
Cohesion: 0.06
Nodes (47): App(), @react-navigation/native-stack, API_BASE_URL, ApiError, apiRequest(), ChannelListener, channelListeners, createPoller() (+39 more)

### Community 6 - "i18n/index.ts cluster"
Cohesion: 0.07
Nodes (31): hasVideo(), seedExercises(), deviceLanguage(), getLanguageOverride(), isSupported(), LanguageCode, LANGUAGES, SECTIONS (+23 more)

### Community 7 - "store/index.ts cluster"
Cohesion: 0.08
Nodes (29): @reduxjs/toolkit@^2.12.0, @reduxjs/toolkit, AppDispatch, RootState, store, assignmentsReducer, assignmentsSlice, AssignmentsState (+21 more)

### Community 8 - "expo cluster"
Cohesion: 0.07
Nodes (27): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, projectId, expo (+19 more)

### Community 9 - "dependencies cluster"
Cohesion: 0.08
Nodes (25): dependencies, expo@~57.0.24, @expo/metro-runtime@~57.0.16, expo-updates@~57.0.25, hono@^4.13.19, i18next@^26.4.2, react@19.2.3, react-i18next@^17.0.16 (+17 more)

### Community 10 - "package.json cluster"
Cohesion: 0.15
Nodes (16): devDependencies, @cloudflare/workers-types@^5.20261116.1, husky@^9.1.7, @types/react@~19.2.2, typescript@~6.0.3, wrangler@^4.163.0, main, name (+8 more)

### Community 11 - "compilerOptions cluster"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, isolatedModules, lib, module, moduleResolution, noEmit, resolveJsonModule (+5 more)

### Community 12 - "scripts cluster"
Cohesion: 0.14
Nodes (14): scripts, android, api:deploy, api:dev, build:web, db:migrate, deploy:mobile, deploy:web (+6 more)

### Community 13 - "GymTrack cluster"
Cohesion: 0.17
Nodes (11): Runtime import cycle theme/index.ts and ThemeProvider.tsx, useTheme() hook (degree 100 chokepoint), Query: Why does useTheme() connect to 7 communities?, What's Working (theme tokens, routine snapshot, calorie context), Backend Setup (Neon + Wrangler), Backend Setup (NeonDB + Cloudflare Wrangler), GymTrack, Project Structure (+3 more)

### Community 14 - "photo.ts cluster"
Cohesion: 0.29
Nodes (10): expo-image-manipulator@~57.0.19, expo-image-picker@~57.0.19, expo-image-manipulator, expo-image-picker, assetToDataUrl(), pickAvatarDataUrl(), pickSelfieDataUrl(), toDataUrl() (+2 more)

### Community 15 - "2026-11-16T23-33-51Z__src.md cluster"
Cohesion: 0.20
Nodes (9): Design Health Score, Design Specificity Verdict, Minor Observations, Overall Impression, P0: Workout execution is binary checklist under selfie card, Persona Red Flags, Questions to Consider, iOS Settings app wearing a barbell icon verdict (+1 more)

### Community 16 - "migrate.mjs cluster"
Cohesion: 0.33
Nodes (4): loadDatabaseUrl(), main(), @neondatabase/serverless@^1.2.1, @neondatabase/serverless

### Community 17 - "eslint.config.js cluster"
Cohesion: 0.29
Nodes (6): { defineConfig }, expoConfig, eslint@^9.0.0, eslint-config-expo@~57.0.2, eslint, eslint-config-expo

### Community 18 - "tsconfig.json cluster"
Cohesion: 0.33
Nodes (5): expo/tsconfig.base, compilerOptions, strict, exclude, extends

### Community 19 - "Q: Why does useTheme() connect to 7 comm cluster"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why does useTheme() connect to 7 communities?, Source Nodes

### Community 20 - "Splash icon image (light gray grid with  cluster"
Cohesion: 0.50
Nodes (4): Concentric circles motif (target/radar), Square grid background pattern, Splash icon image (light gray grid with three concentric circles on white), App splash screen placeholder

### Community 21 - "Android adaptive icon background (light  cluster"
Cohesion: 0.67
Nodes (3): Android adaptive icon background layer, Concentric circles, dashed triangle and crosshair guide lines, Android adaptive icon background (light blue with construction guide lines)

### Community 23 - "Android monochrome adaptive icon (gray c cluster"
Cohesion: 0.67
Nodes (3): Rounded upward chevron glyph, Android monochrome adaptive icon (gray chevron/caret glyph on white), Android themed (monochrome) app icon

### Community 24 - "Favicon (blue chevron/caret-up icon on w cluster"
Cohesion: 0.67
Nodes (3): App branding / browser tab icon, Blue upward chevron logo mark, Favicon (blue chevron/caret-up icon on white rounded square)

### Community 25 - "App icon: blue 3D glossy chevron (caret/ cluster"
Cohesion: 0.67
Nodes (3): Blueprint construction guides (concentric circles, dashed diagonals, baseline), gym-track app branding (blue gradient chevron mark), App icon: blue 3D glossy chevron (caret/A shape) on light blue background

### Community 26 - "Personas: Casey, Alex, Jordan, Sam cluster"
Cohesion: 0.67
Nodes (3): P1: Stepper-only weight programming and modal backdrop dismissal, P2: Accessibility gaps and low-contrast tertiary text, Personas: Casey, Alex, Jordan, Sam

## Knowledge Gaps
- **22 isolated node(s):** `expo/tsconfig.base`, `iOS Settings app wearing a barbell icon verdict`, `P1: Stepper-only weight programming and modal backdrop dismissal`, `P1: Dead-end member directory and chip clouds`, `P1: Silent mutation failures and invisible hydration` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `ui/index.ts cluster` to `useTheme() cluster`, `TodayScreen.tsx cluster`, `DataSync.tsx cluster`, `RootNavigator.tsx cluster`, `dependencies cluster`, `package.json cluster`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `iOS Settings app wearing a barbell icon verdict`, `P1: Stepper-only weight programming and modal backdrop dismissal` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useTheme() cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.09175824175824175 - nodes in this community are weakly interconnected._
- **Why does `useTheme()` connect `useTheme() cluster` to `TodayScreen.tsx cluster`, `ui/index.ts cluster`, `DataSync.tsx cluster`, `RootNavigator.tsx cluster`, `2026-11-16T23-33-51Z__src.md cluster`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `types/index.ts cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.06973684210526315 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `ui/index.ts cluster` to `useTheme() cluster`, `TodayScreen.tsx cluster`, `DataSync.tsx cluster`, `RootNavigator.tsx cluster`, `dependencies cluster`, `package.json cluster`, `photo.ts cluster`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Should `TodayScreen.tsx cluster` be split into smaller, more focused modules?**
  _Cohesion score 0.05942571785268414 - nodes in this community are weakly interconnected._