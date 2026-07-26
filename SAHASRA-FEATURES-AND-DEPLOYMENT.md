# SAHASRA — Feature Specification & Zoho Catalyst Deployment Guide

**SAHASRA** — Karnataka State Police (KSP) Crime Intelligence & Analytics Platform
_KSP Datathon 2026 · full-stack web application_

---

## Table of Contents
1. [Overview](#1-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Intelligence Algorithms (the "smart" layer)](#3-intelligence-algorithms)
4. [Roles, RBAC & Demo Credentials](#4-roles-rbac--demo-credentials)
5. [Global / Cross-Cutting Features](#5-global--cross-cutting-features)
6. [Feature Specifications by Role](#6-feature-specifications-by-role)
   - [District SP (SP-8821)](#61-district-sp--sp-8821--14-screens)
   - [Crime Analyst (ANALYST-104)](#62-crime-analyst--analyst-104--18-screens)
   - [Investigating Officer (IO-402)](#63-investigating-officer--io-402--15-screens)
   - [Akka Pade Officer (AKKA-55)](#64-akka-pade-officer--akka-55--15-screens)
7. [Cross-Role Data Flows](#7-cross-role-data-flows)
8. [Full API Reference](#8-full-api-reference)
9. [Zoho Catalyst Deployment Guide](#9-zoho-catalyst-deployment-guide)
10. [Honest Limitations](#10-honest-limitations)

---

## 1. Overview

SAHASRA is a role-based crime-intelligence console for the Karnataka State Police. Four officer roles each get a distinct toolset shaped for their real work, backed by genuine analytics (spatial clustering, community detection, forecasting, semantic search, object detection) over a real ingested KSP crime corpus (~201,733 records) plus seeded operational data.

**Design principles actually enforced in the build:**
- **No dead ends** — every screen reads real data or writes to something another role sees.
- **RBAC-gated** — each role sees only its own screens; unauthorized route access is blocked and cryptographically logged.
- **Explainable** — AI outputs are shown as plain-language sentences alongside the raw numbers, with an Explainability Drawer exposing model source + feature weights + FIR citations.
- **Tamper-evident** — every sensitive action extends a SHA-256 hash-chained audit ledger.

---

## 2. Architecture & Tech Stack

### 5-Layer Intelligence Engine
```
1 · DATA PLANE      KSP corpus (201,733 records) · cases · incidents · audit_ledger
2 · INGEST          ingestRealDataset() · dataset-loader · 12 CSV files
3 · INTELLIGENCE    ST-DBSCAN · Louvain · TF-IDF · Holt-Winters · COCO-SSD · grounded RAG
4 · GATEWAY / RBAC  validateGatewayAccess() · 4 roles · SHA-256 append-only audit
5 · OPS UI          role dashboards · Explainability drawers · live WebSocket bus
                    (every action → append-only hash-chained audit log)
```

### Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite, TailwindCSS, React Router, Recharts, Leaflet, react-force-graph-2d |
| Object detection | TensorFlow.js + COCO-SSD (`ssdlite_mobilenet_v2`), **MIT**, local weights |
| Backend | Node.js + Express (TypeScript via `tsx`) |
| Realtime | native `ws` WebSocket bus at `/ws` |
| LLM | GROQ `llama-3.1-8b-instant` (server-side), with offline fallbacks |
| Auth | badge/password + **WebAuthn** (FIDO2) biometric via `@simplewebauthn` |
| Data (current) | in-memory stores in `functions/*` + `server/storage.ts` |
| Data (production target) | Zoho Catalyst Data Store (schema in `database/schema.zcql`) |

### Repo layout
```
web/            Vite React SPA (all screens in web/src/pages)
  src/pages/    ~40 screen components
  src/components/ Layout, SidebarNav (role-aware), TopBar, NotificationBell, Copilot, drawers
server/         Express server (index.ts serves web/dist + /api + /ws)
functions/      intelligence + feature logic (Catalyst-function-style modules)
shared/types.ts UserRole + ROLE_ROUTE_PERMISSIONS (RBAC source of truth)
public/models/coco-ssd/   local COCO-SSD weights (model.json + 5 shards)
public/clips/   bundled real street video clips
database/schema.zcql      Catalyst Data Store schema
```

---

## 3. Intelligence Algorithms

All implemented in pure TypeScript (no Python), running fully offline unless noted:

| Algorithm | Where | What it does |
|---|---|---|
| **ST-DBSCAN** | `functions/incidentCluster.ts` | Spatio-temporal density clustering of incidents (ε = 600 m) → hotspot clusters with intensity, breakdown, emerging-trend surge flag, and the real incident list per cluster |
| **Louvain community detection** | `functions/graphAnalytics.ts` | Modularity local-moving over the criminal network → "gangs"; kingpin = live highest-degree node per community |
| **Bipartite one-hop Projection** | `functions/graphAnalytics.ts` | Two persons sharing ≥1 common evidence/associate node but no direct link → dashed "Projection" edge (weight = shared count) |
| **TF-IDF + cosine** | `functions/offlineAnalytics.ts` | MO semantic search + behavioral pattern clustering over case narratives |
| **Holt-Winters (double exponential smoothing)** | `functions/offlineAnalytics.ts` | Real time-series forecast over weekly incident counts with confidence bands |
| **Jaro-Winkler** | `functions/roleFeatures.ts` | Fuzzy name/plate matching for repeat-offender auto-flag |
| **Z-score anomaly** | `functions/incidentCluster.ts` | Per-station current-week rate vs 11-week baseline → SURGE / DROP |
| **COCO-SSD (TF.js)** | `web/src/pages/CameraIntelligence.tsx` | Real client-side object detection on local video frames |
| **Grounded RAG** | `server/routes.ts` (copilot) | TF-IDF retrieval of real cases → GROQ answer citing retrieved FIRs |
| **SHA-256 hash chain** | `functions/auth.ts` | Append-only tamper-evident audit ledger |

---

## 4. Roles, RBAC & Demo Credentials

RBAC is defined in `shared/types.ts` (`ROLE_ROUTE_PERMISSIONS`). The sidebar renders only the current role's permitted routes; visiting a non-permitted route shows **ACCESS RESTRICTED** and logs the attempt.

**Demo login — password `Ksp#2026` for all:**

| Badge | Role | Default landing | # screens |
|---|---|---|---|
| `SP-8821` | District SP | Command Center | 14 |
| `ANALYST-104` | Crime Analyst | Hotspot Map | 18 |
| `IO-402` | Investigating Officer | Case Explorer | 15 |
| `AKKA-55` | Akka Pade Officer | Hotspot Map | 15 |

---

## 5. Global / Cross-Cutting Features

| Feature | Spec |
|---|---|
| **Login + Biometric** | Badge/password; if a platform authenticator exists, a real **WebAuthn** "Verify with Biometrics" flow (register-on-first-use, then assertion). Graceful password fallback. Every login writes `auth_method=password\|biometric` to the audit ledger. |
| **Ask SAHASRA Copilot** | Global floating panel. Grounded RAG: TF-IDF retrieves top real cases → GROQ answers citing the retrieved FIR numbers. Falls back to keyword answers offline. Clickable FIR citation chips → Explainability Drawer. |
| **Live Alert Bell** | Global. Connects to `/ws`; watchlist matches, panic/SOS, community tips, and collaboration requests push in real time with an unread badge. |
| **Data Provenance footer** | On every screen — shows the real source table + engine powering that screen + KSP corpus size + last-refreshed time. |
| **Explainability Drawer** | Reusable — model source, SHAP-style feature weights, and supporting FIR citations for any AI output. |
| **Role-aware Sidebar** | Auto-collapses below 1024 px (patrol-vehicle friendly); manual toggle preserved. |

---

## 6. Feature Specifications by Role

> Legend: **[shared]** = available to multiple roles; **[X-role]** = writes/reads data another role sees.

### 6.1 District SP — `SP-8821` (14 screens)

| # | Screen | Spec | Endpoint |
|---|---|---|---|
| 1 | **Command Center** | Live metrics (real hotspot count reconciled with the ST-DBSCAN engine), anomaly alert feed (clickable → drawer), supervisor Approve/Dismiss review queue (cascades to count + audit), clickable KPI drill-downs | `GET /api/catalyst/command-center`, `POST /review-queue/action` |
| 2 | **Hotspot Map** | Leaflet map; **Run On-Demand ST-DBSCAN** with "Last computed" timestamp + live cluster count; click a cluster → **breakdown drawer with the real incident rows** (id, type, timestamp, distance); GIS overlay toggles | `GET /hotspots`, `POST /trigger-clustering` |
| 3 | **Network Graph** | Avatar (deterministic offline) + glyph nodes; typed edges PARTY_TO / WORKS_WITH(weight) / **Projection** (solid=confirmed, dashed=inferred); **Louvain community list** with kingpins; **star-burst radial** incident view; click-through dossiers | `GET /network-graph`, `/network-graph/starburst` |
| 4 | **Camera Intelligence** | **Real COCO-SSD** local inference on bundled street clips (class + real confidence); alerts to Command Center on confident detections | local model + `POST /command-center/alerts` |
| 5 | **Case Explorer** | Paginated real cases + filters; **NL→JSON** search (GROQ, English + Kannada) showing parsed JSON; **MO semantic search** card; clickable rows → drawer | `GET /cases`, `POST /nl-query`, `GET /mo-search` |
| 6 | **Crime Trends** | Aggregated CSV time-series + category pie + **Holt-Winters forecast** band | `GET /trends`, `/forecast` |
| 7 | **Governance & Audit** | SHA-256 hash-chain **Verify Integrity**; **Live Bias & Fairness**; RBAC matrix; rendered **System Architecture** SVG | `POST /governance/verify-integrity`, `GET /governance/audits`, `/governance/bias-fairness` |
| 8 | **Bias & Fairness** | Per-ward alert-rate/10k vs census baseline; deviation flags; fairness score | `GET /governance/bias-fairness` |
| 9 | **Akka Patrol Fleet** | Live simulated telemetry (5 s server interval); **Dispatch Nearest Unit** via real haversine ranking | `GET /fleet`, `POST /fleet/dispatch-nearest` |
| 10 | **MO Semantic Search** | Offline TF-IDF + cosine over real case narratives; reworded queries still match | `GET /mo-search` |
| 11 | **Forecast Engine** | Holt's Linear Trend over 12 real weekly counts (α, β, RMSE, 4-week band) | `GET /forecast` |
| 12 | **Weekly Report** | Real KPI + clusters + audit + integrity → printable brief → PDF | `GET /report/weekly` |
| 13 | **Cross-District Escalations** | Approve/Deny real IO access requests → writes audit ledger | `GET /sp/cross-district-requests`, `POST /sp/cross-district-response` |
| 14 | **Patrol Planner** _[shared]_ | Fuses ST-DBSCAN intensity × Holt-Winters trend × time-slot risk × live fleet → deployable recommendations with plain-language rationale + Dispatch | `GET /patrol-plan` |

### 6.2 Crime Analyst — `ANALYST-104` (18 screens)

**Shared:** Command Center, Hotspot Map, Network Graph, Camera Intelligence, Crime Trends, MO Semantic Search, Forecast Engine, Patrol Planner.

**Analyst-only (10):**
| Screen | Spec | Endpoint |
|---|---|---|
| **Geo-Temporal Matrix** | Crime-type × hour-of-day incidence grid over 90 days + humanized peak takeaways | `GET /analyst/geo-temporal` |
| **Behavioral Pattern Profiler** | Token-cosine MO clustering → named behavioral "signatures" (groups cases; distinct from lookup) | `GET /analyst/signatures` |
| **Deep-Dive Case Comparator** | Pick 2–3 real cases side-by-side; shared field values highlighted | `GET /cases` (client compare) |
| **Predictive Suspect Ranking** | For an unsolved case, rank suspects by graph-proximity + MO-similarity with a plain-language reason each | `GET /analyst/suspect-ranking` |
| **Statistical Anomaly Explorer** | Per-station z-score (current week vs baseline), SURGE/DROP, sparkline histograms | `GET /analyst/anomaly` |
| **Custom Report Builder** | Toggle real sections (metrics/clusters/anomaly/audit) → compose → PDF | `GET /report/weekly`, `/analyst/anomaly` |
| **Crime Series Builder** | Group real cases into a named, savable series with a timeline strip | `GET/POST /analyst/series` |
| **Data Coverage Quality** | Per-station completeness + record staleness (honest: staleness is the real varying signal) | `GET /analyst/data-coverage` |
| **Annotation & Hypothesis Notebook** | Private, timestamped, **versioned** notes attached to any case/network target | `GET/POST /analyst/annotations` |
| **Trend-vs-External Correlator** | **Honestly labeled "awaiting external calendar data source"**; shows real surges ready to correlate | `GET /analyst/external-correlate` |

### 6.3 Investigating Officer — `IO-402` (15 screens)

**Shared:** Command Center, Camera Intelligence, Case Explorer, MO Semantic Search, Patrol Planner.

**IO-only (10):**
| Screen | Spec | Endpoint |
|---|---|---|
| **Digital Case Diary** | Append-only, timestamped investigation diary per case (legal case-diary); audit-logged | `GET/POST /io/case-diary` |
| **Evidence Locker** | Chain-of-custody log per item tied to case_id; log-in + transfer → audit ledger | `GET/POST /io/evidence`, `/io/evidence/transfer` |
| **Repeat Person/Vehicle Auto-Flag** | Real-time **Jaro-Winkler** check on intake; misspelt name still matches priors | `POST /io/repeat-check` |
| **Chargesheet Deadline Tracker** | CrPC 90-day deadlines from real FIR dates, urgency-coloured | `GET /io/deadlines` |
| **Warrant / Notice Generator** | Auto-fills CrPC 41A / 91 / Sec-93 template from real case fields → PDF | `GET /cases` (client fill) |
| **My Case Clearance Snapshot** | Officer resolution rate vs station average (humanized) | `GET /io/clearance` |
| **Mobile Evidence Capture** | Photo + real device GPS + timestamp → written to Evidence Locker _[X-role interlink]_ | `POST /io/evidence` |
| **Witness/Informant Management** | Contact log per case with confidentiality tier (Protected Identity masks name) + **Field Intel Inbox reading Akka tips** _[X-role]_ | `GET/POST /io/witnesses`, `GET /io/field-intel` |
| **Neighborhood Beat Notes** | Location-tied local-intelligence notes, jurisdiction-scoped | `GET/POST /io/beat-notes` |
| **Collaboration Request** | Ping another IO on a shared MO/suspect → store + **WS notification** _[X-role]_ | `GET/POST /io/collab` |

### 6.4 Akka Pade Officer — `AKKA-55` (15 screens)

**Shared:** Command Center, Hotspot Map, Camera Intelligence, Akka Patrol Fleet, Patrol Planner.

**Akka-only (10):**
| Screen | Spec | Endpoint |
|---|---|---|
| **Panic / SOS** | One-tap CRITICAL alert → **SP Command Center feed + every dashboard's bell** _[X-role]_; attaches live GPS | `POST /akka/panic` |
| **Live Beat Checklist** | Checkpoint list; check-in requires real device geolocation within 250 m (haversine) | `GET/POST /akka/beat-checkin` |
| **Offline Action Queue** | Actions queue in localStorage when offline; auto-sync on `online` event | client + `/akka/beat-checkin` |
| **My Beat's Hotspot Feed** | Same alerts table as SP, filtered to this officer's beat _[X-role]_ | `GET /akka/beat-feed` |
| **Nearby Unit Locator** | Real on-duty peer positions + haversine distance; closest-backup flag | `GET /akka/nearby` |
| **Shift Handover Notes** | Structured note passed to the next shift on the same beat | `GET/POST /akka/handover` |
| **Commendations & Verified-Spot Log** | Record of confirmed hotspot verifications + resolved dispatches on profile | `GET/POST /akka/commendations` |
| **Community Tip Quick-Capture** | Citizen tip → **shared FIELD INTEL pipeline IOs read + WS bell** _[X-role]_ | `POST /akka/community-tip` |
| **Pre-Shift Equipment Checklist** | Logged kit/vehicle checklist per shift | `GET/POST /akka/equipment` |
| **Quick Voice/Photo Field Report** | One-handed capture (Web Speech optional) → same FIELD INTEL pipeline _[X-role]_ | `POST /akka/community-tip` |

---

## 7. Cross-Role Data Flows

These are real writes visible on both sides (verified, not stubs):

```
Akka  Community Tip / Field Report ──► FIELD_INTEL store ──► IO Witness Manager "Field Intel Inbox"
                                                        └──► Live alert bell (all dashboards)

Akka  Panic / SOS ──► live_alerts store ──► SP Command Center feed + Akka Beat Feed + alert bell

IO    Collaboration Request ──► COLLAB store ──► WS notification (recipient bell) + audit ledger

IO    Cross-District Request ──► SP Cross-District Escalations ──► Approve/Deny ──► audit ledger

Any   Evidence log / diary / dispatch / login ──► SHA-256 hash-chained audit ledger ──► Governance
```

---

## 8. Full API Reference

All under `/api/catalyst/*` unless noted. Base URL = the deployed origin.

**Auth & audit:** `POST /auth/login`, `POST /auth/logout`, `GET /audit-logs`, `POST /webauthn/register/options|verify`, `POST /webauthn/auth/options|verify`, `GET /webauthn/status`
**SP / core:** `GET /command-center`, `POST /review-queue/action`, `POST /command-center/alerts`, `GET /hotspots`, `POST /trigger-clustering`, `GET /risk-matrix`, `GET /network-graph`, `GET /network-graph/starburst`, `GET /cases`, `POST /parse-intent`, `POST /nl-query`, `GET /mo-search`, `GET /trends`, `GET /forecast`, `GET /patrol-plan`, `GET /report/weekly`, `POST /governance/verify-integrity`, `GET /governance/audits`, `GET /governance/bias-fairness`, `POST /copilot`
**Analyst:** `GET /analyst/geo-temporal`, `/analyst/signatures`, `/analyst/suspect-ranking`, `/analyst/anomaly`, `GET/POST /analyst/series`, `GET /analyst/data-coverage`, `GET/POST /analyst/annotations`, `GET /analyst/external-correlate`
**IO:** `GET/POST /io/case-diary`, `GET/POST /io/evidence`, `POST /io/evidence/transfer`, `POST /io/repeat-check`, `GET /io/deadlines`, `GET /io/clearance`, `GET/POST /io/witnesses`, `GET/POST /io/beat-notes`, `GET/POST /io/collab`, `GET /io/field-intel`
**Akka:** `POST /akka/panic`, `GET/POST /akka/beat-checkin`, `GET /akka/beat-feed`, `GET /akka/nearby`, `GET/POST /akka/handover`, `GET/POST /akka/commendations`, `POST /akka/community-tip`, `GET/POST /akka/equipment`
**Fleet:** `GET /fleet`, `POST /fleet/dispatch-nearest`, `POST /fleet/clear`
**Realtime:** WebSocket `GET /ws?token=<session>`
**Ops:** `GET /api/health`, `GET /api/dataset/summary`

---

## 9. Zoho Catalyst Deployment Guide

### 9.0 The key decision
`server/index.ts` already serves **the built React app (`web/dist`) + all `/api` routes + the `/ws` WebSocket bus on one port** (`process.env.PORT`). Therefore deploy it as **one Catalyst AppSail (Node PaaS) service** — **not** serverless Functions, because serverless Functions cannot hold the long-lived WebSocket connection the live alert bell needs.

### 9.1 Prerequisites
```bash
npm install -g zcatalyst-cli
catalyst login          # authenticate with your Zoho account
```
Create/select a Catalyst project in the console (note the project ID + environment).

### 9.2 Build the frontend into the served path
```bash
cd web && npm install && npm run build   # → web/dist (Express serves this)
cd ..
```
> This also bundles the local COCO-SSD weights (`public/models/coco-ssd`) and video clips (`public/clips`) — they are served as static files, no CDN at runtime.

### 9.3 Initialise Catalyst
```bash
catalyst init      # choose AppSail; point it at the repo root
```

### 9.4 Configure the AppSail service
In `app-config.json` (or the console → AppSail):
- **Stack:** Node.js 18 or 20
- **Start command:** `npx tsx server/index.ts`
  _(or build first with `npm run server:build` → start `node server_dist/index.js`)_
- **Port:** injected by Catalyst; the server already reads `process.env.PORT`
- **Environment variables:**
  - `NODE_ENV=production`
  - `GROQ_API_KEY=…`  (grounded Copilot + NL→JSON; app degrades gracefully without it)
  - `OPENAI_API_KEY=…`, `NVIDIA_API_KEY=…` (optional)

> **HTTPS note:** Catalyst serves HTTPS, which is required for WebAuthn (secure context) and `navigator.geolocation`. So biometric login and the Akka geolocation check-ins work in production automatically.

### 9.5 Deploy
```bash
catalyst deploy
```
One public HTTPS URL now serves the UI, every API, the WebSocket bus, and the local ML assets.

### 9.6 Smoke test (production)
- `GET /api/health` → `{status:"ok"}`
- Log in `SP-8821` / `Ksp#2026`
- Trigger an Akka **Panic/SOS** → confirm it appears on Command Center + the bell badge increments (proves `/ws` works behind Catalyst's proxy)
- Governance → **Verify Integrity** → `verified: true`
- Camera Intelligence → confirm COCO-SSD boxes draw on the local clips

### 9.7 Production-grade upgrades (map each to a Catalyst service)
The code is structured so these are localized swaps:
| Concern | Catalyst service | Where to wire it |
|---|---|---|
| Persistence | **Data Store** | run `database/schema.zcql` in console; replace the in-memory maps in `server/storage.ts` + `functions/*` with the Data Store SDK (ZCQL) |
| LLM | **QuickML** | swap the single `callGroqChat()` in `server/routes.ts` (used by Copilot + `functions/nlQuery.ts`) for the QuickML endpoint |
| Scheduled recompute | **Cron** | schedule `runSpatiotemporalDBSCAN` + the Holt-Winters forecast refresh + fleet telemetry |
| File storage (evidence photos) | **Stratus** | wire the Mobile Evidence Capture upload bytes to Stratus object storage |
| Auth | **Catalyst Auth** | replace demo badge/password; keep the RBAC map in `shared/types.ts`; WebAuthn layers on top |
| Notifications | **Catalyst Notification** | escalate the in-app WS bell to push/SMS |

### 9.8 What runs on Catalyst with ZERO rewrites
React UI, all REST APIs, the WebSocket alert bus, WebAuthn (HTTPS), COCO-SSD local inference, and every offline analytic: ST-DBSCAN, Louvain, projection, TF-IDF MO search, Holt-Winters forecast, risk matrix, geo-temporal matrix, anomaly z-scores, Jaro-Winkler auto-flag, fleet telemetry, patrol planner, case diary, evidence locker, panic/SOS, and the governance hash-chain.

### 9.9 Alternative split-service deployment
If you prefer static hosting for the UI: frontend `web/dist` → **Web Client Hosting (Slate)**; backend → **AppSail**; then set the frontend API base + the `NotificationBell.tsx` WS URL to the AppSail origin, and the Vite proxy target. (The single-service option in §9.4 avoids all of this.)

---

## 10. Honest Limitations

Reported transparently rather than hidden:

- **Object detection quality is mixed.** Real COCO-SSD (`ssdlite_mobilenet_v2`, lightweight) runs locally on real frames — it detects **people reliably (0.56–0.91)** on the mixed clip but performs **poorly on the cars clip** (misses vehicles, produced a confident false positive "cell phone 0.99"). Upgrading to the heavier `mobilenet_v2` base would improve vehicle recall. No plate OCR (COCO-SSD is class-level only).
- **Trend-vs-External Correlator** is intentionally a placeholder ("awaiting external calendar data source") — no festival/payday reference table is ingested yet; the UI says so rather than faking a correlation.
- **Some analyst metrics are thin** on the 5-case seeded sample (e.g. clearance %, singleton MO signatures) — labeled in-UI; they grow on the full corpus.
- **Data-store persistence is in-memory** in the current build; production persistence = Catalyst Data Store (§9.7).
- **LLM features need `GROQ_API_KEY`** (or QuickML); without it they fall back to offline TF-IDF/heuristic parsing.
- **Not integrated:** the external Python `smart-cctv-ai` repo (unlicensed + Python + CDN weights) and Mapbox/Overpass overlays — replaced or declined with honest reasons.

---

_Generated for the SAHASRA KSP Datathon 2026 submission._
