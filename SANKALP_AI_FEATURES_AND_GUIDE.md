# SANKALP AI — Comprehensive Feature Guide & User Manual

Welcome to **SANKALP AI** (Delhi's First AI-First Civic Engagement & Emergency Response Platform). This document details every single feature built into the platform, how they work under the hood, and how to access and test them.

---

## 1. Access Credentials & Entry Points

The platform consists of three distinct dashboards (Citizen, Police Command Center, and Admin War Room) built into a unified Expo routing app.

### 🔑 User Profiles & Credentials
To log in, enter the following details on the splash login screen:

| Dashboard | Phone Number | Password / PIN | Entry / Login Bypass |
| :--- | :--- | :--- | :--- |
| **Citizen Portal** | Enter any valid 10-digit number | Leave blank | Click **"Access Citizen Portal"** |
| **Police Command Center** | `9119119119` | `112112` | Click **"Police Command Center"** |
| **Admin War Room** | `9999999999` | `000000` | Click **"Admin Command Center"** (or tap SANKALP logo **5 times**) |

---

## 2. Citizen Dashboard (Urban Services & Women Safety)

Built for 20 million Delhi citizens to report infrastructure failures and trigger emergency services instantly.

### 🛠️ AI-First Complaint Classification & Priority Scoring
*   **How it works**: As a citizen types in the description box, the offline AI parser analyzes keywords in real-time.
*   **Auto-Categorization**: 
    *   *Roads/Potholes*: Keywords like "pothole", "gutter", "crater", "road damage".
    *   *Garbage*: Keywords like "smell", "dumping", "trash", "litter".
    *   *Water*: Keywords like "leakage", "dirty water", "no supply".
    *   *Streetlight*: Keywords like "broken bulb", "dark", "no light".
*   **AI Priority Score (0-100)**: Dynamically calculates severity:
    $$\text{Priority Score} = \text{Base}(40) + \text{Keyword Severity}(0\text{-}25) + \text{Evidence Photo}(+15) + \text{Cluster Density}(0\text{-}20)$$
    Reports scoring above `70` are flagged as **P1-Critical** and immediately trigger haptic warnings in the Command Center.

### 🚨 Women Safety: 5 Independent Panic Triggers
Designed to summon police even if the phone is locked, in a pocket, or the screen cannot be viewed:
1.  **Machined Volume Key (Primary)**:
    *   *Interaction*: Rapidly press the on-screen 3D volume button **6 times in 4 seconds**.
    *   *Feedback*: Features spring-loaded animations (`Animated.spring`) and an incrementing pop-up counter.
2.  **6-Tap Target Card**:
    *   *Interaction*: Tap the dedicated purple safety card **6 times**.
    *   *Feedback*: A circular progress ring fills, and 6 LED indicator dots light up.
3.  **2-Second Steady Press**:
    *   *Interaction*: Hold the indigo card down for **2 seconds**.
    *   *Feedback*: An active loading bar fills from 0% to 100% with real-time percentages.
4.  **Device Shake Detection (Accelerometer)**:
    *   *Interaction*: Shake the phone **3 times** in quick succession.
    *   *Technical details*: Subscribes to `expo-sensors` accelerometer updates at `80ms` intervals. Triggers when delta exceeds $|x| + |y| + |z| > 2.5$.
5.  **AppState Lock Screen Trigger**:
    *   *Interaction*: Rapidly press the phone's physical power button **3 times** (turning screen off/on).
    *   *Technical details*: Listens for background/foreground transition state changes within 2 seconds.

*   **Panic Cascade**: Once triggered, the app fires a high-accuracy GPS grab, starts background audio recording, sends a WebSocket payload to the command center, vibrates the phone in an SOS pulse, and displays a red panic lock screen.

---

## 3. Police Command Center (Sahasra Dashboard)

A high-density operations panel designed for Delhi's precinct dispatchers.

### 🗺️ Live Operations Map & SOS Trail
*   Renders active SOS alerts and complaints on an interactive vector map.
*   **Haversine Distance Matching**: When an SOS is triggered, the backend calculates the exact distance to Delhi's 25 registered police stations, matching the victim to the **2 nearest stations** automatically.
*   **Live Tracking**: Real-time GPS coordinates are posted every 15 seconds to trace breadcrumbs on the map.

### 🤖 NLP AI Copilot (English & Kannada Bilingual)
*   **Interaction**: Click the mic or input bar to search using natural language.
*   *English query*: `"Show chain snatchers in Peenya"`
*   *Kannada query*: `"ಪೀಣ್ಯದಲ್ಲಿ ಸರಗಳ್ಳತನದ ಬಗ್ಗೆ ಮಾಹಿತಿ ಕೊಡಿ"`
*   **Under the hood**: The copilot extracts intents (e.g., location, crime type, bail status) and returns semantic maps, sociological risk assessments, and links to criminal records.

### 🕸️ Vis.js Syndicate Link Graph
*   **Where**: Command Center → Syndicate tab.
*   **Visual Interface**: A dynamic, physics-based network graph mapping relations between suspects, vehicle plates, mule bank accounts, and crypto cashout channels.
*   **Interactive Drawer**: Tapping any suspect node on the graph triggers a React Native message bridge that opens a detailed criminal profile sheet.

### 📹 ANPR & AI CCTV Threat Detection
*   Simulates real-time CCTV camera feeds with auto-detecting license plates (ANPR).
*   **Real-time Alerts**: If a blacklisted plate (e.g. connected to pulsar chain-snatching gangs) passes a camera, a WebSocket alert is pushed to the console, showing flashing red target boundaries over the video feed.

---

## 4. Admin War Room & Workplace Wellness

Built for senior administrators to oversee precinct-wide performance and monitor officer health.

### 📈 GIS Map Console & D3 Link Graph
*   An advanced administrative layout displaying:
    *   **GIS Map**: Interactive mapping showing incident hotspots, flood risk zones (blue polygons), crime zones (red polygons), and garbage clusters (green polygons).
    *   **D3 Link Graph**: Relates civic issues to respective ward offices.

### 🧘 Officer Wellness & Fatigue Score Monitor
*   Supervises beat officers in real time. Tracks working hours, night duty count, active cases, and patrol frequency.
*   **Fatigue Score**: Dynamically calculated using active work metrics.
*   **AI Caseload Rebalance Engine**:
    *   *Interaction*: Tapping **"AI Rebalance Caseload"** on an overworked officer (Fatigue index > 80%) automatically scans the beat for the least burdened active officer.
    *   *Action*: Shifts active cases to balance the workload, instantly updates the UI, and prints a secure compliance transaction to the immutable ledger.

### 🔒 DPDP Act 2023 Cryptographic Audit Ledger
*   **Compliance**: Meets **Section 7(i) State Grounds** of the Digital Personal Data Protection Act (DPDP), ensuring all accesses to citizen locations or case files are logged.
*   **Layout**: Compact block-explorer cards showing action category, lawful grounds, precinct stamp, and cryptographic validation badges.
*   **Interactive Verification**: Clicking any log opens the **Block Explorer Modal**.
*   **SHA-256 Validation**: Tapping **"Verify Ledger Integrity"** runs a sequential SHA-256 hash chain verification:
    $$\text{Block Hash} = \text{SHA256}(\text{Index} + \text{Timestamp} + \text{Action} + \text{Previous Hash} + \text{Payload})$$
    Returns a green **"LEDGER INTEGRITY VERIFIED"** confirmation once the chain validates successfully.

---

## 5. Clean Development & Build Setup

The codebase has been refactored to ensure high compatibility and non-breaking builds:

### 🌐 Dynamic API & WebSocket Resolution
All backend requests dynamically resolve endpoints:
*   *Local Web/Metro*: Directs to `http://localhost:5000` (port 5000 backend).
*   *Production Build*: Dynamically maps to the deployed origin domain (e.g. `https://sankalp-ai.replit.app` or `window.location.origin`), completely preventing remote API connection failures.

### 🔌 Start Server Offline
If starting the bundler without internet connectivity, use the offline flag:
```bash
npx expo start --offline
```
This skips version validation fetches to the Expo registry, resolving Metro boot issues instantly.
