# Migration Status Tracker (`status_migration_plan.md`)

> **Stack Target**: Firebase Auth & RTDB → **Hono on Cloudflare Workers (Wrangler)** + **Neon Serverless Postgres (`@neondatabase/serverless`)**
> **Reference Plan**: [migration_plan.md](file:///Users/bryanalvarado/Documents/Devalv/gym-track/migration_plan.md)
> **Last Updated**: 2026-11-16 18:22

---

## Overall Progress Summary

| Wave | Name | Parallel Agents | Total Subtasks | Completed | In Progress | Blocked | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Wave 1** | Foundation, Neon Schema & Contracts | 1 (Main Coordinator) | 9 | 9 | 0 | 0 | ✅ Completed |
| **Wave 2** | Backend Hono Routers | 4 (`B1`–`B4`) | 10 | 10 | 0 | 0 | ✅ Completed |
| **Wave 3** | Client Core & Service Adapters | 4 (`C1`–`C4`) | 11 | 11 | 0 | 0 | ✅ Completed |
| **Wave 4** | Cutover, Cleanup & Verification | 1 (Main Coordinator) | 3 | 3 | 0 | 0 | ✅ Completed |
| **TOTAL** | **All Migration Waves** | **8 Parallel Subagents** | **33** | **33** | **0** | **0** | **100% ✅** |

---

## Status Legend

- `[ ]` **Pending** (`⏳`) — Ready to be picked up once dependencies are met
- `[~]` **In Progress** (`🔄`) — Assigned to an active agent/subagent
- `[x]` **Completed** (`✅`) — Implemented and verified
- `[!]` **Blocked** (`🚫`) — Waiting on dependency or user input

---

## Wave 1: Foundation, Database Schema & Shared Contracts (✅ Completed)

### `T1` — Workspace, Cloudflare Wrangler & Hono Scaffold
- **Assigned Agent**: `Main Coordinator`
- **Dependencies**: None
- **Owned Files**: `package.json`, `wrangler.toml`, `api/tsconfig.json`, `tsconfig.json`, `api/src/types.ts`
- **Subtasks**:
  - [x] **`T1.1`** — Installed `hono`, `@neondatabase/serverless`, `wrangler`, `@cloudflare/workers-types` and added `api:dev`, `api:deploy`, and `typecheck` scripts to `package.json`
  - [x] **`T1.2`** — Created `wrangler.toml` (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`) and `api/tsconfig.json`
  - [x] **`T1.3`** — Created `api/src/types.ts` (Hono `Bindings` & `Variables`)

### `T2` — Neon Postgres Schema, SQL Migrations & DB Helper
- **Assigned Agent**: `Main Coordinator`
- **Dependencies**: `T1`
- **Owned Files**: `api/db/schema.sql`, `api/src/db/client.ts`, `api/src/db/mappers.ts`
- **Subtasks**:
  - [x] **`T2.1`** — Wrote `api/db/schema.sql` with all 9 tables (`gyms`, `users`, `exercises`, `routines`, `assignments`, `completions`, `measurements`, `selfies`, `app_meta`) + indexes
  - [x] **`T2.2`** — Implemented `api/src/db/client.ts` using `@neondatabase/serverless` (`getSql` HTTP client + `generateId`)
  - [x] **`T2.3`** — Implemented `api/src/db/mappers.ts` mapping Postgres rows to camelCase `src/types/index.ts` interfaces & RTDB-shaped maps

### `T3` — Edge Auth (JWT + WebCrypto Password Hashing) & RBAC Middleware
- **Assigned Agent**: `Main Coordinator`
- **Dependencies**: `T1`, `T2`
- **Owned Files**: `api/src/utils/crypto.ts`, `api/src/middleware/auth.ts`, `src/types/api.ts`
- **Subtasks**:
  - [x] **`T3.1`** — Implemented `api/src/utils/crypto.ts` (WebCrypto PBKDF2-SHA256 password hashing + `hono/jwt` sign/verify)
  - [x] **`T3.2`** — Implemented `api/src/middleware/auth.ts` (`requireAuth`, `requireRole`, `requireSelfOrRole`) mirroring `database.rules.json`
  - [x] **`T3.3`** — Created `src/types/api.ts` shared REST endpoint & error-code contract for parallel Wave 2 & Wave 3 agents

---

## Wave 2: Backend Hono Domain Routers (✅ Completed — 4 Parallel Subagents)

### `T4` (Agent Track `B1`) — Auth, Users & Gyms Routes
- **Assigned Agent**: `Subagent B1` (`dfea2ecd-8759-467f-bb95-b327b524623f`)
- **Dependencies**: `T3`
- **Owned Files**: `api/src/routes/auth.ts`, `api/src/routes/users.ts`, `api/src/routes/gyms.ts`
- **Subtasks**:
  - [x] **`T4.1`** — Implemented `api/src/routes/auth.ts` (`POST /api/auth/register` with coach code validation, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`)
  - [x] **`T4.2`** — Implemented `api/src/routes/users.ts` (`GET /api/users`, `GET /api/users/:uid`, `PATCH /api/users/:uid` with admin vs self field rules)
  - [x] **`T4.3`** — Implemented `api/src/routes/gyms.ts` (`GET /api/gyms`, `POST /api/gyms`, `PATCH /api/gyms/:id`, `DELETE /api/gyms/:id`, `GET /api/gyms/:id/code`, `POST /api/gyms/:id/code/regenerate`)

### `T5` (Agent Track `B2`) — Exercises, Seed Meta & Routines Routes
- **Assigned Agent**: `Subagent B2` (`1eb51ad2-60fc-4f65-b5c1-8974b480ad64`)
- **Dependencies**: `T3`
- **Owned Files**: `api/src/routes/exercises.ts`, `api/src/routes/routines.ts`
- **Subtasks**:
  - [x] **`T5.1`** — Implemented `api/src/routes/exercises.ts` (`GET /api/exercises`, `POST /api/exercises`, `PATCH /api/exercises/:id`, `DELETE /api/exercises/:id`, `POST /api/exercises/seed`)
  - [x] **`T5.2`** — Implemented `api/src/routes/routines.ts` (`GET /api/routines/:coachId`, `POST /api/routines/:coachId`, `PUT /api/routines/:coachId/:routineId`, `DELETE /api/routines/:coachId/:routineId`, `POST .../assign`, `POST .../unassign`)

### `T6` (Agent Track `B3`) — Assignments & Completions Routes
- **Assigned Agent**: `Subagent B3` (`425f8105-6da4-4af1-a2be-5e57e0458e75`)
- **Dependencies**: `T3`
- **Owned Files**: `api/src/routes/assignments.ts`, `api/src/routes/completions.ts`
- **Subtasks**:
  - [x] **`T6.1`** — Implemented `api/src/routes/assignments.ts` (`GET /api/assignments`, `POST /api/assignments`, `PATCH /api/assignments/:dateKey/:assignmentId`, `DELETE /api/assignments/:dateKey/:assignmentId`)
  - [x] **`T6.2`** — Implemented `api/src/routes/completions.ts` (`GET /api/completions`, `GET /api/completions/:uid`, `PUT /api/completions/:uid/:dateKey/:taskId`)

### `T7` (Agent Track `B4`) — Measurements, Selfies & Batch Sync Route
- **Assigned Agent**: `Subagent B4` (`4baf6bca-72da-4c5a-8625-b4ff319f4dab`)
- **Dependencies**: `T3`
- **Owned Files**: `api/src/routes/measurements.ts`, `api/src/routes/selfies.ts`, `api/src/routes/sync.ts`, `api/src/index.ts`
- **Subtasks**:
  - [x] **`T7.1`** — Implemented `api/src/routes/measurements.ts` (`GET /api/measurements/:uid`, `POST /api/measurements/:uid`, `PUT /api/measurements/:uid/:id`, `DELETE /api/measurements/:uid/:id`)
  - [x] **`T7.2`** — Implemented `api/src/routes/selfies.ts` (`GET /api/selfies/:uid`, `POST /api/selfies/:uid`, `PUT /api/selfies/:uid/:id`, `DELETE /api/selfies/:uid/:id`)
  - [x] **`T7.3`** — Implemented `api/src/routes/sync.ts` (`GET /api/sync` role-aware batch snapshot endpoint) and wired all 10 routers in `api/src/index.ts`

---

## Wave 3: Frontend API Client, Sync Engine & Service Adapters (✅ Completed — 4 Parallel Subagents)

### `T8` (Agent Track `C1`) — Client API Core, Polling/Revalidation Bus & Auth Service
- **Assigned Agent**: `Subagent C1` (`1a622ed6-8c87-4dd7-b04d-63d8184bcb76`)
- **Dependencies**: `T3`
- **Owned Files**: `src/config/api.ts`, `src/services/auth.ts`
- **Subtasks**:
  - [x] **`T8.1`** — Created `src/config/api.ts` (fetch wrapper, JWT `AsyncStorage` persistence, `isApiConfigured`, `createPoller` & `emitSyncInvalidate` bus)
  - [x] **`T8.2`** — Migrated `src/services/auth.ts` to Hono `/api/auth/*` & `/api/users/*` while keeping all exported function signatures identical

### `T9` (Agent Track `C2`) — Users, Gyms, Exercises & Seed Client Services
- **Assigned Agent**: `Subagent C2` (`3883669f-17b2-48c7-be88-511623833e3a`)
- **Dependencies**: `T8.1`
- **Owned Files**: `src/services/users.ts`, `src/services/gyms.ts`, `src/services/exercises.ts`, `src/utils/defaultExercises.ts`
- **Subtasks**:
  - [x] **`T9.1`** — Migrated `src/services/users.ts` (`subscribeToUsers`, `subscribeToUser`) to Hono API + polling/revalidation
  - [x] **`T9.2`** — Migrated `src/services/gyms.ts` (`subscribeToGyms`, `createGym`, `subscribeToGymCode`, `regenerateGymCode`, `renameGym`, `deleteGym`) to Hono API
  - [x] **`T9.3`** — Migrated `src/services/exercises.ts` and `src/utils/defaultExercises.ts` to Hono API

### `T10` (Agent Track `C3`) — Routines, Assignments & Completions Client Services
- **Assigned Agent**: `Subagent C3` (`cab57e70-5f8a-47c1-b800-969023bc84ac`)
- **Dependencies**: `T8.1`
- **Owned Files**: `src/services/routines.ts`, `src/services/assignments.ts`, `src/services/completions.ts`
- **Subtasks**:
  - [x] **`T10.1`** — Migrated `src/services/routines.ts` (`subscribeToRoutines`, `saveRoutine`, `deleteRoutine`, `assignRoutine`, `unassignRoutine`) to Hono API
  - [x] **`T10.2`** — Migrated `src/services/assignments.ts` (`subscribeToAssignments`, `createAssignment`, `updateAssignment`, `deleteAssignment`) to Hono API
  - [x] **`T10.3`** — Migrated `src/services/completions.ts` (`subscribeToCompletions`, `subscribeToAllCompletions`, `setCompletion`) to Hono API

### `T11` (Agent Track `C4`) — Measurements, Selfies & UI/DataSync Wiring
- **Assigned Agent**: `Subagent C4` (`ea107aa1-eb9c-4ff7-a1b5-82f1d647167f`)
- **Dependencies**: `T8.1`
- **Owned Files**: `src/services/measurements.ts`, `src/services/selfies.ts`, `src/components/DataSync.tsx`, `src/screens/shared/ProfileScreen.tsx`, `src/screens/LoginScreen.tsx`, `src/navigation/RootNavigator.tsx`
- **Subtasks**:
  - [x] **`T11.1`** — Migrated `src/services/measurements.ts` & `src/services/selfies.ts` to Hono API
  - [x] **`T11.2`** — Updated `src/components/DataSync.tsx` to use the new API sync/subscription layer
  - [x] **`T11.3`** — Updated `src/screens/shared/ProfileScreen.tsx`, `src/screens/LoginScreen.tsx`, and `src/navigation/RootNavigator.tsx` to remove direct `src/config/firebase.ts` imports

---

## Wave 4: Cutover, Cleanup & Verification (✅ Completed)

### `T12` — Firebase Removal, Env/Docs Update & End-to-End Verification
- **Assigned Agent**: `Main Coordinator`
- **Dependencies**: `T4`–`T11`
- **Owned Files**: `package.json`, `.env.example`, `.dev.vars.example`, `README.md`, `src/config/firebase.ts` (deleted), `database.rules.json` (deleted)
- **Subtasks**:
  - [x] **`T12.1`** — Removed `firebase` dependency, deleted `src/config/firebase.ts` and `database.rules.json`, created `.dev.vars.example`, and updated `.env.example` and `README.md`
  - [x] **`T12.2`** — Passed `pnpm typecheck` (`tsc --noEmit && tsc -p api/tsconfig.json --noEmit`) and `pnpm lint` with **0 errors**
  - [x] **`T12.3`** — Ran `graphify update .` (`800 nodes, 2412 edges, 32 communities`) to keep the knowledge graph current

---

## Agent Activity Log

| Timestamp | Agent / Subagent | Task ID | Action / Notes |
| :--- | :--- | :--- | :--- |
| 2026-11-16 18:03 | Main Coordinator | `PLAN` | Created `migration_plan.md` and `status_migration_plan.md` with 4 waves, 12 tasks, and 33 parallelizable subtasks. |
| 2026-11-16 18:10 | Main Coordinator | `T1`–`T3`, `T8.1` | Completed Wave 1 (`wrangler.toml`, `api/tsconfig.json`, `api/db/schema.sql`, `api/src/db/client.ts`, `api/src/db/mappers.ts`, `api/src/utils/crypto.ts`, `api/src/middleware/auth.ts`, `src/types/api.ts`) + `src/config/api.ts` (`T8.1`). |
| 2026-11-16 18:11 | Main Coordinator | `T4`–`T11` | Dispatched 8 parallel subagents (`B1`–`B4` and `C1`–`C4`) across Wave 2 and Wave 3. |
| 2026-11-16 18:14 | Subagent C3 | `T10` | Migrated `src/services/routines.ts`, `src/services/assignments.ts`, and `src/services/completions.ts`. |
| 2026-11-16 18:15 | Subagent B4 | `T7` | Created `api/src/routes/measurements.ts`, `api/src/routes/selfies.ts`, `api/src/routes/sync.ts`, and `api/src/index.ts`. |
| 2026-11-16 18:15 | Subagent C2 | `T9` | Migrated `src/services/users.ts`, `src/services/gyms.ts`, `src/services/exercises.ts`, and `src/utils/defaultExercises.ts`. |
| 2026-11-16 18:15 | Subagent B1 | `T4` | Created `api/src/routes/auth.ts`, `api/src/routes/users.ts`, and `api/src/routes/gyms.ts`. |
| 2026-11-16 18:15 | Subagent B3 | `T6` | Created `api/src/routes/assignments.ts` and `api/src/routes/completions.ts`. |
| 2026-11-16 18:15 | Subagent C4 | `T11` | Migrated `src/services/measurements.ts`, `src/services/selfies.ts`, `src/components/DataSync.tsx`, `ProfileScreen.tsx`, `LoginScreen.tsx`, and `RootNavigator.tsx`. |
| 2026-11-16 18:16 | Subagent C1 | `T8.2` | Migrated `src/services/auth.ts` to Hono `/api/auth/*` and `/api/users/*`. |
| 2026-11-16 18:17 | Subagent B2 | `T5` | Created `api/src/routes/exercises.ts` (including `/seed`) and `api/src/routes/routines.ts`. |
| 2026-11-16 18:22 | Main Coordinator | `T12` | Removed Firebase files/package, verified `pnpm typecheck` and `pnpm lint` (0 errors), and ran `graphify update .`. |
