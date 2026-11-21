# GymTrack

A multi-gym, multi-role training app built with **React Native + Expo + TypeScript**, styled after the **native iOS UI**, powered by **Hono on Cloudflare Workers (Wrangler)** and **Neon Serverless Postgres**, and running on **iOS, Android and the Web** from one codebase.

## Roles

| Role | What they do |
| --- | --- |
| **Admin** | Manages gyms, users (role + gym membership) and the exercise library |
| **Coach** | Belongs to one gym. Assigns library exercises and routines to their members per day with a personalized prescription (sets/reps/weight, minutes/speed…). Manages the library too. |
| **Member** | Belongs to one gym. Sees their daily exercises, checks them off (time saved), tracks streak/dashboard, weight & body measurements, and progress selfies. |

## Tech Stack

| Layer | Choice |
| --- | --- |
| App | React Native (Expo) + TypeScript |
| Web | React Native Web (`pnpm web`) |
| State | Redux Toolkit (`src/store`) |
| UI | Custom iOS-style component kit (`src/ui`) |
| API | **Hono** on **Cloudflare Workers** (`api/src/index.ts`, deployed via Wrangler) |
| Database | **Neon Serverless Postgres** (`@neondatabase/serverless`, schema in `api/db/schema.sql`) |
| Auth | Edge JWT (`hono/jwt`) + WebCrypto PBKDF2-SHA256 password hashing |

## Project Structure

```
api/
├── db/
│   └── schema.sql     # Neon Postgres schema (9 tables + indexes)
├── src/
│   ├── index.ts       # Hono entrypoint & router mounting
│   ├── db/            # Neon HTTP SQL client & camelCase row mappers
│   ├── middleware/    # JWT verification & RBAC middleware (admin / coach / member)
│   ├── routes/        # Domain routers (auth, users, gyms, exercises, routines, assignments, completions, measurements, selfies, sync)
│   └── utils/         # WebCrypto password hashing & JWT helpers
src/
├── ui/                # UI component library (iOS style, zero app knowledge)
├── theme/             # iOS design tokens (colors, SF type ramp, spacing, radius)
├── components/        # App components (forms, sheets, media viewer, data sync)
├── screens/           # Role-scoped screens (Admin, Coach, Member, Shared, Auth)
├── navigation/        # Root navigator (auth ↔ member ↔ coach ↔ admin tabs)
├── store/             # Redux Toolkit store + slices
├── services/          # Typed Hono API service adapters + live polling/invalidation
├── config/api.ts      # API client, JWT storage, and sync invalidation bus
└── utils/             # Date keys, metric presets, confirm dialog, link opener
```

## Backend Setup (NeonDB + Cloudflare Wrangler)

1. Create a free Postgres database at <https://neon.tech> and run [`api/db/schema.sql`](./api/db/schema.sql) in the Neon SQL Editor.
2. Copy `.dev.vars.example` to `.dev.vars` and set your `DATABASE_URL` and `JWT_SECRET`:
   ```bash
   cp .dev.vars.example .dev.vars
   ```
3. Copy `.env.example` to `.env` so Expo points to your local or deployed Worker URL:
   ```bash
   cp .env.example .env
   ```
4. Start the Hono API locally with Wrangler:
   ```bash
   pnpm api:dev     # http://localhost:8787
   ```
5. Deploy to Cloudflare Workers free tier:
   ```bash
   npx wrangler secret put DATABASE_URL
   npx wrangler secret put JWT_SECRET
   pnpm api:deploy
   ```

## Running the App

```bash
pnpm install
pnpm api:dev     # Hono Cloudflare Worker at http://localhost:8787
pnpm web         # Expo Web at http://localhost:8081
pnpm ios         # Expo Go / iOS Simulator
pnpm android     # Android Emulator
pnpm typecheck   # Typechecks both Expo app and Hono Worker
pnpm lint        # ESLint
```
