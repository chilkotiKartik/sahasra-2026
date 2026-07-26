# SAHASRA — Zoho Catalyst Deployment Guide

This is the practical, current-state guide for the app **as it exists in this repo** (Vite React in `web/` + Express in `server/` + logic in `functions/` + WebSocket alert bus). A longer aspirational plan lives in `CATALYST-DEPLOYMENT-PLAN.md`; this file is what to actually run.

## 0. Key architectural fact that drives the whole deployment
`server/index.ts` already does three jobs on **one port**:
- serves the built React app from `web/dist` (static)
- serves every `/api/**` route
- runs the WebSocket alert bus at `/ws`

So the simplest correct deployment is **one AppSail (Node PaaS) service** — not serverless Functions, because **serverless Functions cannot hold the `/ws` WebSocket connection** the live alert bell needs.

---

## 1. Prerequisites
```bash
npm install -g zcatalyst-cli
catalyst login          # opens browser, authenticate with your Zoho account
```
Create a project in the Catalyst console (or `catalyst init` below). Note your **project ID** and **environment** (Development/Production).

## 2. Build the frontend into the path the server serves
```bash
cd web
npm install
npm run build           # → web/dist  (Express serves this automatically)
cd ..
```

## 3. Initialise Catalyst in the repo
```bash
catalyst init
```
Choose **AppSail** (and optionally **Web Client Hosting** if you later split — see §7). When asked for the app directory, point AppSail at the repo root (it needs `server/`, `functions/`, `shared/`, `web/dist`).

## 4. Configure the AppSail service
In `app-config.json` (or the console AppSail settings):
- **Stack:** Node.js 18 or 20
- **Command / entrypoint:** either
  - dev-style: `npx tsx server/index.ts`, or
  - built: add `"start": "node server_dist/index.js"` after `npm run server:build` (the repo already has `server:build` using esbuild)
- **Port:** the server reads `process.env.PORT` already — AppSail injects it, no change needed.
- **Environment variables** (AppSail → Environment):
  - `NODE_ENV=production`
  - `GROQ_API_KEY=…`  (grounded Copilot + NL→JSON; app has offline fallbacks if absent)
  - `OPENAI_API_KEY=…`, `NVIDIA_API_KEY=…` (optional)
  - `PORT` — leave to Catalyst

> WebAuthn note: `functions/webauthn.ts` derives `rpID`/origin from the request host, so it works on your `*.catalystserverless.com` (or custom) domain automatically **as long as the site is HTTPS** (WebAuthn requires a secure context — Catalyst gives you HTTPS, so biometrics will work on real devices in production).

## 5. Deploy
```bash
catalyst deploy
```
You get one public HTTPS URL serving the UI, all APIs, and the live alert bus.

## 6. Smoke-test after deploy
- `GET /api/health` → `{status:"ok"}`
- Load `/login`, sign in with a demo badge (`SP-8821` … `Ksp#2026`)
- Open Command Center, trigger an Akka **Panic/SOS**, confirm the alert appears and the bell badge increments (proves `/ws` works behind Catalyst's proxy)
- Run Governance → **Verify Integrity** → `verified: true`

## 7. (Optional) Split-service variant
If you prefer static hosting for the UI:
- Frontend `web/dist` → **Web Client Hosting (Slate)**
- Backend → **AppSail**
- Then set the frontend's API base + the `NotificationBell.tsx` WS URL to the AppSail origin, and update the Vite proxy target. (The single-service option in §1–5 avoids all of this.)

## 8. Production-grade upgrades (datathon scoring — do these next)
These are real Catalyst services the code is already structured to accept:
| Concern | Catalyst service | Where to wire it |
|---|---|---|
| Persistence | **Data Store** | run `database/schema.zcql` in the console, then replace the in-memory maps in `server/storage.ts` + `functions/*` with the Data Store SDK (ZCQL). |
| LLM | **QuickML** | swap the single `callGroqChat()` in `server/routes.ts` (used by Copilot + `functions/nlQuery.ts`) for the QuickML endpoint. Offline TF-IDF/heuristic fallbacks stay as safety net. |
| Scheduled recompute | **Cron** | schedule `runSpatiotemporalDBSCAN` + the Holt-Winters forecast refresh. |
| File uploads (evidence/photos) | **Stratus** | object storage for the IO evidence/geo-tag capture feature. |
| Auth | **Catalyst Auth** | replace the demo badge/password + keep the RBAC map in `shared/types.ts`. WebAuthn can layer on top. |
| Notifications | **Catalyst Notification** | escalate the in-app WS bell to push/SMS. |

## 9. What works on Catalyst with ZERO rewrites
React UI, all REST APIs, the WebSocket alert bus, WebAuthn (HTTPS), and every offline analytic: ST-DBSCAN, Louvain, TF-IDF MO search, Holt-Winters forecast, risk matrix, geo-temporal matrix, fleet telemetry, patrol planner, case diary, panic/SOS, governance hash-chain.

## 10. Pre-deploy checklist
- [ ] `cd web && npm run build` succeeds (tsc clean)
- [ ] `GET /api/health` returns ok on the deployed URL
- [ ] Login works for all 4 demo roles; each sees its own sidebar
- [ ] Panic/SOS from Akka appears on SP Command Center (WS path OK)
- [ ] Governance integrity check = valid on the deployed instance
- [ ] Env vars set (GROQ optional; app degrades gracefully without it)
