# SANKALP AI → SAHASRA Multi-Agent Upgrade Blueprint

## Complete File-by-File Transformation Plan

> **Goal**: Transform SANKALP AI into a multi-agent, offline-first, edge-AI-powered civic platform inspired by the SAHASRA architecture.
> **Strategy**: Layer new capabilities on top of existing code — never break what works.

---

## Table of Contents

1. [New Directory Structure](#1-new-directory-structure)
2. [Phase 1: Multi-Agent Backend Engine](#2-phase-1-multi-agent-backend-engine)
3. [Phase 2: Offline-First & Streaming](#3-phase-2-offline-first--streaming)
4. [Phase 3: Edge AI & Security](#4-phase-3-edge-ai--security)
5. [Phase 4: Zero-Crush UI Overhaul](#5-phase-4-zero-crush-ui-overhaul)
6. [Phase 5: Web Portal Upgrades](#6-phase-5-web-portal-upgrades)
7. [Package Dependencies](#7-package-dependencies)
8. [Implementation Order](#8-implementation-order)

---

## 1. New Directory Structure

```
server/
├── index.ts                          # [MODIFY] Add agent routes
├── routes.ts                         # [MODIFY] Delegate to agents
├── storage.ts                        # [MODIFY] Add agent data methods
│
├── agents/                           # [NEW] Multi-Agent System
│   ├── index.ts                      # Agent orchestrator
│   ├── IntentRouter.ts               # Agent 1: JSON intent parser
│   ├── ComplaintClassifier.ts        # Agent 2: Category+NLP classifier
│   ├── DispatchOptimizer.ts          # Agent 3: GNN dispatch routing
│   ├── HotspotDetector.ts            # Agent 4: DBSCAN clustering
│   ├── KnowledgeBase.ts              # Agent 5: RAG vector store
│   ├── OfflineSync.ts                # Agent 6: Sync queue manager
│   ├── StealthSOS.ts                 # Agent 7: Silent streaming
│   ├── FieldVerifier.ts              # Agent 8: Human-in-loop verification
│   └── prompts/                      # Agent system prompts
│       ├── intentRouter.txt
│       ├── complaintClassifier.txt
│       └── fieldVerifier.txt
│
├── vector-store/                     # [NEW] RAG knowledge base
│   ├── index.ts                      # ChromaDB/LanceDB client
│   ├── embed.ts                      # Embedding generation
│   └── documents/                    # Source documents
│       ├── schemes.md                # Government schemes
│       ├── helplines.md              # Emergency helplines
│       └── districts.md              # District data
│
├── streaming/                        # [NEW] WebRTC + gRPC
│   ├── webrtc.ts                     # WebRTC signaling server
│   └── grpc.proto                    # Protobuf service defs
│
└── web/                              # [MODIFY] Portal files
    ├── portal.html                   # Add agent dashboard
    ├── dept.html                     # Add SSE for agents
    ├── cpr.html                      # Add live heatmap
    ├── pcr.html                      # Add patrol view
    ├── public.html                   # Add agent status
    └── rti.html                      # [no change]

app/
├── (tabs)/
│   ├── index.tsx                     # [MODIFY] Add OmniFAB
│   ├── sos.tsx                       # [MODIFY] Add Stealth Mode
│   ├── map.tsx                       # [MODIFY] Add heatmap layer
│   ├── complaints.tsx                # [MODIFY] Add AI photo analysis
│   ├── ai.tsx                        # [MODIFY] Replace with IntentRouter
│   └── profile.tsx                   # [MODIFY] Add offline queue status
│
├── admin/
│   ├── index.tsx                     # [MODIFY] Add agent dashboard
│   ├── alerts.tsx                    # [MODIFY] Add WebRTC stream view
│   └── workermap.tsx                 # [MODIFY] Add dispatch optimization
│
└── (auth)/
    └── login.tsx                     # [MODIFY] Add biometric option

components/
├── OmniFAB.tsx                       # [NEW] Pulsating FAB
├── DynamicBottomSheet.tsx            # [NEW] Slide-up panels
├── HapticGeoMarker.tsx               # [NEW] Vibrating proximity pins
├── NeonStatusCard.tsx                # [NEW] OLED-black semantic cards
├── SafetyScorePathing.tsx            # [NEW] Safest route display
├── StealthSOSOverlay.tsx             # [NEW] Black screen + silent cam
├── HeatmapLayer.tsx                  # [NEW] DBSCAN cluster rendering
├── AkkaPadeTracker.tsx               # [NEW] Live commute sharing
├── OfflineQueueBadge.tsx             # [NEW] Pending sync indicator
├── VoiceCommandButton.tsx            # [NEW] Push-to-talk voice AI
├── AiPhotoAnalyzer.tsx               # [NEW] YOLO on-device photo scan
└── AgentStatusPanel.tsx              # [NEW] Multi-agent health dashboard

context/
├── AppContext.tsx                    # [MODIFY] Add agent state
├── AuthContext.tsx                   # [MODIFY] Add MAC binding
├── LanguageContext.tsx               # [no change]
└── NotificationContext.tsx           # [no change]

lib/
├── query-client.ts                   # [no change]
├── sosheatmap-html.ts                # [no change]
├── workermap-html.ts                 # [no change]
├── dbscan.ts                         # [NEW] DBSCAN clustering algorithm
├── webrtc-client.ts                  # [NEW] WebRTC client helper
├── offline-queue.ts                  # [NEW] SQLite offline queue
├── knox-secure.ts                    # [NEW] Samsung Knox wrappers
└── haversine.ts                      # [NEW] Extracted from storage.ts

constants/
├── colors.ts                         # [MODIFY] Add semantic color palette
└── districts.ts                      # [no change]

shared/
├── schema.ts                         # [MODIFY] Add agent tables
└── models/
    └── chat.ts                       # [MODIFY] Add agent message types

public/
├── leaflet/                          # [no change]
├── onnx/                             # [NEW] ONNX runtime WASM files
└── models/                           # [NEW] Quantized YOLO/IndicWav2Vec
    ├── yolo10n.onnx
    └── indic-wav2vec.onnx

patches/                              # [no change]

scripts/
├── build.js                          # [MODIFY] Add agent bundle step
└── seed-vector-db.ts                 # [NEW] Seed knowledge base
```

---

## 2. Phase 1: Multi-Agent Backend Engine

### 2.1 Agent Orchestrator (`server/agents/index.ts`) — NEW

**What it does**: Central router that receives all API requests and delegates to the correct agent. Replaces the monolithic `generateAIReply()` function.

```typescript
// Architecture
export class AgentOrchestrator {
  private agents: Map<string, Agent>;
  
  async route(input: UserInput): Promise<AgentResponse> {
    // 1. IntentRouter parses the input
    const intent = await this.agents.get('intentRouter').process(input);
    
    // 2. Route to specialized agent based on intent
    switch (intent.type) {
      case 'FILE_COMPLAINT': return this.agents.get('complaintClassifier').process(intent);
      case 'EMERGENCY_SOS': return this.agents.get('dispatchOptimizer').process(intent);
      case 'GENERAL_QUERY': return this.agents.get('knowledgeBase').process(intent);
      case 'FIELD_VERIFY': return this.agents.get('fieldVerifier').process(intent);
      default: return this.agents.get('knowledgeBase').process(intent);
    }
  }
}
```

**Files affected**: NEW file `server/agents/index.ts`

### 2.2 IntentRouter Agent (`server/agents/IntentRouter.ts`) — NEW

**What it does**: Replaces the current `generateAIReply()` function. Uses a small LLM (Gemma-2B via Groq — FREE tier) to parse user input into structured JSON intents.

**SAHASRA Reference**: The Llama-3 intent parser that outputs strict JSON instead of free text.

```typescript
// Input: "Meri gali mein pothole hai aur raat ko streetlight nahi jal raha"
// Output: {
//   intent: "FILE_COMPLAINT",
//   entities: { categories: ["pothole", "streetlight"], location: "inferred" },
//   urgency: "high",
//   language: "hi"
// }

// FREE model: Groq provides Gemma-2-9B at 30k req/day free
// Fallback: Regex-based intent parser (works offline, no API call)
```

**What changes**:
- **`server/routes.ts`**: Replace the `/api/chat` handler to use IntentRouter instead of `generateAIReply()`
- **`app/(tabs)/ai.tsx`**: Update chat UI to show structured intent cards (not just raw text)

### 2.3 ComplaintClassifier Agent (`server/agents/ComplaintClassifier.ts`) — NEW

**What it does**: Upgrades the current regex-based classification to a lightweight NLP model. Detects 14+ categories, extracts location entities, computes priority scores.

**SAHASRA Reference**: The on-device NLP that classifies complaints without cloud dependency.

```typescript
// FREE model: Uses IndicBERT (opensource) via ONNX Runtime
// Or: LangChain + vector similarity for zero-shot classification

// Current (storage.ts lines 108-126):
function assignDepartment(category: string): string { ... }

// New:
async function classifyComplaint(text: string): Promise<Classification> {
  // 1. Run on-device ONNX model (if available)
  // 2. Fallback: TF-IDF + cosine similarity with category corpus
  // 3. Last resort: Current static map
  return { category, department, priority, confidence };
}
```

**Files affected**:
- **`server/routes.ts`**: Update `POST /api/complaints` to use classifier
- **`server/storage.ts`**: Replace `assignDepartment` with agent call
- **`app/(tabs)/complaints.tsx`**: Show AI confidence and alternative categories

### 2.4 DispatchOptimizer Agent (`server/agents/DispatchOptimizer.ts`) — NEW

**What it does**: Replaces the current Haversine "nearest 2 stations" with a GNN + Contextual Bandits approach. Factors in officer availability, traffic, time-of-day risk, and patrol van proximity.

**SAHASRA Reference**: "Predictive Dispatch & Safe Routing" using GNNs.

```typescript
// Current (storage.ts lines 667-674):
function distanceKm(a: GeoPoint, b: GeoPoint): number { ... }

// New:
async function optimizeDispatch(sos: SOSAlert): Promise<DispatchPlan> {
  // 1. Build graph: officers + stations + hospitals as nodes
  // 2. Weight edges by: distance + traffic + time-of-day risk + officer status
  // 3. Run Dijkstra/contextual bandit to find top 2 optimal responders
  // 4. Return { responders, eta, route }
}
```

**Files affected**:
- **`server/routes.ts`**: Update SOS endpoints to use optimizer
- **`server/storage.ts`**: Keep Haversine as fallback
- **`app/(tabs)/sos.tsx`**: Show ETA and responder name/photo during SOS
- **`app/admin/alerts.tsx`**: Show optimized dispatch route on map

### 2.5 HotspotDetector Agent (`server/agents/HotspotDetector.ts`) — NEW

**What it does**: Runs DBSCAN clustering on complaint/SOS geo-data every 15 minutes. Generates dynamic risk zones that update in real-time via WebSocket. Powers the heatmap on the map screen.

**SAHASRA Reference**: "LiveHeatmapLayer: Renders pulsing DBSCAN clusters in real-time."

```typescript
// Database: Existing complaint.geo data in storage.ts
// Algorithm: DBSCAN (Density-Based Spatial Clustering)
// Parameters: epsilon=0.01 (≈1km), minPoints=3

class HotspotDetector {
  async runClustering(): Promise<RiskZone[]> {
    const complaints = storage.getComplaints();
    const clusters = dbscan(
      complaints.map(c => c.geo),
      { epsilon: 0.01, minPoints: 3 }
    );
    // Convert clusters to RiskZone objects
    // Emit via WebSocket: { type: "hotspot_update", zones: [...] }
  }
}
```

**Files affected**:
- **`lib/dbscan.ts`**: NEW — DBSCAN implementation
- **`server/agents/HotspotDetector.ts`**: NEW — clustering engine
- **`server/routes.ts`**: Wire hotspot updates into existing WebSocket broadcast
- **`components/HeatmapLayer.tsx`**: NEW — renders clusters on map
- **`app/(tabs)/map.tsx`**: Integrate HeatmapLayer component

### 2.6 KnowledgeBase Agent (RAG) (`server/agents/KnowledgeBase.ts`) — NEW

**What it does**: Replaces the current hardcoded system prompt (200+ lines in `routes.ts`) with a vector database + RAG pipeline. The agent retrieves relevant documents, injects them into the LLM context, and generates grounded responses.

**SAHASRA Reference**: Not directly — this is an upgrade even beyond SAHASRA's design.

```typescript
// Current (routes.ts lines 253-285): Huge system prompt with static data
// New:
async function query(userMessage: string, district: string): Promise<string> {
  // 1. Embed user message
  const embedding = await embed(userMessage);
  
  // 2. Retrieve relevant documents from vector store
  const docs = await vectorStore.similaritySearch(embedding, 5);
  
  // 3. Build dynamic prompt with ONLY relevant context
  const prompt = buildPrompt(docs, district);
  
  // 4. Call LLM with compact prompt (saves tokens = FREE)
  return callLLM(prompt, userMessage);
}
```

**Files affected**:
- **`server/vector-store/index.ts`**: NEW — ChromaDB/LanceDB client
- **`server/vector-store/embed.ts`**: NEW — embedding generation (free via `@xenova/transformers`)
- **`server/vector-store/documents/`**: NEW — source documents as markdown
- **`server/agents/KnowledgeBase.ts`**: NEW — RAG agent
- **`server/routes.ts`**: Replace system prompt injection with RAG call
- **`scripts/seed-vector-db.ts`**: NEW — one-time script to populate vector store

### 2.7 FieldVerifier Agent (`server/agents/FieldVerifier.ts`) — NEW

**What it does**: When a worker marks a complaint as resolved, this agent auto-generates a verification task. It sends the citizen a follow-up question, analyzes their response/photo, and either confirms resolution or re-opens the complaint.

**SAHASRA Reference**: "Human-in-the-Loop Form" with SmartTags and verification.

```typescript
async function verifyResolution(complaint: Complaint): Promise<VerificationResult> {
  // 1. Generate verification question
  // 2. Send push notification to citizen
  // 3. Wait for response (photo + rating)
  // 4. Run YOLO on "after" photo to check if issue is actually fixed
  // 5. If AI confidence < 0.7, escalate to human supervisor
  // 6. Return verified/rejected
}
```

**Files affected**:
- **`server/agents/FieldVerifier.ts`**: NEW — verification agent
- **`server/routes.ts`**: Hook into complaint resolve/reject flow
- **`app/(tabs)/complaints.tsx`**: Show verification task UI
- **`components/AiPhotoAnalyzer.tsx`**: NEW — on-device photo verification

---

## 3. Phase 2: Offline-First & Streaming

### 3.1 Offline-Queue (`lib/offline-queue.ts`) — NEW

**What it does**: Wraps SQLite (via `expo-sqlite`) to cache all API data locally. When offline, complaints and SOS events are queued. When connectivity restores, they sync automatically.

**SAHASRA Reference**: WatermelonDB-based offline-first architecture.

```typescript
// Queue structure:
interface OfflineQueue {
  id: string;
  action: 'CREATE_COMPLAINT' | 'TRIGGER_SOS' | 'UPDATE_LOCATION';
  payload: any;
  createdAt: string;
  retries: number;
}

// Flow:
// 1. User creates complaint → save to SQLite + queue
// 2. POST /api/complaints → on success, remove from queue
// 3. On network restore → replay all queued actions
// 4. Conflict resolution: server timestamp wins
```

**Files affected**:
- **`lib/offline-queue.ts`**: NEW — queue manager
- **`context/AppContext.tsx`**: Wrap all API calls with offline queue
- **`components/OfflineQueueBadge.tsx`**: NEW — shows pending sync count
- **`app/(tabs)/profile.tsx`**: Show offline queue status

### 3.2 WebRTC Streaming (`server/streaming/webrtc.ts` + `lib/webrtc-client.ts`) — NEW

**What it does**: Enables live audio/video streaming from citizen's phone to Admin War Room during SOS. Replaces the current 15-second GPS polling with real-time WebRTC streams.

**SAHASRA Reference**: "WebRTC: Live low-latency audio/video to Police Command Center."

```typescript
// Server: Simple signaling server using existing WebSocket
// Client: react-native-webrtc

// Flow:
// 1. SOS trigger → create WebRTC offer
// 2. Send offer via WebSocket signaling
// 3. Admin accepts → establish P2P connection
// 4. Stream video + audio in real-time
// 5. Record stream server-side as evidence
```

**Files affected**:
- **`server/streaming/webrtc.ts`**: NEW — WebRTC signaling server
- **`lib/webrtc-client.ts`**: NEW — client-side WebRTC helper
- **`app/(tabs)/sos.tsx`**: Activate WebRTC on SOS trigger
- **`app/admin/alerts.tsx`**: Show live stream from citizen
- **`package.json`**: Add `react-native-webrtc`

### 3.3 Stealth SOS (`lib/stealth-sos.ts`) — NEW

**What it does**: When SOS is triggered, the screen goes completely black (looks powered off). Meanwhile, camera + mic activate silently and stream to the Command Center.

**SAHASRA Reference**: "StealthModeTrigger: Once swiped, the app screen turns completely black (looks powered off to an attacker), but silently activates the microphone and camera via WebRTC."

```typescript
// Flow:
// 1. User triggers SOS (any of 5 methods)
// 2. Screen overlay: pure black View with opacity 1
// 3. Camera starts recording (front or back depending on orientation)
// 4. Mic starts capturing audio
// 5. WebRTC stream sent to Admin War Room
// 6. Admin sees/hears everything; attacker sees dead phone
```

**Files affected**:
- **`components/StealthSOSOverlay.tsx`**: NEW — black screen + silent recording
- **`app/(tabs)/sos.tsx`**: Integrate Stealth SOS as option
- **`app/admin/alerts.tsx`**: Show "Stealth Mode Active" badge with live feed

### 3.4 Protobuf Serialization (`server/streaming/grpc.proto`) — OPTIONAL

**What it does**: Replaces JSON serialization with Protocol Buffers for bandwidth-constrained environments (2G/3G in rural Uttarakhand).

**SAHASRA Reference**: "gRPC/Protobufs replaces standard REST/JSON for backend data fetching."

Due to complexity, this is a "nice to have" — implement only if 2G performance is critical. The current REST/JSON works fine for 4G/5G.

---

## 4. Phase 3: Edge AI & Security

### 4.1 On-Device YOLO Vision (`components/AiPhotoAnalyzer.tsx`) — NEW

**What it does**: When a citizen uploads a complaint photo, YOLOv10 Nano runs on-device (via ONNX Runtime) to detect objects, verify the photo is real (not a stock image), and auto-fill category + severity.

**SAHASRA Reference**: "YOLOv10 Nano runs locally on the phone's NPU/GPU at 30+ FPS. Sends only the 50kb cropped image to the SCRB server."

**FREE models**: YOLOv5 Nano / YOLOv8 Nano are fully open-source. Quantized ONNX models are ~6MB.

```typescript
// Flow:
// 1. User takes photo via expo-image-picker (camera only, no gallery — like SAHASRA)
// 2. Load ONNX model from bundled assets
// 3. Run inference: detect objects, classify scene
// 4. If pothole detected: auto-fill "pothole" category
// 5. Compute photo authenticity score (is it a real photo or downloaded image?)
// 6. Send only cropped relevant area to server (privacy + bandwidth)
```

**Files affected**:
- **`components/AiPhotoAnalyzer.tsx`**: NEW — YOLO wrapper component
- **`app/(tabs)/complaints.tsx`**: Integrate AiPhotoAnalyzer in complaint form
- **`public/models/yolo10n.onnx`**: NEW — bundled model file
- **`public/onnx/`**: NEW — ONNX Runtime WASM files (for web)

### 4.2 Kannada/English Voice AI (`components/VoiceCommandButton.tsx`) — NEW

**What it does**: Push-to-talk button that records speech, runs on-device IndicWav2Vec for transcription (works with Kannada, Hindi, English code-mixing), and sends text to IntentRouter.

**SAHASRA Reference**: "IndicWav2Vec model runs locally to parse Kannada and English code-mixing despite heavy background noise."

**FREE model**: IndicWav2Vec is open-source from AI4Bharat. Quantized ONNX version ~50MB.

```typescript
// Flow:
// 1. User holds VoiceCommandButton
// 2. expo-av records audio
// 3. ONNX Runtime runs IndicWav2Vec transcription
// 4. Text sent to IntentRouter agent
// 5. Result spoken back via expo-speech (TTS in Hindi/Kannada)
```

**Files affected**:
- **`components/VoiceCommandButton.tsx`**: NEW
- **`app/(tabs)/sos.tsx`**: Add voice SOS trigger (SAHASRA's "help me" / "bachao")
- **`app/(tabs)/ai.tsx`**: Add voice input option

### 4.3 MAC Address Binding (`context/AuthContext.tsx`) — MODIFY

**What it does**: Admin mode is locked to the officer's registered device. JWT token is bound to the device's MAC address. Prevents unauthorized access from personal phones.

**SAHASRA Reference**: "Police Mode will only authenticate if the JWT token matches the physical MAC address of the officer's registered, government-issued device."

```typescript
// Login flow:
// 1. Collect device MAC (or unique device ID via expo-device)
// 2. Send phone + pin + deviceId to server
// 3. Server generates JWT with deviceId embedded
// 4. Each API call validates JWT deviceId matches request deviceId
// 5. If mismatch → 403 Unauthorized
```

**Files affected**:
- **`context/AuthContext.tsx`**: Add device ID collection
- **`server/routes.ts`**: Add MAC/device validation middleware
- **`server/storage.ts`**: Add device binding to token creation
- **`app/(auth)/login.tsx`**: Show admin device registration flow

### 4.4 RAM-Only Rendering (`lib/knox-secure.ts`) — NEW

**What it does**: Sensitive data (suspect details, FIR info) is rendered in RAM only — never written to disk. When app is backgrounded or closed, RAM is flushed.

**SAHASRA Reference**: "Suspect cards and FIR details are rendered in RAM. They are never saved to the device's physical storage."

```typescript
// Implementation (Android):
// 1. Use Android Enterprise / Samsung Knox for work profile isolation
// 2. Disable screenshots: getWindow().setFlags(FLAG_SECURE)
// 3. Prevent copy-paste from admin views
// 4. Flush sensitive state on app background (AppState 'background' → clear)

// Implementation (iOS):
// UIApplicationUserDidResignActiveNotification → clear sensitive views
```

**Files affected**:
- **`lib/knox-secure.ts`**: NEW — security utilities
- **`app/admin/_layout.tsx`**: Apply RAM-only mode
- **`app.json`**: Add Android FLAG_SECURE config
- **`context/AppContext.tsx`**: Flush on background event

### 4.5 DPDP Compliance (`server/routes.ts`) — MODIFY

**What it does**: When citizens submit Civic Anomaly reports, their device identifiers are stripped at the API Gateway. Data enters analytics purely as geo-coordinates + timestamp — total privacy.

**SAHASRA Reference**: "Citizen Anonymity (DPDP Section 8) — device identifiers are stripped at the API Gateway."

```typescript
// In server/routes.ts, add middleware:
function stripPII(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/complaints' && req.method === 'POST') {
    // Remove deviceId, phone, name from analytics payload
    // Store only: geo, category, timestamp, district
  }
  next();
}
```

**Files affected**:
- **`server/routes.ts`**: Add `stripPII` middleware for analytical endpoints
- **`server/storage.ts`**: Add anonymous complaint storage for analytics

---

## 5. Phase 4: Zero-Crush UI Overhaul

### 5.1 OmniFAB (`components/OmniFAB.tsx`) — NEW

**What it does**: A massive, pulsating floating action button anchored at bottom-center. Tap opens quick-action menu. Hold activates voice AI. Visible on every screen.

**SAHASRA Reference**: "OmniFAB: Massive pulsating button anchored at bottom-center. Tap: quick-action menu. Hold: voice AI."

```typescript
// Behavior:
// - Always visible, bottom-center, z-index 999
// - Pulsating animation (Animated.loop with Animated.sequence)
// - Tap → action sheet with: File Complaint | SOS | AI Assistant | Map
// - Long press → activate Voice AI
// - Color: Saffron #FF9933 with white icon
```

**Files affected**:
- **`components/OmniFAB.tsx`**: NEW
- **`app/_layout.tsx`**: Mount OmniFAB globally
- **`app/(tabs)/_layout.tsx`**: Ensure FAB is above tab bar

### 5.2 DynamicBottomSheet (`components/DynamicBottomSheet.tsx`) — NEW

**What it does**: Replaces traditional page navigation for detail views. All suspect profiles, case details, and forms slide up as bottom sheets occupying 40-80% of screen. Map stays visible above.

**SAHASRA Reference**: "All suspect profiles, case details, and forms slide up from the bottom, occupying 40% to 80% of the screen. The top of the screen always shows the map context."

```typescript
// Props:
// - snapPoints: [0.4, 0.8] (40% or 80% of screen height)
// - children: content to show in sheet
// - onClose: callback
// - showHandle: boolean (drag handle at top)

// Uses: react-native-reanimated + react-native-gesture-handler
// Already in package.json!
```

**Files affected**:
- **`components/DynamicBottomSheet.tsx`**: NEW
- **`app/(tabs)/map.tsx`**: Replace modal navigation with bottom sheets
- **`app/admin/alerts.tsx`**: Replace full-screen alert details with sheet
- **`app/(tabs)/complaints.tsx`**: Show complaint detail as sheet

### 5.3 HapticGeoMarker (`components/HapticGeoMarker.tsx`) — NEW

**What it does**: Map pins that trigger native device vibrations. As an officer approaches a known hotspot, the marker triggers heartbeat-style vibration via `expo-haptics`.

**SAHASRA Reference**: "HapticGeoMarker triggers a heartbeat-style vibration in their pocket via the expo-haptics API."

```typescript
// Logic:
// - Renders a map marker (circle/pin on the map)
// - Calculates distance from user's current GPS to marker
// - If distance < threshold (e.g., 500m), trigger haptic pulse
// - Pulse intensity increases as distance decreases
// - Colors: Red = active hotspot, Blue = police station, Green = safe zone
```

**Files affected**:
- **`components/HapticGeoMarker.tsx`**: NEW
- **`app/(tabs)/map.tsx`**: Replace standard Markers with HapticGeoMarker
- **`components/UttarakhandMap.tsx`**: Integrate haptic markers

### 5.4 NeonStatusCard (`components/NeonStatusCard.tsx`) — NEW

**What it does**: High-contrast UI elements on pure black #000000 background (saves OLED battery). Colors strictly semantic: Red (Danger/Hotspot), Blue (Active Dispatch), Green (Resolved).

**SAHASRA Reference**: "High-contrast UI elements on a pure black #000000 background. Colors are strictly semantic: Red (Danger/Hotspot), Blue (Active Dispatch), Green (Resolved)."

```typescript
// Props:
// - type: 'danger' | 'dispatch' | 'resolved' | 'info' | 'warning'
// - title: string
// - subtitle?: string
// - action?: { label: string, onPress: () => void }
// - loading?: boolean (shows pulse animation)

// Styles:
// - Background: pure #000000
// - Border: 1px solid semantic color with glow effect
// - Text: white with semantic accent
// - Icons: semantic color
```

**Files affected**:
- **`components/NeonStatusCard.tsx`**: NEW
- **`constants/colors.ts`**: Add semantic color palette
- **`components/StatCard.tsx`**: Deprecate — replace with NeonStatusCard
- **`components/StatusBadge.tsx`**: Deprecate — replace with NeonStatusCard
- **`components/ComplaintCard.tsx`**: Rewrite using NeonStatusCard
- **`components/SOSAlertCard.tsx`**: Rewrite using NeonStatusCard
- **`app/(tabs)/index.tsx`**: Replace stat cards with NeonStatusCards

### 5.5 SafetyScorePathing (`components/SafetyScorePathing.tsx`) — NEW

**What it does**: On the map, shows two route options: "Safest Route" (well-lit, high police presence) in green vs "Fastest Route" in blue. Uses HotspotDetector agent data + road lighting data.

**SAHASRA Reference**: "SafetyScorePathing: Shows the Safest Route (well-lit, high capable guardianship) highlighted in green, versus the Fastest Route."

```typescript
// Input: startGeo, endGeo, timeOfDay
// Process:
// 1. Fetch route from Mapbox/OSRM (free routing API)
// 2. Overlay hotspot zones from HotspotDetector agent
// 3. Score each road segment: lighting + historical crime + patrol presence
// 4. Compute 2 routes: safest (max score) vs fastest (min distance)
// 5. Render both on map with color coding

// FREE: OpenStreetMap Routing API (OSRM) — no API key needed
```

**Files affected**:
- **`components/SafetyScorePathing.tsx`**: NEW
- **`app/(tabs)/map.tsx`**: Add routing controls
- **`app/(tabs)/sos.tsx`**: Show safest route to nearest police station

### 5.6 StealthSOSOverlay (`components/StealthSOSOverlay.tsx`) — NEW

Already covered in Phase 2.3 — but the UI component is here.

### 5.7 HeatmapLayer (`components/HeatmapLayer.tsx`) — NEW

**What it does**: Renders DBSCAN clusters as pulsing heatmap circles on the Leaflet map. Each circle size = cluster density, opacity = severity level.

**SAHASRA Reference**: "LiveHeatmapLayer: Renders pulsing DBSCAN clusters in real-time."

```typescript
// Props:
// - zones: RiskZone[] (from HotspotDetector agent via WebSocket)
// - onZonePress: (zone) => void

// Uses: Leaflet circle overlays with animated opacity
// Colors: Red (crime), Blue (flood), Green (garbage), Amber (infrastructure)
```

### 5.8 AkkaPadeTracker (`components/AkkaPadeTracker.tsx`) — NEW

**What it does**: Toggle to share the citizen's commute live with the nearest Women's Safety patrol unit. Patrol van sees the citizen's GPS and can track progress.

**SAHASRA Reference**: "AkkaPadeTracker: A toggle to share the commute live with the nearest Women's Safety patrol unit until the citizen arrives home safely."

```typescript
// Flow:
// 1. Citizen sets destination
// 2. Toggle "Share with Akka Pade" ON
// 3. GPS shared with nearest women safety patrol van
// 4. Officer sees citizen's route + live location
// 5. Auto-disables when citizen arrives at destination
```

**Files affected**:
- **`components/AkkaPadeTracker.tsx`**: NEW
- **`app/(tabs)/map.tsx`**: Add tracker to route view
- **`server/routes.ts`**: Add patrol sharing endpoints

---

## 6. Phase 5: Web Portal Upgrades

### 6.1 Agent Dashboard (`server/web/portal.html`) — MODIFY

Add a new panel to the admin portal showing:
- All 7 agent statuses (online/offline/error)
- Agent processing queue depth
- Last agent responses
- Manual override buttons

### 6.2 Live Heatmap (`server/web/cpr.html`) — MODIFY

Add DBSCAN heatmap layer to the CPR command portal:
- Real-time pulsing clusters
- Filter by type (crime/flood/garbage)
- Temporal slider (show data from last 1hr, 6hr, 24hr)

### 6.3 SOS Live Stream (`server/web/portal.html`) — MODIFY

Add WebRTC stream viewer for active SOS alerts:
- Live video feed from citizen
- Audio level indicator
- Recording status

### 6.4 Patrol Dispatch View (`server/web/pcr.html`) — MODIFY

Show optimized patrol routes generated by DispatchOptimizer agent:
- Recommended patrol path
- High-risk areas to cover
- Officer shift tracking

---

## 7. Package Dependencies

### New NPM Packages Required

```json
{
  "dependencies": {
    // Offline-First
    "expo-sqlite": "~15.2.0",          // SQLite for offline queue
    "@op-engineering/op-sqlite": "^11.0.0", // Better SQLite for RN
    
    // WebRTC
    "react-native-webrtc": "^124.0.0",     // WebRTC native
    "react-native-callkeep": "^4.0.0",     // Call UI for SOS
    
    // Edge AI
    "onnxruntime-react-native": "^1.20.0", // ONNX Runtime for YOLO
    
    // Vector DB / RAG
    "@xenova/transformers": "^2.17.0",     // Free local embeddings
    "chromadb": "^1.10.0",                  // Vector database
    
    // Voice
    "react-native-voice": "^0.3.0",        // Voice recognition
    
    // Security
    "expo-device": "~7.0.6",               // Device ID for MAC binding
    "expo-crypto": "~14.1.2",              // Cryptographic hashing
    
    // Performance
    "protobufjs": "^7.4.0",                // Protobuf serialization
    
    // UI
    "@gorhom/bottom-sheet": "^5.1.0"       // Bottom sheets (native)
  }
}
```

### FREE AI Models (all open-source, no API key needed)

| Model | Size | Use | Source |
|-------|------|-----|--------|
| YOLOv5 Nano | ~4MB ONNX | Object detection in complaint photos | ultralytics/yolov5 |
| YOLOv8 Nano | ~6MB ONNX | Object detection (newer) | ultralytics/ultralytics |
| IndicWav2Vec | ~50MB ONNX | Hindi/Kannada speech recognition | ai4bharat/indicwav2vec |
| Gemma-2-9B (via Groq FREE) | — | Intent routing (30k req/day free) | groq.com |
| BGE Small Embeddings | ~30MB ONNX | Local text embeddings | BAAI/bge-small-en-v1.5 |

---

## 8. Implementation Order

### Week 1: Core Multi-Agent Backend
```
Day 1:  server/agents/index.ts + IntentRouter.ts (orchestrator + intent parser)
Day 2:  server/agents/ComplaintClassifier.ts (NLP classification upgrade)
Day 3:  server/agents/HotspotDetector.ts + lib/dbscan.ts (DBSCAN clustering)
Day 4:  server/agents/KnowledgeBase.ts + server/vector-store/ (RAG pipeline)
Day 5:  server/agents/DispatchOptimizer.ts (smart dispatch)
Day 6:  server/routes.ts wiring + migrate old routes to agents
Day 7:  Testing + WebSocket integration for agent events
```

### Week 2: Offline-First + Streaming
```
Day 1:  lib/offline-queue.ts + expo-sqlite setup
Day 2:  context/AppContext.tsx offline wrapper
Day 3:  server/streaming/webrtc.ts + lib/webrtc-client.ts
Day 4:  components/StealthSOSOverlay.tsx
Day 5:  Integrate WebRTC into SOS flow
Day 6:  components/OfflineQueueBadge.tsx
Day 7:  Testing (airplane mode + SOS scenarios)
```

### Week 3: Edge AI + Security
```
Day 1:  components/AiPhotoAnalyzer.tsx (YOLO setup)
Day 2:  Integrate photo analysis into complaint flow
Day 3:  components/VoiceCommandButton.tsx (IndicWav2Vec)
Day 4:  context/AuthContext.tsx MAC binding
Day 5:  lib/knox-secure.ts + RAM-only admin rendering
Day 6:  server/routes.ts DPPD compliance middleware
Day 7:  Testing (admin security, device binding)
```

### Week 4: Zero-Crush UI Overhaul
```
Day 1:  components/OmniFAB.tsx + global mount
Day 2:  components/DynamicBottomSheet.tsx + migrate modals
Day 3:  components/NeonStatusCard.tsx + rewrite stat cards
Day 4:  components/HapticGeoMarker.tsx + map migration
Day 5:  components/SafetyScorePathing.tsx + routing
Day 6:  components/HeatmapLayer.tsx + AkkaPadeTracker.tsx
Day 7:  constants/colors.ts palette update + polish
```

### Week 5: Web Portals + Final Integration
```
Day 1:  server/web/portal.html agent dashboard
Day 2:  server/web/cpr.html heatmap + live stream
Day 3:  server/web/pcr.html dispatch optimization view
Day 4:  scripts/seed-vector-db.ts + data seeding
Day 5:  End-to-end testing + bug fixes
Day 6:  Performance optimization + bundle size reduction
Day 7:  Documentation + demo preparation
```

---

## Summary: What Changes vs What Stays

| Component | Status |
|-----------|--------|
| `server/index.ts` | **MODIFY** — add agent route mounting |
| `server/routes.ts` | **MODIFY** — delegate to agents, add security |
| `server/storage.ts` | **MODIFY** — add agent data + DPDP methods |
| `server/web/*.html` | **MODIFY** — add agent views + heatmap |
| `app/(tabs)/*.tsx` | **MODIFY** — integrate new components |
| `app/admin/*.tsx` | **MODIFY** — add agent dashboard, WebRTC |
| `context/AppContext.tsx` | **MODIFY** — offline wrapper + agent state |
| `context/AuthContext.tsx` | **MODIFY** — MAC binding |
| `constants/colors.ts` | **MODIFY** — semantic palette |
| `components/*.tsx` | **NEW 10 files** + rewrite 4 existing |
| `server/agents/*.ts` | **NEW 8 files** — multi-agent system |
| `server/streaming/*.ts` | **NEW 2 files** — WebRTC |
| `server/vector-store/*` | **NEW** — RAG pipeline |
| `lib/dbscan.ts` | **NEW** — clustering algorithm |
| `lib/offline-queue.ts` | **NEW** — offline sync |
| `lib/webrtc-client.ts` | **NEW** — WebRTC client |
| `lib/knox-secure.ts` | **NEW** — security utilities |
| `public/models/*.onnx` | **NEW** — AI model files |
| `scripts/seed-vector-db.ts` | **NEW** — data seeder |
| `shared/schema.ts` | **MODIFY** — add agent tables |
| `package.json` | **MODIFY** — add 15+ packages |
| All other files | **NO CHANGE** — existing functionality preserved |

---

*End of Blueprint — Ready for implementation*
