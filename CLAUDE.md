@AGENTS.md

# Humoura

Humor-based social media platform. Tagline: "Where Humor Meets Connection."
A community built around positive, humorous content and connection.

Live demo: https://humoura.vercel.app/

## Current status

The app is still unmodified `create-next-app` boilerplate. `app/page.tsx` is the
default template page. All planning is done; feature implementation has not started.
Follow `docs/build-plan.md` for build order.

## Stack

- Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5
- Tailwind CSS v4 (via `@tailwindcss/postcss`), Geist / Geist Mono fonts
- Hosting: Vercel (confirmed/locked)
- Everything else (backend, DB, auth, realtime, media storage, positivity
  filter) is TBD — see `docs/stack.md`. Do not assume libraries/services beyond
  what is confirmed; log each decision in `docs/decisions.md` when locked.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## Documentation map

Read these before working on the corresponding area:

- `docs/prd.md` — feature specs and edge cases (Feed, Vines, Likes/Comments,
  Positivity Filter, Messaging, Profiles, Settings, Admin)
- `docs/scope.md` — in-scope vs out-of-scope; anything outside needs sign-off
- `docs/stack.md` — confirmed vs TBD tech decisions
- `docs/schema.md` — draft data model and access rules
- `docs/build-plan.md` — ordered, phased task list (Phase 0 → 7)
- `docs/decisions.md` — running decision log (append, keep current)
- `docs/design.md` — design system extracted from the prototype
- `design/Humoura App.dc.html` — interactive UI prototype (source of truth for
  visual design; open in a browser to click through all screens)

## Product surfaces

Feed, Vines (media grid), Messages (DMs, connection-gated), Friends
(followers/following), Profile, Settings (Privacy/Notifications/Account), Admin.

## Key rules and decisions

- **Positivity filter** is required on all posts/comments before they become
  visible to others. Exact rules/thresholds and fail-open-vs-closed behavior are
  still TBD (see `docs/prd.md` open questions).
- **Messaging is connection-gated** — restricted to users you follow. Whether
  mutual follow is required is still open. Enforce eligibility at write-time, not
  just in the UI.
- **Access control** for posts/comments is filtered by author privacy + follow
  relationship. Admin endpoints are role-restricted.
- Open questions still needing client answers: positivity filter thresholds,
  messaging eligibility (mutual vs one-directional), admin role granularity,
  content retention/deletion policy.

## Working style

- This is a modified Next.js — read `node_modules/next/dist/docs/` before writing
  Next code (see AGENTS.md).
- Keep `docs/decisions.md` and `docs/build-plan.md` current as work progresses.
