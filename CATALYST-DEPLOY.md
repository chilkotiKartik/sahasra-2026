# SAHASRA — Full Zoho Catalyst Deployment Guide

This deploys **everything on Catalyst**: the Express API (+ WebSocket) on **Catalyst AppSail**, and the web SPA on **Catalyst Web Client Hosting**. The Expo mobile app is distributed via EAS/app stores and just points at the AppSail URL.

> **Why AppSail, not Functions:** the API uses an in-memory store and a `/ws`
> WebSocket. Catalyst **Functions are serverless/stateless** and don't support
> long-lived WebSockets — they'd break both. **AppSail runs a persistent
> container**, so the app deploys unchanged. (For durable data across container
> restarts, later swap `MemoryPoliceStore` for a ZCQL-backed store behind the
> existing `PoliceStore` interface in `server/police/store.ts` — the seam is
> already there.)

---

## Prerequisites
```bash
npm install -g zcatalyst-cli
catalyst login
```

## 1. Initialize (generates the real config for YOUR org)
```bash
catalyst init
```
Select **AppSail** and **Client (Web Hosting)**. This produces/overwrites
`catalyst.json` and the AppSail `app-config.json` with your real `project_id`.
The template files committed here (`catalyst.json`, `app-config.json`) show the
intended shape — let `catalyst init` fill in the IDs.

## 2. Build both artifacts
```bash
# API (bundles server/index.ts -> server_dist/)
npm install && npm run catalyst:build

# Web SPA (outputs web/dist, which client hosting serves)
npm run catalyst:client:build
```

## 3. Set server env vars (Catalyst Console → AppSail → Environment)
| Variable | Value |
|---|---|
| `JWT_ACCESS_SECRET` | a long random string (fixed, so tokens survive restarts) |
| `JWT_REFRESH_SECRET` | a different long random string |
| `NODE_ENV` | `production` |
| `OPENAI_API_KEY` / `GROQ_API_KEY` / `NVIDIA_API_KEY` | if using the AI routes |

> The server already reads `X_ZOHO_CATALYST_LISTEN_PORT` (AppSail injects it),
> falling back to `PORT` then `5000`. No code change needed.

## 4. Deploy
```bash
catalyst deploy
```
This uploads the AppSail service and the `web/dist` client. Note the two URLs
Catalyst returns:
- **AppSail URL** → your API origin, e.g. `https://sahasra-api-XXXX.catalystserverless.com`
- **Client URL** → your web SPA.

## 5. Point the mobile app at the deployed API
The Expo app resolves its API base from `EXPO_PUBLIC_API_URL` (see `lib/config.ts`).
Set it for EAS builds in **`eas.json`** (already scaffolded) and for local `.env`:
```
EXPO_PUBLIC_API_URL=https://sahasra-api-XXXX.catalystserverless.com
```

## 6. CORS
Add your Catalyst **client** domain to the server's allowed origins in
`server/index.ts` (the CORS block near the top) so the SPA can call the AppSail API.

---

## Live updates on Catalyst
The app uses **polling** (`useApi(..., { pollMs })`) for live roster / dispatch /
command-center / map updates, which works over plain HTTPS on AppSail. The `/ws`
WebSocket is an optional enhancement AppSail also supports.

## What is verified vs not
- ✅ Server binds the AppSail port env; builds via `catalyst:build`; client builds to `web/dist`.
- ✅ App works over polling (no WS dependency).
- ⚠️ **Not executed against a live Catalyst tenant here** (no CLI/account in the
  build environment). Run steps 1–4 on your Catalyst org; confirm the exact
  `app-config.json` field names against your `catalyst` CLI version (schemas
  evolve — `catalyst init` is the source of truth).
- ⚠️ In-memory data resets if the AppSail container restarts/redeploys. For
  persistence, implement a ZCQL `PoliceStore` (interface already defined).
