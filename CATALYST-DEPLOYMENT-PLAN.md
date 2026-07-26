# KSP Datathon 2026 — Catalyst Deployment & Implementation Plan

## Platform: Zoho Catalyst (Mandatory)
## App: SAHASRA Crime Intelligence & Analytical Platform

---

## 1. Understanding Catalyst Architecture

Zoho Catalyst is the **mandatory** deployment platform. Here's how our app maps to Catalyst services:

| Our Component | Catalyst Service | Notes |
|--------------|-----------------|-------|
| **Frontend (React web app)** | **Slate** — Frontend hosting, auto-builds React/Vite, gives public URL | Deploy the web build, NOT React Native mobile |
| **Backend API** | **AppSail** — PaaS for full Express/Node.js apps (recommended) OR **Functions** (serverless) | AppSail is easier — deploy the whole Express server as-is |
| **Crime Database** | **Catalyst Data Store** — Relational DB with ZCQL | Migrate from in-memory to Catalyst Data Store tables |
| **Authentication** | **Catalyst Auth** — Built-in user management + SSO | Replace custom JWT with Catalyst Auth |
| **AI/ML** | **QuickML** — LLM serving (GLM 4.7), RAG, AutoML, text analytics | Replace OpenAI/Groq with Catalyst QuickML |
| **Scheduled Tasks** | **Catalyst Cron** — Cron job triggers | For DBSCAN clustering, predictive model refresh |
| **File Storage** | **Catalyst Stratus** — Object storage | For complaint photos, audio evidence |
| **Notifications** | **Catalyst Notification** — Push/email/SMS | Replace Expo push notifications |
| **CI/CD** | **Catalyst Pipelines** — Auto-deploy from GitHub | Connect GitHub repo for auto-deploy |

### Two Deployment Approaches:

**Approach A (Recommended): AppSail + Slate**
- Deploy existing Express.js backend as AppSail (PaaS — runs your full app)
- Deploy React web frontend as Slate (static hosting)
- Fastest path to deployment — minimal code changes

**Approach B (Pure Serverless): Functions + Slate**
- Rewrite each API route as individual Catalyst Functions (Node.js)
- More complex but better alignment with Catalyst's serverless model
- Required if AppSail has limitations

**We'll use Approach A** — AppSail supports Node.js/Express natively with containerized deployment.

---

## 2. Project Restructuring for Catalyst

### New Directory Structure

```
sahasp-ksp-catalyst/
├── catalyst/                    # Catalyst CLI config
│   ├── catalyst.json            # Project configuration
│   └── functions/               # (optional) Catalyst Functions
│
├── backend/                     # Express.js backend → AppSail
│   ├── package.json
│   ├── server/
│   │   ├── index.ts             # [MODIFY] Add Catalyst middleware
│   │   ├── routes.ts            # [MODIFY] Connect to Catalyst Data Store
│   │   ├── catalyst-storage.ts  # [NEW] Catalyst Data Store client
│   │   ├── crime-models.ts      # [NEW] Crime data models
│   │   ├── seed-crime-data.ts   # [NEW] Seed 100K synthetic records
│   │   ├── agents/              # [NEW] Multi-agent AI system
│   │   └── web/                 # [EXISTING] HTML portal files
│   └── Dockerfile               # [NEW] For AppSail deployment
│
├── frontend/                    # React web app → Slate
│   ├── package.json
│   ├── vite.config.ts           # [NEW] Vite build config
│   ├── src/
│   │   ├── App.tsx              # [NEW] React app entry
│   │   ├── components/          # Components from existing project
│   │   ├── pages/
│   │   │   ├── CrimeDashboard/  # Main crime analytics dashboard
│   │   │   ├── LiveMap/         # Geospatial crime map
│   │   │   ├── LinkAnalysis/    # Network graph visualization
│   │   │   ├── Predictive/      # AI prediction dashboard
│   │   │   ├── SOS/             # Emergency response
│   │   │   └── Admin/           # Police command center
│   │   └── catalyst-auth.ts     # [NEW] Catalyst Auth integration
│   └── index.html
│
├── database/                    # Catalyst Data Store schemas
│   └── schema.zcql             # [NEW] ZCQL table definitions
│
├── .github/
│   └── workflows/
│       └── catalyst-deploy.yml  # [NEW] Auto-deploy pipeline
│
└── catalyst-deploy.sh           # [NEW] Deployment script
```

---

## 3. Phase 1: Catalyst Environment Setup (Day 1)

### Step 1: Install Catalyst CLI
```bash
npm install -g zcatalyst-cli
```

### Step 2: Create Catalyst Project
```bash
# Login to Zoho
catalyst login

# Initialize project
mkdir sahasra-ksp && cd sahasra-ksp
catalyst init

# Select components:
# - AppSail (for backend Express app)
# - Slate (for frontend React app)
# - Data Store (for crime database)
```

### Step 3: Configure Catalyst Data Store

**File: `database/schema.zcql`** — Crime database tables

```sql
-- CATALYST DATA STORE SCHEMA (ZCQL)

-- 1. Crime Incidents Table
CREATE TABLE CrimeIncidents (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  firNumber VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  beat VARCHAR(100),
  jurisdiction VARCHAR(100),
  district VARCHAR(50) NOT NULL,
  ward VARCHAR(100),
  occurredAt DATETIME NOT NULL,
  reportedAt DATETIME NOT NULL,
  dayOfWeek INT,
  timeSlot VARCHAR(30),
  status VARCHAR(30) DEFAULT 'under_investigation',
  severity VARCHAR(20),
  modusOperandi TEXT,
  propertyLost DECIMAL(15,2),
  victimCount INT DEFAULT 0,
  suspectCount INT DEFAULT 0,
  arrestedCount INT DEFAULT 0,
  investigatingOfficer VARCHAR(100),
  ioiPhone VARCHAR(20),
  evidenceCount INT DEFAULT 0,
  cctvAvailable BOOLEAN DEFAULT FALSE,
  forensicsRequired BOOLEAN DEFAULT FALSE,
  isRepeatLocation BOOLEAN DEFAULT FALSE,
  isRepeatOffender BOOLEAN DEFAULT FALSE,
  responseTimeMinutes INT,
  aiRiskScore DECIMAL(5,2) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suspects Table
CREATE TABLE Suspects (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  aliases TEXT,
  age INT,
  gender VARCHAR(10),
  identification VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  criminalHistory BOOLEAN DEFAULT FALSE,
  priorArrests INT DEFAULT 0,
  knownAssociates TEXT,
  modusOperandi TEXT,
  photoUrl VARCHAR(500),
  riskLevel VARCHAR(20) DEFAULT 'low',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crime-Suspect Link Table (Many-to-Many)
CREATE TABLE CrimeSuspectLinks (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  crimeId BIGINT NOT NULL,
  suspectId BIGINT NOT NULL,
  role VARCHAR(50), -- 'primary', 'accomplice', 'associate'
  FOREIGN KEY (crimeId) REFERENCES CrimeIncidents(ROWID),
  FOREIGN KEY (suspectId) REFERENCES Suspects(ROWID)
);

-- 4. Police Stations Table
CREATE TABLE PoliceStations (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  district VARCHAR(50) NOT NULL,
  jurisdiction VARCHAR(100),
  officerCount INT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Patrol Vans Table
CREATE TABLE PatrolVans (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  vanNumber VARCHAR(30) NOT NULL,
  officerInCharge VARCHAR(100),
  officerPhone VARCHAR(20),
  district VARCHAR(50),
  zone VARCHAR(100),
  status VARCHAR(30) DEFAULT 'active_patrol',
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  shift VARCHAR(10),
  isWomenSafetyUnit BOOLEAN DEFAULT FALSE,
  crewCount INT DEFAULT 3,
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. SOS Alerts Table
CREATE TABLE SOSAlerts (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  district VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  triggeredBy VARCHAR(100),
  triggeredByPhone VARCHAR(20),
  nearestPoliceStation VARCHAR(100),
  policeDistance DECIMAL(10,2),
  isWomenSafety BOOLEAN DEFAULT FALSE,
  audioUrl VARCHAR(500),
  resolvedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Risk Zones (Computed by DBSCAN)
CREATE TABLE RiskZones (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  centerLat DECIMAL(10,7) NOT NULL,
  centerLng DECIMAL(10,7) NOT NULL,
  radius DECIMAL(10,2) NOT NULL,
  crimeCount INT DEFAULT 0,
  density DECIMAL(10,4),
  category VARCHAR(50),
  severity VARCHAR(20),
  district VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crime Trends (Time Series)
CREATE TABLE CrimeTrends (
  ROWID BIGINT PRIMARY KEY AUTO_INCREMENT,
  district VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  count INT DEFAULT 0,
  avgResponseTime DECIMAL(10,2),
  clearanceRate DECIMAL(5,2),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for geospatial queries
CREATE INDEX idx_crime_location ON CrimeIncidents(district, latitude, longitude);
CREATE INDEX idx_crime_time ON CrimeIncidents(occurredAt);
CREATE INDEX idx_crime_category ON CrimeIncidents(category);
CREATE INDEX idx_sos_status ON SOSAlerts(status);
CREATE INDEX idx_patrol_district ON PatrolVans(district, status);
```

### Step 4: Catalyst Auth Setup

```typescript
// frontend/src/catalyst-auth.ts
import { CatalystAuth } from 'zcatalyst-sdk-node';

// Initialize Catalyst Auth for the project
// This handles:
// - User registration (officer accounts)
// - Login with JWT tokens
// - Role-based access (admin, officer, citizen)
// - Session management

// Integration with existing login flow:
// Replace phone+pin login with:
// CatalystAuth.signIn(username, password)
// → Returns JWT token → stored in localStorage
// → All API calls include Bearer token
```

---

## 4. Phase 2: Backend — Catalyst Data Store Integration (Days 2-3)

### File: `backend/server/catalyst-storage.ts` — NEW

This replaces `server/storage.ts` with Catalyst Data Store queries.

```typescript
import catalyst from 'zcatalyst-sdk-node';

class CatalystCrimeStore {
  private app: any;

  constructor() {
    this.app = catalyst.initialize();
  }

  // ── CRIME INCIDENTS ──

  async getCrimes(filters: CrimeFilter): Promise<CrimeIncident[]> {
    const table = this.app.datastore().table('CrimeIncidents');
    
    let query = `SELECT * FROM CrimeIncidents WHERE 1=1`;
    const params: any[] = [];
    
    if (filters.district) {
      query += ` AND district = ?`;
      params.push(filters.district);
    }
    if (filters.category) {
      query += ` AND category = ?`;
      params.push(filters.category);
    }
    if (filters.from) {
      query += ` AND occurredAt >= ?`;
      params.push(filters.from);
    }
    if (filters.to) {
      query += ` AND occurredAt <= ?`;
      params.push(filters.to);
    }
    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }
    
    query += ` ORDER BY occurredAt DESC LIMIT 1000`;
    
    return await table.query(query, params);
  }

  async getCrimeById(id: number): Promise<CrimeIncident> {
    const table = this.app.datastore().table('CrimeIncidents');
    const result = await table.getRow(id);
    return result;
  }

  async createCrime(data: CreateCrimeInput): Promise<CrimeIncident> {
    const table = this.app.datastore().table('CrimeIncidents');
    return await table.insertRow(data);
  }

  // ── GEOSPATIAL QUERIES ──

  async getCrimesInRadius(centerLat: number, centerLng: number, radiusKm: number): Promise<CrimeIncident[]> {
    const table = this.app.datastore().table('CrimeIncidents');
    // Approximate: 1 degree ≈ 111km
    const deg = radiusKm / 111;
    const query = `
      SELECT * FROM CrimeIncidents 
      WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND status NOT IN ('closed', 'solved')
    `;
    return await table.query(query, [
      centerLat - deg, centerLat + deg,
      centerLng - deg, centerLng + deg
    ]);
  }

  // ── CRIME STATISTICS ──

  async getCrimeStats(district: string): Promise<CrimeStats> {
    const table = this.app.datastore().table('CrimeIncidents');
    
    const total = await table.query(
      `SELECT COUNT(*) as count FROM CrimeIncidents WHERE district = ?`, [district]
    );
    const byCategory = await table.query(`
      SELECT category, COUNT(*) as count 
      FROM CrimeIncidents 
      WHERE district = ?
      GROUP BY category 
      ORDER BY count DESC
    `, [district]);
    const today = await table.query(`
      SELECT COUNT(*) as count FROM CrimeIncidents 
      WHERE district = ? AND DATE(occurredAt) = CURRENT_DATE
    `, [district]);
    
    return {
      total: total[0]?.count || 0,
      byCategory,
      today: today[0]?.count || 0,
    };
  }

  // ── DBSCAN HOTSPOTS ──

  async getHotspots(district: string, algorithm: string = 'dbscan'): Promise<Hotspot[]> {
    if (algorithm === 'dbscan') {
      // 1. Fetch recent crime coordinates
      const crimes = await this.getCrimes({ 
        district, 
        from: hoursAgo(72),
        status: 'under_investigation'
      });
      
      // 2. Run DBSCAN clustering (server-side computation)
      const clusters = runDBSCAN(
        crimes.map(c => ({ lat: c.latitude, lng: c.longitude })),
        0.005,  // epsilon ≈ 500m
        3       // min points
      );
      
      // 3. Save clusters to RiskZones table
      for (const cluster of clusters) {
        await this.app.datastore().table('RiskZones').insertRow({
          centerLat: cluster.center.lat,
          centerLng: cluster.center.lng,
          radius: cluster.radius,
          crimeCount: cluster.points.length,
          density: cluster.density,
          category: this.getDominantCategory(cluster.points, crimes),
          severity: cluster.density > 10 ? 'high' : cluster.density > 5 ? 'medium' : 'low',
          district,
          isActive: true,
        });
      }
      
      return clusters;
    }
    
    // KDE alternative
    return this.runKDE(crimes);
  }

  // ── PREDICTIVE ANALYTICS ──

  async predictHotspots(district: string): Promise<Prediction[]> {
    // 1. Get 90-day crime history
    const history = await this.getCrimeTrends(district, 90);
    
    // 2. Decompose time series
    const decomposed = decomposeTimeSeries(history);
    
    // 3. Predict next 24h risk
    const beats = await this.getBeats(district);
    return beats.map(beat => ({
      beat: beat.name,
      lat: beat.lat,
      lng: beat.lng,
      riskLevel: this.computePredictedRisk(beat, decomposed),
      predictedCategories: ['chain_snatching', 'theft'],
      confidence: 0.78,
      recommendation: 'Deploy 2 additional patrol units between 8PM-12AM',
    }));
  }
}

export const catalystCrimeStore = new CatalystCrimeStore();
```

### Backend Migration: Express → Catalyst AppSail

**File: `backend/Dockerfile`** — For AppSail deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server/index.ts"]
```

**File: `backend/server/index.ts`** — Modified for Catalyst

```typescript
import express from 'express';
import catalyst from 'zcatalyst-sdk-node';
import { registerRoutes } from './routes';

const app = express();

// Initialize Catalyst SDK
const catalystApp = catalyst.initialize(app);

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  // Inject Catalyst app instance into request
  (req as any).catalystApp = catalystApp;
  next();
});

// Register all API routes
registerRoutes(app, catalystApp);

// AppSail provides PORT via environment variable
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 5000;
app.listen(port, () => {
  console.log(`SAHASRA KSP API running on port ${port}`);
});
```

---

## 5. Phase 3: Frontend — React Web App for Slate (Days 4-6)

### Migration Strategy

Since we can't deploy React Native to Catalyst Slate, we build a **React web application** that mirrors the mobile functionality. We'll reuse existing components and logic.

**File: `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### Key Pages (Reimplemented from App)

| Page | Route | Source from Existing | Key Features |
|------|-------|-------------------|--------------|
| **Login** | `/` | `app/(auth)/login.tsx` | Catalyst Auth integration |
| **Crime Dashboard** | `/dashboard` | `app/(tabs)/index.tsx` + crime analytics | Real-time KPIs, category breakdown, time analysis |
| **Live Crime Map** | `/map` | `app/(tabs)/map.tsx` | Leaflet with DBSCAN heatmap, 7 layers, temporal slider |
| **Link Analysis** | `/links` | NEW | Force-directed graph of suspect-victim-location connections |
| **Predictive Analytics** | `/predictive` | NEW | AI prediction charts, risk heatmap, trend forecasting |
| **SOS Command** | `/sos` | `app/admin/alerts.tsx` | Live SOS feed, patrol dispatch, WebRTC streams |
| **Admin War Room** | `/admin` | `app/admin/index.tsx` | Full crime command center |
| **Public Dashboard** | `/public` | `server/web/public.html` | Citizen-facing crime stats |
| **RTI Portal** | `/rti` | `app/(tabs)/rti.tsx` | AI-powered RTI filing |

### Live Crime Map Page (`frontend/src/pages/LiveMap/`)

This is the **centerpiece** — rebuilt using React + Leaflet with all crime-specific layers:

```typescript
// Core components:
// CrimeMap.tsx — Main map container with Leaflet
// HeatmapLayer.tsx — Gradient crime density overlay
// ClusterLayer.tsx — DBSCAN pulsing circles
// PatrolLayer.tsx — Live patrol van tracking via SSE
// TemporalSlider.tsx — Time-of-day filter (drag to see crime flow)
// FilterPanel.tsx — 7-layer toggle + category filter
// HotspotList.tsx — Sidebar listing detected hotspots

// Data flow:
// 1. On mount: GET /api/crime/incidents?district=bengaluru&lastHours=72
// 2. SSE connection: /api/sse/crime-updates (live crime feed)
// 3. Every 30s: GET /api/crime/hotspots (DBSCAN clusters)
// 4. Every 60s: GET /api/cpr/patrols (patrol van positions)
// 5. WebSocket: /ws for SOS alerts, emergency broadcasts
```

### Link Analysis Page (`frontend/src/pages/LinkAnalysis/`)

**NEW** — This is the Criminological Network & Link Analysis requirement:

```typescript
// Uses D3.js force-directed graph to visualize:
// - Nodes: Suspects (red), Victims (blue), Locations (green), Vehicles (gray)
// - Edges: Connections between entities
// - Click any node → drill-down panel shows full profile

// Query: GET /api/crime/links?suspectId=123
// Returns all connected entities across jurisdictions

// Features:
// - Zoom/pan on graph
// - Highlight path between any two nodes
// - Filter by crime type, time period, jurisdiction
// - Auto-layout with force simulation
// - Export as PNG for reports
```

### Predictive Analytics Page (`frontend/src/pages/Predictive/`)

**NEW** — AI-driven prediction dashboard:

```typescript
// Components:
// RiskHeatmap.tsx — Catalyst-generated risk scores overlaid on map
// TrendChart.tsx — 90-day crime trend with forecast line
// AnomalyFeed.tsx — Live anomaly alerts (Z-score deviations)
// SocioEconomicPanel.tsx — Crime overlay with population/urbanization data
// RecommendationCard.tsx — AI-suggested patrol deployments

// Data:
// GET /api/crime/predict?district=bengaluru
// GET /api/crime/trends?district=bengaluru&days=90
// GET /api/crime/anomalies?lastHours=24
// GET /api/socioeconomic/data?district=bengaluru
```

---

## 6. Phase 4: Catalyst AI Integration (Days 7-8)

### Replace External AI with Catalyst QuickML

**Current**: OpenAI + Groq + NVIDIA → **New**: Catalyst QuickML

```typescript
// catalyst-ai.ts
import catalyst from 'zcatalyst-sdk-node';

class CatalystAIService {
  private app: any;

  constructor() {
    this.app = catalyst.initialize();
  }

  // ── LLM FOR CRIME ANALYSIS ──
  // Uses Catalyst QuickML's GLM 4.7 model
  async analyzeCrimeDescription(description: string): Promise<CrimeAnalysis> {
    const llm = this.app.quickML().llm();
    
    const prompt = `You are a KSP crime analyst. Analyze this crime description and extract:
    - category (one of: murder, theft, assault, chain_snatching, vehicle_theft, etc.)
    - severity (heinous, grave, petty)
    - modus operandi keywords
    - weapons involved
    - time of day inference
    
    Description: "${description}"
    
    Return ONLY valid JSON.`;
    
    const response = await llm.generate({
      model: 'GLM 4.7',
      prompt,
      temperature: 0.1,
      maxTokens: 200,
    });
    
    return JSON.parse(response.text);
  }

  // ── RAG FOR CRIME KNOWLEDGE ──
  // Query KSP documents, IPC sections, SOPs
  async queryKnowledgeBase(query: string): Promise<string> {
    const rag = this.app.quickML().rag();
    
    // Upload KSP documents to Catalyst Knowledge Base
    // Then query with retrieval-augmented generation
    
    const response = await rag.query({
      documentId: process.env.KSP_KNOWLEDGE_BASE_ID,
      query: query,
      maxTokens: 500,
    });
    
    return response.text;
  }

  // ── TEXT ANALYTICS (Zia) ──
  // Extract entities, classify, sentiment
  async extractEntites(text: string): Promise<ExtractedEntities> {
    const zia = this.app.quickML().textAnalytics();
    
    const entities = await zia.extractEntities(text);
    const classification = await zia.classify(text, [
      'violent_crime', 'property_crime', 'cyber_crime', 'traffic', 'other'
    ]);
    
    return { entities, classification };
  }

  // ── AUTO ML FOR PREDICTION ──
  // Train and deploy crime prediction model
  async trainPredictionModel(dataset: CrimeTrainingData[]): Promise<string> {
    const autoML = this.app.quickML().autoML();
    
    const model = await autoML.createModel({
      name: 'crime-risk-predictor',
      type: 'regression',
      targetColumn: 'riskScore',
      features: [
        'hourOfDay', 'dayOfWeek', 'district', 'category',
        'distanceToNearestPolice', 'populationDensity',
        'cctvDensity', 'previousCrimeCount'
      ],
      trainingData: dataset,
    });
    
    await model.train();
    
    return model.id; // Use for predictions
  }
}
```

### Catalyst Cron for Automated Clustering

```typescript
// Catalyst Cron job — runs every 15 minutes
// File: backend/cron/dbscan-clustering.js

exports.handler = async (event, context) => {
  const catalyst = require('zcatalyst-sdk-node');
  const app = catalyst.initialize();
  
  // 1. Fetch recent crimes (last 72 hours)
  const crimes = await app.datastore().table('CrimeIncidents')
    .query(`SELECT * FROM CrimeIncidents WHERE occurredAt >= NOW() - INTERVAL 72 HOUR`);
  
  // 2. Run DBSCAN per district
  const districts = [...new Set(crimes.map(c => c.district))];
  
  for (const district of districts) {
    const districtCrimes = crimes.filter(c => c.district === district);
    const coordinates = districtCrimes.map(c => ({
      lat: c.latitude,
      lng: c.longitude,
    }));
    
    const clusters = runDBSCAN(coordinates, 0.005, 3);
    
    // 3. Clear old risk zones
    await app.datastore().table('RiskZones')
      .query(`DELETE FROM RiskZones WHERE district = ?`, [district]);
    
    // 4. Insert new clusters
    for (const cluster of clusters) {
      await app.datastore().table('RiskZones').insertRow({
        centerLat: cluster.center.lat,
        centerLng: cluster.center.lng,
        radius: cluster.radius,
        crimeCount: cluster.points.length,
        density: cluster.density,
        district,
        isActive: true,
      });
    }
  }
  
  return { status: 'success', clustersGenerated: districts.length };
};
```

---

## 7. Phase 5: Seed 100K Synthetic Crime Records (Day 9)

### File: `backend/scripts/seed-catalyst-db.js`

```javascript
// Seed 100,000 synthetic crime records into Catalyst Data Store
// Uses realistic Bengaluru crime patterns

const catalyst = require('zcatalyst-sdk-node');

// Bangalore police jurisdictions (real data)
const JURISDICTIONS = [
  { name: 'Central Division', stations: ['Town Hall', 'Cubbon Park', 'Upparpet', 'Cottonpet'] },
  { name: 'East Division', stations: ['Whitefield', 'HAL Airport', 'Indiranagar', 'Jeevan Bima Nagar'] },
  { name: 'West Division', stations: ['Yeshwanthpur', 'Peenya', 'Rajajinagar', 'Vijayanagar'] },
  { name: 'South Division', stations: ['Koramangala', 'Jayanagar', 'Banashankari', 'BSK'] },
  { name: 'North Division', stations: ['Hebbal', 'Yelahanka', 'RT Nagar', 'Sadashivanagar'] },
  { name: 'Southeast', stations: ['Electronic City', 'HSR Layout', 'Bommanahalli', 'Madiwala'] },
  { name: 'Northeast', stations: ['KR Puram', 'Banaswadi', 'Horamavu'] },
  { name: 'Outer', stations: ['Devanahalli', 'Anekal', 'Nelamangala', 'Doddaballapur'] },
];

// Realistic crime patterns per category
const CRIME_PATTERNS = {
  chain_snatching: {
    timeSlots: ['EVENING(16-20)', 'NIGHT(20-0)'],
    locations: {
      'Koramangala': { weight: 0.15, coords: { lat: 12.9352, lng: 77.6245 } },
      'MG Road': { weight: 0.12, coords: { lat: 12.9719, lng: 77.5937 } },
      'Commercial Street': { weight: 0.10, coords: { lat: 12.9833, lng: 77.6069 } },
      'Jayanagar': { weight: 0.08, coords: { lat: 12.9250, lng: 77.5938 } },
      'Indiranagar': { weight: 0.08, coords: { lat: 12.9783, lng: 77.6400 } },
      'Brigade Road': { weight: 0.07, coords: { lat: 12.9700, lng: 77.6100 } },
      'Whitefield': { weight: 0.06, coords: { lat: 12.9698, lng: 77.7500 } },
      'HSR Layout': { weight: 0.05, coords: { lat: 12.9116, lng: 77.6389 } },
    },
    dayWeight: { 0: 1.8, 1: 0.6, 2: 0.5, 3: 0.5, 4: 0.6, 5: 1.4, 6: 1.9 },
    severity: 'grave',
  },
  vehicle_theft: {
    timeSlots: ['LATE_NIGHT(0-4)', 'NIGHT(20-0)'],
    locations: {
      'Yeshwanthpur': { weight: 0.12, coords: { lat: 12.9815, lng: 77.5399 } },
      'Peenya': { weight: 0.10, coords: { lat: 13.0267, lng: 77.5100 } },
      'Whitefield': { weight: 0.09, coords: { lat: 12.9698, lng: 77.7500 } },
      'Electronic City': { weight: 0.08, coords: { lat: 12.8399, lng: 77.6770 } },
      'KR Puram': { weight: 0.07, coords: { lat: 12.9980, lng: 77.7000 } },
    },
    dayWeight: { 0: 1.5, 1: 0.8, 2: 0.7, 3: 0.7, 4: 0.8, 5: 1.2, 6: 1.6 },
    severity: 'grave',
  },
  // ... 18 MORE CATEGORIES with realistic patterns
  // theft, burglary, assault, murder, robbery, dacoity, 
  // kidnapping, rape, sexual_harassment, cyber_crime, fraud,
  // rioting, drug_offense, weapons_act, domestic_violence,
  // eve_teasing, murder_attempt, dowry_death
};

async function seedDatabase() {
  const app = catalyst.initialize();
  const table = app.datastore().table('CrimeIncidents');
  
  const TOTAL_RECORDS = 100000;
  const BATCH_SIZE = 100;
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2026-06-30');
  
  console.log(`Seeding ${TOTAL_RECORDS} crime records...`);
  
  for (let batch = 0; batch < TOTAL_RECORDS / BATCH_SIZE; batch++) {
    const batchRows = [];
    
    for (let i = 0; i < BATCH_SIZE; i++) {
      const record = generateCrimeRecord(startDate, endDate);
      batchRows.push(record);
    }
    
    await table.insertRows(batchRows);
    
    if (batch % 50 === 0) {
      console.log(`  Progress: ${(batch * BATCH_SIZE / TOTAL_RECORDS * 100).toFixed(1)}%`);
    }
  }
  
  console.log('✅ Seeded 100,000 crime records');
}

function generateCrimeRecord(startDate, endDate) {
  // Pick random crime category weighted by real-world frequency
  const category = weightedPick(CRIME_FREQUENCIES);
  const pattern = CRIME_PATTERNS[category];
  
  // Pick location based on pattern weights
  const location = weightedPick(Object.entries(pattern.locations).map(([k, v]) => ({ key: k, weight: v.weight })));
  const locData = pattern.locations[location];
  
  // Pick time based on pattern time slots
  const timeSlot = pattern.timeSlots[Math.floor(Math.random() * pattern.timeSlots.length)];
  const occurredAt = generateTimeInSlot(timeSlot, startDate, endDate, pattern.dayWeight);
  
  // Generate FIR-like description
  const description = generateFIRDescription(category, location, occurredAt);
  
  return {
    firNumber: `KSP-${occurredAt.getFullYear()}-CR-${String(10000 + Math.floor(Math.random() * 90000))}`,
    category,
    description,
    latitude: locData.coords.lat + (Math.random() - 0.5) * 0.01,
    longitude: locData.coords.lng + (Math.random() - 0.5) * 0.01,
    district: 'Bengaluru Urban',
    beat: location,
    jurisdiction: getJurisdiction(location),
    occurredAt: occurredAt.toISOString(),
    reportedAt: new Date(occurredAt.getTime() + Math.random() * 7200000).toISOString(),
    dayOfWeek: occurredAt.getDay(),
    timeSlot,
    status: weightedPick([{ key: 'under_investigation', weight: 0.6 }, { key: 'solved', weight: 0.3 }, { key: 'closed', weight: 0.1 }]),
    severity: pattern.severity,
    modusOperandi: generateMO(category),
    victimCount: Math.floor(Math.random() * 2) + 1,
    suspectCount: Math.floor(Math.random() * 3),
    arrestedCount: Math.floor(Math.random() * 2),
    responseTimeMinutes: Math.floor(Math.random() * 30) + 5,
    aiRiskScore: Math.random() * 100,
  };
}

async function main() {
  console.log('Starting Catalyst DB Seed...');
  await seedDatabase();
  console.log('✅ Done!');
}

main().catch(console.error);
```

---

## 8. Phase 6: Deployment Pipeline (Day 10)

### File: `catalyst-deploy.sh`

```bash
#!/bin/bash
# SAHASRA KSP — Full Catalyst Deployment Script

echo "🚔 SAHASRA KSP — Catalyst Deployment"
echo "========================================"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

# Step 2: Build frontend
echo "🏗️ Building frontend..."
cd frontend && npm run build
cd ..

# Step 3: Set up Catalyst project
echo "⚙️ Configuring Catalyst..."
catalyst init --force

# Step 4: Deploy to Catalyst
echo "🚀 Deploying to Catalyst..."
catalyst deploy

echo "========================================"
echo "✅ Deployment complete!"
echo "📊 Frontend URL: https://<your-project>.onslate.in"
echo "🔌 Backend URL: https://<your-function>.catalystapps.io"
```

### File: `.github/workflows/catalyst-deploy.yml` — CI/CD Pipeline

```yaml
name: Deploy to Catalyst

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Catalyst CLI
        run: npm install -g zcatalyst-cli
      
      - name: Install backend dependencies
        run: cd backend && npm install
      
      - name: Install frontend dependencies
        run: cd frontend && npm install
      
      - name: Build frontend
        run: cd frontend && npm run build
      
      - name: Deploy to Catalyst
        env:
          CATALYST_TOKEN: ${{ secrets.CATALYST_TOKEN }}
          CATALYST_ORG: ${{ secrets.CATALYST_ORG }}
          PROJECT_ID: ${{ secrets.PROJECT_ID }}
        run: catalyst deploy --token $CATALYST_TOKEN --org $CATALYST_ORG --project $PROJECT_ID
```

---

## 9. Architecture Diagram (How It All Connects)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CATALYST PLATFORM                            │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  SLATE (Frontend Hosting)                                 │      │
│  │  ┌─────────────────────────────────────────────────────┐ │      │
│  │  │  React SPA (Vite + React 18)                        │ │      │
│  │  │                                                     │ │      │
│  │  │  /dashboard   → Crime Analytics Dashboard          │ │      │
│  │  │  /map         → Live Geospatial Crime Map           │ │      │
│  │  │  /links       → Criminological Network Analysis     │ │      │
│  │  │  /predictive  → AI Predictive Risk Dashboard        │ │      │
│  │  │  /sos         → SOS Command Center                  │ │      │
│  │  │  /admin       → Admin War Room                      │ │      │
│  │  │  /public      → Public Crime Dashboard              │ │      │
│  │  └─────────────────────────────────────────────────────┘ │      │
│  └──────────────────────────────────────────────────────────┘      │
│                              │ REST API + WebSocket                  │
│                              ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  AppSail (Backend PaaS) — Express.js + Node.js            │      │
│  │                                                          │      │
│  │  ┌──────────┐  ┌────────────┐  ┌───────────────────┐   │      │
│  │  │ Auth     │  │ Crime API  │  │ SOS/Emergency API │   │      │
│  │  │ Routes   │  │ Routes     │  │ Routes            │   │      │
│  │  └────┬─────┘  └──────┬─────┘  └────────┬──────────┘   │      │
│  │       │               │                  │              │      │
│  │  ┌────▼───────────────▼──────────────────▼──────────┐   │      │
│  │  │  Multi-Agent AI System                            │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │      │
│  │  │  │ Intent   │ │ Crime    │ │ Anomaly          │  │   │      │
│  │  │  │ Router   │ │ Predictor│ │ Detector         │  │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────────────┘  │   │      │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │   │      │
│  │  │  │ Dispatch │ │ Hotspot  │ │ Report           │  │   │      │
│  │  │  │Optimizer │ │ Detector │ │ Generator        │  │   │      │
│  │  │  └──────────┘ └──────────┘ └──────────────────┘  │   │      │
│  │  └──────────────────────────────────────────────────┘   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                              │                                      │
│  ┌───────────────────────────┴──────────────────────────┐          │
│  │  Catalyst Data Store (Relational DB)                  │          │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │          │
│  │  │ Crime    │ │ Suspects │ │ SOS      │ │ Risk    │ │          │
│  │  │Incidents │ │          │ │ Alerts   │ │ Zones   │ │          │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├─────────┤ │          │
│  │  │ Police   │ │ Patrol   │ │ Crime    │ │ Crime   │ │          │
│  │  │ Stations │ │ Vans     │ │ Trends   │ │ Suspect │ │          │
│  │  │          │ │          │ │(TimeSer) │ │ Links   │ │          │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │          │
│  └──────────────────────────────────────────────────────┘          │
│                              │                                      │
│  ┌───────────────────────────┴──────────────────────────┐          │
│  │  Catalyst AI Services (QuickML)                       │          │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │          │
│  │  │ LLM      │ │ RAG      │ │ Text Analytics (Zia) │  │          │
│  │  │(GLM 4.7) │ │Knowledge │ │ Entity Extraction    │  │          │
│  │  └──────────┘ │ Base     │ │ Classification       │  │          │
│  │               └──────────┘ └──────────────────────┘  │          │
│  │  ┌──────────────────────────────────────────────┐    │          │
│  │  │ AutoML — Crime Risk Prediction Model          │    │          │
│  │  └──────────────────────────────────────────────┘    │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  Catalyst Cron (Scheduled Tasks)                     │          │
│  │  ┌──────────────────┐ ┌──────────────┐ ┌──────────┐ │          │
│  │  │ DBSCAN Clustering│ │ Predictive   │ │ Anomaly   │ │          │
│  │  │ (Every 15 min)   │ │ Model Refresh│ │ Detection │ │          │
│  │  └──────────────────┘ └──────────────┘ └──────────┘ │          │
│  └──────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. Implementation Timeline (14 Days)

```
DAY   FOCUS                    DELIVERABLE
───  ───────────────────────  ─────────────────────────────────────
  1  Catalyst Setup           CLI install, project init, Data Store schema
  2  Crime Data Models        crime-models.ts, ZCQL tables, Catalyst Storage client
  3  Seed Data                100K synthetic crime records generator + script
  4  Backend API              Express → Catalyst AppSail migration, routes refactor
  5  Frontend Setup           Vite + React, Slate config, Catalyst Auth
  6  Live Crime Map           Leaflet map, 7 layers, DBSCAN heatmap, temporal slider
  7  Crime Dashboard          KPIs, charts, category breakdown, time analysis
  8  AI Integration           QuickML LLM, RAG, Text Analytics, AutoML setup
  9  Link Analysis            D3.js force-directed graph, entity connections
 10  Predictive Analytics     Risk scoring, trend forecasting, anomaly detection
 11  SOS + Patrol             Live SOS streaming, dispatch optimization, patrol tracking
 12  Public Dashboard         Citizen-facing crime stats, safe route planner
 13  Integration + Testing    End-to-end tests, demo prep, bug fixes
 14  DEPLOYMENT              catalyst deploy → submit URL
```

---

## 11. Winning Demo Checklist

### Must-Have (For Judging Criteria)

- [ ] **Deployed on Catalyst** with working public URL
- [ ] **100K+ synthetic crime records** with realistic Bengaluru data
- [ ] **Live geospatial map** with DBSCAN crime clusters (updates every 15 min via Cron)
- [ ] **Link analysis** showing suspect-victim-location connections
- [ ] **AI crime prediction** with risk scoring per beat
- [ ] **Anomaly detection** with visual alerts (Z-score deviations)
- [ ] **SOS emergency system** with live patrol dispatch
- [ ] **Catalyst Auth** for secure officer login

### Nice-to-Have (Differentiators)

- [ ] **Stealth SOS** — black screen silent streaming (wows judges)
- [ ] **On-device YOLO** — evidence photo analysis (in browser via TensorFlow.js)
- [ ] **Bilingual voice** — Web Speech API for Kannada/English queries
- [ ] **Socio-economic overlay** — crime correlation with population/urbanization data
- [ ] **Automated report generator** — daily crime brief PDF download

### Technical Requirements (Catalyst-Specific)

- [ ] All backend routes use **Catalyst Data Store** (ZCQL) — no in-memory storage
- [ ] Authentication uses **Catalyst Auth** — no custom JWT
- [ ] AI uses **Catalyst QuickML** — no OpenAI/Groq/NVIDIA
- [ ] Scheduled tasks use **Catalyst Cron** — no setInterval
- [ ] Frontend deployed via **Catalyst Slate** — not static hosting
- [ ] Backend deployed via **Catalyst AppSail** — not direct hosting
- [ ] CI/CD via **Catalyst Pipelines** (optional but recommended)

---

## 12. Critical Path & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Catalyst Data Store limits | May have row count limits | Batch inserts, use pagination |
| QuickML model training time | AutoML may take hours | Pre-train with smaller dataset, demo with pre-computed predictions |
| WebRTC not supported on Catalyst | Stealth SOS won't stream | Use polling-based location updates as fallback |
| React Native can't deploy to Slate | Mobile app not deployable | Build React web version as primary, show mobile as supplemental |
| 100K records insert time | May exceed timeout | Batch inserts (100 at a time), run as background job |
| D3.js performance with large graphs | Link analysis may lag | Limit to top 50 connections, use canvas rendering |

---

**Bottom line**: Migrate the backend to Catalyst AppSail (Express.js), frontend to Catalyst Slate (React), database to Catalyst Data Store (ZCQL), and AI to Catalyst QuickML (GLM 4.7 + AutoML). Seed 100K realistic crime records. The existing SANKALP AI code is the **functionality reference** — we rebuild for web + Catalyst, keeping the same logic but swapping out the platform dependencies.
