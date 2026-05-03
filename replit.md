# IZEN — The Ultimate IQ Experience

## Overview

A premium, futuristic IQ test platform with dark glassmorphism UI, real-time scoring, a global leaderboard, and personal intelligence dashboards.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite + Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Build**: esbuild (CJS bundle)
- **Auth**: Token-based (Bearer, stored in localStorage)

## Architecture

- `artifacts/izen/` — React + Vite frontend (serves at `/`)
- `artifacts/api-server/` — Express 5 API server (serves at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema + PostgreSQL client

## Key Features

- Multi-category IQ tests: Logical, Pattern, Math, Verbal
- Difficulty modes: Easy → Medium → Hard → Expert → Adaptive
- Real-time IQ scoring with accuracy + speed analysis
- Animated IQ score reveal on results page
- Personal dashboard with Recharts graphs
- Global leaderboard (weekly + all-time)
- Guest login, email register/login
- Anti-cheat tab-switch detection during tests
- Streak system
- Daily challenge endpoint

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Tables

- `users` — user accounts (email, password hash, name, age, avatar, streak)
- `questions` — IQ question bank (category, difficulty, text, options array, correct_option, time_limit)
- `test_sessions` — active/completed test sessions
- `test_results` — scored test results with IQ score, level, accuracy, speed
- `test_answers` — individual question answers per session

## IQ Scoring Algorithm

- Base score derived from accuracy (70–145 range)
- Difficulty multiplier (easy: 0.85x → expert: 1.15x)
- Speed bonus/penalty (±10 points based on time vs expected)
- IQ Levels: Average (<115), Above Average (115+), Gifted (130+), Genius (145+)

## Auth Notes

- Tokens are simple base64-encoded `{userId}:{timestamp}:{random}`
- Stored in localStorage as `izen_token`
- `setAuthTokenGetter` from `@workspace/api-client-react` wires token to all API calls
- `/auth/me` decodes the token and fetches the user

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
