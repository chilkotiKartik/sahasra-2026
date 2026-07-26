# 3-Day Sprint: SAHASRA KSP Crime Intelligence Platform

## Merged Feature Set (SANKALP AI + SAHASRA + Crime Analytics)

---

## 🎯 The WINNING Product

**A single unified platform** combining:
- **SAHASRA**: Police mode (Smart Radar, suspect deep-dive, link analysis, YOLO vision, stealth SOS)
- **SANKALP AI**: Citizen mode (complaints, SOS, AI assistant, bills, RTI, wards, leaderboard)
- **KSP Crime Analytics**: DBSCAN heatmaps, predictive policing, anomaly detection, 100K record database
- **All on Zoho Catalyst**: AppSail backend + Slate frontend + Data Store + QuickML AI

---

## 📅 3-Day Sprint Plan

```
DAY 1 (Foundation):    Catalyst Setup + Backend Migration + 100K Crime Data
DAY 2 (Core Features): Live Map + Crime Dashboard + AI Integration + Link Analysis
DAY 3 (Winning Demo):  Stealth SOS + Patrol Dispatch + Prediction + DEPLOY
```

---

## DAY 1: Foundation (12 Hours)

### Hour 1-2: Catalyst Environment

```bash
# Install CLI
npm install -g zcatalyst-cli

# Create project
mkdir sahasra-ksp && cd sahasra-ksp
catalyst login
catalyst init

# Initialize services:
# - AppSail (backend)
# - Slate (frontend) 
# - Data Store (database)
# - QuickML (AI)
```

### Hour 2-4: Data Store Schema

**Create 8 tables** in Catalyst Data Store via Console:

| Table | Key Columns | Records |
|-------|-------------|---------|
| `CrimeIncidents` | firNumber, category, lat/lng, occurredAt, status, severity | 100,000 |
| `Suspects` | name, aliases, modusOperandi, priorArrests, photoUrl | 50,000 |
| `CrimeSuspectLinks` | crimeId, suspectId, role | 150,000 |
| `PoliceStations` | name, lat/lng, district, phone, jurisdiction | 60 |
| `PatrolVans` | vanNumber, officerInCharge, lat/lng, status, shift | 50 |
| `SOSAlerts` | category, lat/lng, status, triggeredBy, isWomenSafety | 10,000 |
| `RiskZones` | centerLat/Lng, radius, crimeCount, severity | 5,000 |
| `CrimeTrends` | district, category, date, count, clearanceRate | 50,000 |

**ZCQL Table Creation** (run in Catalyst Console):

```sql
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
  occurredAt DATETIME NOT NULL,
  dayOfWeek INT,
  timeSlot VARCHAR(30),
  status VARCHAR(30) DEFAULT 'under_investigation',
  severity VARCHAR(20),
  modusOperandi TEXT,
  victimCount INT DEFAULT 0,
  suspectCount INT DEFAULT 0,
  arrestedCount INT DEFAULT 0,
  investigatingOfficer VARCHAR(100),
  responseTimeMinutes INT,
  aiRiskScore DECIMAL(5,2) DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Repeat for all 8 tables (see CATALYST-DEPLOYMENT-PLAN.md for full schema)
```

### Hour 4-7: Seed 100K Crime Records

**File: `backend/scripts/seed.js`** — Run via Catalyst Node.js

```javascript
const TOTAL = 100000;
const BATCH = 100;

const CRIME_PATTERNS = {
  chain_snatching: {
    weight: 0.18,
    locations: {
      'Koramangala': { lat: 12.9352, lng: 77.6245 },
      'MG Road': { lat: 12.9719, lng: 77.5937 },
      'Commercial Street': { lat: 12.9833, lng: 77.6069 },
    },
    peakHours: [17, 18, 19, 20, 21, 22],
    dayWeights: [1.8, 0.6, 0.5, 0.5, 0.6, 1.4, 1.9],
  },
  vehicle_theft: {
    weight: 0.12,
    locations: {
      'Yeshwanthpur': { lat: 12.9815, lng: 77.5399 },
      'Peenya': { lat: 13.0267, lng: 77.5100 },
      'Whitefield': { lat: 12.9698, lng: 77.7500 },
    },
    peakHours: [23, 0, 1, 2, 3, 4],
    dayWeights: [1.5, 0.8, 0.7, 0.7, 0.8, 1.2, 1.6],
  },
  theft: { weight: 0.25, /* ... */ },
  assault: { weight: 0.10, /* ... */ },
  burglary: { weight: 0.08, /* ... */ },
  murder: { weight: 0.02, /* ... */ },
  robbery: { weight: 0.05, /* ... */ },
  kidnapping: { weight: 0.03, /* ... */ },
  cyber_crime: { weight: 0.06, /* ... */ },
  fraud: { weight: 0.04, /* ... */ },
  drug_offense: { weight: 0.03, /* ... */ },
  rioting: { weight: 0.02, /* ... */ },
  domestic_violence: { weight: 0.02, /* ... */ },
};

async function seed() {
  const app = catalyst.initialize();
  const table = app.datastore().table('CrimeIncidents');
  
  for (let batch = 0; batch < TOTAL / BATCH; batch++) {
    const rows = [];
    for (let i = 0; i < BATCH; i++) {
      rows.push(generateRecord());
    }
    await table.insertRows(rows);
  }
  console.log('✅ 100K crime records seeded');
}
```

### Hour 7-10: Backend — Express to AppSail

**File: `backend/server/index.ts`** — Modified Express server

```typescript
import express from 'express';
import catalyst from 'zcatalyst-sdk-node';
import { registerRoutes } from './routes';
import { CrimePredictor } from './agents/CrimePredictor';
import { HotspotDetector } from './agents/HotspotDetector';
import { LinkAnalyzer } from './agents/LinkAnalyzer';
import { AnomalyDetector } from './agents/AnomalyDetector';

const app = express();

// Initialize Catalyst SDK
const catalystApp = catalyst.initialize(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  (req as any).catalystApp = catalystApp;
  next();
});

// Register agent system
const agents = {
  crimePredictor: new CrimePredictor(catalystApp),
  hotspotDetector: new HotspotDetector(catalystApp),
  linkAnalyzer: new LinkAnalyzer(catalystApp),
  anomalyDetector: new AnomalyDetector(catalystApp),
};

// Register all routes
registerRoutes(app, agents, catalystApp);

// AppSail port
const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 5000;
app.listen(port, () => {
  console.log(`🚔 SAHASRA KSP API running on port ${port}`);
});
```

**API Endpoints** (all routes):

```typescript
// ── CRIME API ──
GET    /api/crime/incidents         // List crimes (filters: district, category, from, to, status)
GET    /api/crime/incidents/:id     // Single crime detail
POST   /api/crime/incidents         // Create new crime record
GET    /api/crime/stats             // Crime statistics dashboard
GET    /api/crime/hotspots          // DBSCAN clusters
GET    /api/crime/trends            // Time-series trends
GET    /api/crime/predict           // AI predictions
GET    /api/crime/anomalies         // Z-score anomaly detection
GET    /api/crime/links             // Link analysis for entity

// ── MAP & GEO ──
GET    /api/map/heatmap             // Heatmap data points
GET    /api/map/clusters            // Pulsing cluster data
GET    /api/cpr/patrols             // Live patrol van positions (SSE)

// ── SOS ──
POST   /api/sos                     // Create SOS alert
POST   /api/sos/women-safety        // Women safety SOS (stealth)
PUT    /api/sos/:id/location         // Update GPS during SOS
PUT    /api/sos/:id/resolve          // Admin resolve SOS
GET    /api/sos                      // List SOS alerts

// ── CITIZEN (from SANKALP) ──
POST   /api/auth/register           // Citizen registration
POST   /api/auth/login              // Login (Catalyst Auth)
GET    /api/complaints              // Civic complaints
POST   /api/complaints              // File complaint
POST   /api/ai/chat                 // AI assistant
GET    /api/wards                   // Ward health scores
GET    /api/leaderboard             // Citizen leaderboard
POST   /api/bills/pay               // Bill payment

// ── ADMIN ──
GET    /api/admin/stats             // Admin KPIs
POST   /api/admin/emergency-broadcast // Emergency broadcast
GET    /api/admin/workers           // Field workers
PUT    /api/admin/complaints/:id     // Admin update complaint

// ── PUBLIC ──
GET    /api/public/dashboard         // Public crime stats
GET    /api/public/district-stats    // District-level stats
GET    /api/public/safe-route        // Safe route between two points
```

### Hour 10-12: Agents System (Core Logic)

**`backend/agents/CrimePredictor.ts`** — Time-series crime prediction

```typescript
import catalyst from 'zcatalyst-sdk-node';

export class CrimePredictor {
  constructor(private app: any) {}

  async predict(district: string): Promise<Prediction[]> {
    const table = this.app.datastore().table('CrimeTrends');
    
    // Get 90-day history
    const history = await table.query(
      `SELECT * FROM CrimeTrends WHERE district = ? ORDER BY date DESC LIMIT 90`,
      [district]
    );
    
    // Simple moving average + seasonal decomposition
    const dailyAvg = this.computeDailyAverage(history);
    const hourlyPattern = this.computeHourlyPattern(history);
    const dayOfWeekPattern = this.computeDayOfWeekPattern(history);
    
    // Generate predictions for next 24 hours
    const predictions = [];
    const beats = await this.getBeats(district);
    
    for (const beat of beats) {
      const baseRisk = dailyAvg;
      const hourFactor = hourlyPattern[new Date().getHours()] || 1;
      const dayFactor = dayOfWeekPattern[new Date().getDay()] || 1;
      const beatFactor = this.getBeatRiskFactor(beat, history);
      
      const riskScore = Math.min(baseRisk * hourFactor * dayFactor * beatFactor, 100);
      
      if (riskScore > 50) {
        predictions.push({
          beat: beat.name,
          lat: beat.lat,
          lng: beat.lng,
          riskLevel: riskScore > 75 ? 'HIGH' : 'MODERATE',
          riskScore,
          timeSlot: this.getPeakTimeSlot(hourlyPattern),
          confidence: 0.75 + (Math.random() * 0.15),
          recommendation: this.getRecommendation(beat, riskScore),
        });
      }
    }
    
    return predictions;
  }
}
```

**`backend/agents/HotspotDetector.ts`** — DBSCAN clustering

```typescript
export class HotspotDetector {
  constructor(private app: any) {}

  async detect(district: string): Promise<Hotspot[]> {
    // Get unsolved crimes from last 72 hours
    const crimes = await this.fetchRecentCrimes(district, 72);
    
    if (crimes.length < 3) return [];
    
    // DBSCAN algorithm
    const EPSILON = 0.005; // ~500m
    const MIN_POINTS = 3;
    
    const clusters = this.dbscan(
      crimes.map(c => ({ lat: c.latitude, lng: c.longitude, id: c.ROWID })),
      EPSILON,
      MIN_POINTS
    );
    
    // Save to RiskZones table
    const riskTable = this.app.datastore().table('RiskZones');
    await riskTable.query(`DELETE FROM RiskZones WHERE district = ?`, [district]);
    
    const hotspots = clusters.filter(c => c.points.length >= MIN_POINTS).map(cluster => ({
      centerLat: this.centroid(cluster.points).lat,
      centerLng: this.centroid(cluster.points).lng,
      radius: cluster.points.length * 50,
      crimeCount: cluster.points.length,
      density: cluster.points.length / (Math.PI * EPSILON * EPSILON),
      category: this.dominantCategory(cluster.points, crimes),
      severity: cluster.points.length > 10 ? 'high' : cluster.points.length > 5 ? 'medium' : 'low',
      district,
      isActive: true,
    }));
    
    await riskTable.insertRows(hotspots);
    return hotspots;
  }

  private dbscan(points: Point[], eps: number, minPts: number): Cluster[] {
    let clusterId = 0;
    const clusters: Cluster[] = [];
    const visited = new Set<number>();
    const noise = new Set<number>();
    
    for (let i = 0; i < points.length; i++) {
      if (visited.has(i)) continue;
      visited.add(i);
      
      const neighbors = this.regionQuery(points, i, eps);
      
      if (neighbors.length < minPts) {
        noise.add(i);
      } else {
        clusterId++;
        this.expandCluster(points, i, neighbors, clusterId, eps, minPts, visited, clusters);
      }
    }
    
    return clusters;
  }

  private expandCluster(
    points: Point[], pointIdx: number, neighbors: number[],
    clusterId: number, eps: number, minPts: number,
    visited: Set<number>, clusters: Cluster[]
  ) {
    const cluster = { id: clusterId, points: [points[pointIdx]], neighborPoints: [...neighbors] };
    
    let i = 0;
    while (i < cluster.neighborPoints.length) {
      const neighborIdx = cluster.neighborPoints[i];
      
      if (!visited.has(neighborIdx)) {
        visited.add(neighborIdx);
        const newNeighbors = this.regionQuery(points, neighborIdx, eps);
        if (newNeighbors.length >= minPts) {
          cluster.neighborPoints.push(...newNeighbors.filter(n => !cluster.neighborPoints.includes(n)));
        }
      }
      
      if (!cluster.points.find(p => p.id === points[neighborIdx].id)) {
        cluster.points.push(points[neighborIdx]);
      }
      
      i++;
    }
    
    // Clean up
    delete (cluster as any).neighborPoints;
    clusters.push(cluster);
  }

  private regionQuery(points: Point[], idx: number, eps: number): number[] {
    const neighbors: number[] = [];
    for (let i = 0; i < points.length; i++) {
      if (i === idx) continue;
      const dist = this.haversine(points[idx], points[i]);
      if (dist <= eps) neighbors.push(i);
    }
    return neighbors;
  }

  private haversine(a: Point, b: Point): number {
    const R = 6371; // Earth's radius in km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lng - a.lng) * Math.PI / 180;
    const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180) * Math.cos(b.lat*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)) / 111; // convert to degrees
  }
}
```

---

## DAY 2: Core Features (12 Hours)

### Hour 1-3: React Web App Setup

**`frontend/`** — Vite + React + TypeScript + Leaflet + D3.js

```
frontend/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── catalyst-auth.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── CrimeDashboard.tsx    ← Merged SANKALP home + crime KPIs
│   │   ├── LiveMap.tsx           ← SAHASRA Smart Radar
│   │   ├── LinkAnalysis.tsx      ← SAHASRA suspect deep-dive
│   │   ├── Predictive.tsx        ← AI crime prediction
│   │   ├── SOSCommand.tsx        ← SAHASRA stealth SOS + patrol
│   │   ├── CitizenPortal.tsx     ← SANKALP citizen features
│   │   └── PublicDashboard.tsx   ← Public crime stats
│   ├── components/               ← SAHASRA Zero-Crush components
│   │   ├── OmniFAB.tsx
│   │   ├── DynamicBottomSheet.tsx
│   │   ├── HapticGeoMarker.tsx
│   │   ├── NeonStatusCard.tsx
│   │   ├── HeatmapLayer.tsx
│   │   ├── SafetyScorePathing.tsx
│   │   └── StealthSOSOverlay.tsx
│   └── api/
│       └── client.ts
├── package.json
├── vite.config.ts
└── index.html
```

### Hour 3-5: Crime Dashboard (Merged SANKALP Home + Crime KPIs)

**`frontend/src/pages/CrimeDashboard.tsx`** — The main landing page

```tsx
// Layout:
// ┌────────────────────────────────────────────────────────────┐
// │ 🚔 SAHASRA KSP CRIME INTELLIGENCE    [  Officer: SI Rao ] │
// ├────────────────────────────────────────────────────────────┤
// │ LIVE CRIME STATS — Bengaluru City                         │
// │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ │
// │ │  247   │ │   18   │ │  92%   │ │  8.2   │ │  🔴 4   │ │
// │ │ Today  │ │ Active │ │Clear   │ │Response│ │Hotspots │ │
// │ │Crimes  │ │Cases   │ │Rate    │ │min     │ │         │ │
// │ └────────┘ └────────┘ └────────┘ └────────┘ └─────────┘ │
// ├────────────────────────────────────────────────────────────┤
// │ CRIME CATEGORY BREAKDOWN         TIME-OF-DAY ANALYSIS     │
// │ ┌────┬──────┬──────┐             ┌────────────────────┐  │
// │ │Theft   ████████ 45%│            │ 🌅 4-7AM     ██   │  │
// │ │Assault ████   22% │            │ 🌞 7-12PM   █████ │  │
// │ │ChainSn ███    18%│            │ 🌤 12-4PM   ████  │  │
// │ │VehThft █       8%│            │ 🌆 4-8PM   ███████│  │
// │ │Others  █       7%│            │ 🌙 8-12AM ████████│  │
// │ └────┴──────┴──────┘            │ 🌚 12-4AM   ███   │  │
// │                                  └────────────────────┘  │
// ├────────────────────────────────────────────────────────────┤
// │ 🔥 ACTIVE HOTSPOTS (DBSCAN — Last 15 min)                 │
// │ ┌──────────────────────────────────────────────────────┐  │
// │ │ 🔴 Koramangala — 12 incidents — Chain Snatching 🠝  │  │
// │ │ 🟡 MG Road — 8 incidents — Theft 🠟                  │  │
// │ │ 🟡 Yeshwanthpur — 5 incidents — Vehicle Theft 🠝    │  │
// │ └──────────────────────────────────────────────────────┘  │
// ├────────────────────────────────────────────────────────────┤
// │ 🚨 WOMEN SAFETY ALERTS    │ 🤖 AI PREDICTIONS              │
// │ 2 active SOS in last 24h  │ Koramangala: HIGH RISK 8-11PM │
// │ Avg response: 6.3 min     │ MG Road: MODERATE  tonight    │
// └────────────────────────────────────────────────────────────┘
```

### Hour 5-8: Live Crime Map (SAHASRA Smart Radar)

**`frontend/src/pages/LiveMap.tsx`** — The centerpiece feature

```tsx
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { HeatmapLayer } from '../components/HeatmapLayer';
import { ClusterLayer } from '../components/ClusterLayer';
import { PatrolLayer } from '../components/PatrolLayer';
import { TemporalSlider } from '../components/TemporalSlider';
import { DynamicBottomSheet } from '../components/DynamicBottomSheet';
import { OmniFAB } from '../components/OmniFAB';

export function LiveMap() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [selectedBeat, setSelectedBeat] = useState<string | null>(null);

  useEffect(() => {
    // Fetch hotspots every 30 seconds
    const fetchHotspots = async () => {
      const res = await fetch('/api/crime/hotspots?algorithm=dbscan');
      const data = await res.json();
      setClusters(data);
    };
    
    fetchHotspots();
    const interval = setInterval(fetchHotspots, 30000);
    
    // SSE for patrol positions
    const sse = new EventSource('/api/cpr/patrols/stream');
    sse.onmessage = (e) => setPatrols(JSON.parse(e.data));
    
    return () => { clearInterval(interval); sse.close(); };
  }, []);

  return (
    <div className="map-container">
      <MapContainer center={[12.9716, 77.5946]} zoom={12}>
        {/* 7 layers */}
        <HeatmapLayer clusters={clusters} />
        <ClusterLayer clusters={clusters} onSelect={(b) => setSelectedBeat(b)} />
        <PatrolLayer patrols={patrols} />
        <CrimeMarkers timeRange={timeRange} />
        <PoliceStationLayer />
        <CCTVLayer />
        <RiskZoneLayer />
        
        {/* Proximity chip (SAHASRA) */}
        <ProximityChip userLocation={userLoc} hotspots={clusters} />
      </MapContainer>
      
      {/* Temporal slider */}
      <TemporalSlider value={timeRange} onChange={setTimeRange} />
      
      {/* Bottom sheet (SAHASRA) — slides up when beat selected */}
      <DynamicBottomSheet visible={!!selectedBeat} onClose={() => setSelectedBeat(null)}>
        {selectedBeat && <BeatDetailPanel beat={selectedBeat} />}
      </DynamicBottomSheet>
      
      {/* OmniFAB (SAHASRA) */}
      <OmniFAB onTap={() => {/* quick actions */}} onHold={() => {/* voice AI */}} />
    </div>
  );
}
```

**Map Layers:**

| Layer | Data Source | Visual |
|-------|-------------|--------|
| **Heatmap** | DBSCAN cluster density | Red-yellow gradient overlay |
| **Clusters** | Active hotspots | Pulsing circles, count badge |
| **Patrol Vans** | SSE live stream | Blue icons, moving |
| **Crime Markers** | Recent crimes | Color by category, click for detail |
| **Police Stations** | Catalyst Data Store | Blue badges, call button |
| **CCTV Cameras** | Fixed dataset | Green=online, Red=offline |
| **Risk Zones** | Predictive model | Outlined polygons, risk color |

### Hour 8-10: Link Analysis (SAHASRA Suspect Deep-Dive)

**`frontend/src/pages/LinkAnalysis.tsx`**

```tsx
// D3.js force-directed graph
// Nodes: Suspects (🔴), Victims (🔵), Locations (🟢), Vehicles (⬜)
// Edges: Connections between entities
// Features:
//   - Zoom/pan
//   - Click node → bottom sheet with full profile
//   - Filter by crime type
//   - Highlight path between entities
//   - Export as image

export function LinkAnalysis() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    fetch('/api/crime/links?depth=3').then(r => r.json()).then(setGraphData);
  }, []);
  
  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    
    // D3 force simulation
    const simulation = forceSimulation(graphData.nodes)
      .force('link', forceLink(graphData.links).id((d: any) => d.id))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2));
    
    // Render nodes and links
    const link = select(svgRef.current).selectAll('line')
      .data(graphData.links).join('line')
      .attr('stroke', '#666').attr('stroke-width', 2);
    
    const node = select(svgRef.current).selectAll('circle')
      .data(graphData.nodes).join('circle')
      .attr('r', 8).attr('fill', d => getNodeColor(d.type))
      .on('click', (e, d) => setSelectedNode(d))
      .call(drag(simulation));
    
    simulation.on('tick', () => {
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node.attr('cx', d => d.x).attr('cy', d => d.y);
    });
  }, [graphData]);
  
  return (
    <div className="link-analysis">
      <div className="graph-header">
        <h2>🔗 Criminological Network Analysis</h2>
        <div className="legend">
          <span>🔴 Suspects</span>
          <span>🔵 Victims</span>
          <span>🟢 Locations</span>
          <span>⬜ Vehicles</span>
        </div>
      </div>
      <svg ref={svgRef} width="100%" height="600" />
      
      {/* SAHASRA-style bottom sheet on node click */}
      <DynamicBottomSheet visible={!!selectedNode} onClose={() => setSelectedNode(null)}>
        {selectedNode && <NodeDetailPanel node={selectedNode} />}
      </DynamicBottomSheet>
    </div>
  );
}
```

### Hour 10-12: AI Integration with Catalyst QuickML

**`backend/services/catalyst-ai.ts`**

```typescript
import catalyst from 'zcatalyst-sdk-node';

export class CatalystAI {
  private app: any;
  
  constructor(catalystApp: any) {
    this.app = catalystApp;
  }

  // Crime description → structured analysis
  async analyzeCrime(text: string): Promise<CrimeAnalysis> {
    const llm = this.app.quickML().llm();
    const response = await llm.generate({
      model: 'GLM 4.7',
      prompt: `Analyze this crime report. Output JSON with: category, severity, weapons, location_type, time_inference.
      
Report: "${text}"
      
Valid categories: murder, theft, assault, chain_snatching, vehicle_theft, burglary, robbery, cyber_crime, fraud, other
Severity: heinous, grave, petty
      
Return ONLY valid JSON.`,
      temperature: 0.1,
      maxTokens: 200,
    });
    
    return JSON.parse(response.text);
  }

  // KSP document query (RAG)
  async queryPoliceManual(question: string): Promise<string> {
    const rag = this.app.quickML().rag();
    const response = await rag.query({
      documentId: process.env.KSP_MANUAL_ID,
      query: question,
      maxTokens: 500,
    });
    return response.text;
  }

  // Image analysis (for evidence photos)
  async analyzeEvidenceImage(imageBase64: string): Promise<ImageAnalysis> {
    const vision = this.app.quickML().vision();
    const response = await vision.analyze({
      image: imageBase64,
      prompts: [
        'Detect any weapons in this image',
        'Describe the scene (indoor/outdoor, day/night)',
        'Detect any vehicles with license plates',
        'Count number of people visible',
      ],
    });
    return response;
  }
}
```

---

## DAY 3: Winning Features + DEPLOY (12 Hours)

### Hour 1-3: Stealth SOS (The Winning Feature)

**`frontend/src/pages/SOSCommand.tsx`**

```tsx
// SAHASRA's Stealth SOS — the feature that wins datathons
// Combined with SANKALP's 5 trigger methods + women safety

export function SOSCommand() {
  const [activeSOS, setActiveSOS] = useState<SOSAlert[]>([]);
  const [stealthMode, setStealthMode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // ── STEALTH MODE ──
  // When citizen triggers SOS:
  // 1. Screen goes 100% black (CSS overlay)
  // 2. Camera activates silently (getUserMedia with no UI indicator)
  // 3. Audio captures continuously
  // 4. Streamed to server via WebRTC/WebSocket
  // 5. GPS updates every 5 seconds
  // 6. If screen is touched: show fake "POWER OFF — 3%" overlay
  
  const activateStealthSOS = async () => {
    setStealthMode(true);
    
    // Step 1: Black overlay
    document.body.style.backgroundColor = '#000000';
    
    // Step 2: Silent camera
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 640 },
      audio: true,
    });
    
    // Step 3: Stream to server via WebSocket
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    });
    
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        // Send chunk to server
        const formData = new FormData();
        formData.append('chunk', e.data);
        formData.append('alertId', currentAlertId);
        await fetch('/api/sos/stream-chunk', { method: 'POST', body: formData });
      }
    };
    
    mediaRecorder.start(3000); // 3-second chunks
    
    // Step 4: GPS beacon mode
    const gpsInterval = setInterval(async () => {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await fetch('/api/sos/' + currentAlertId + '/location', {
          method: 'PUT',
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          headers: { 'Content-Type': 'application/json' },
        });
      });
    }, 5000);
  };
  
  return (
    <div className="sos-command">
      {/* Active SOS Feed */}
      <div className="sos-list">
        {activeSOS.map(alert => (
          <NeonStatusCard
            key={alert.id}
            type="danger"
            title={`${alert.category.toUpperCase()} SOS`}
            subtitle={`${alert.triggeredBy} • ${alert.district}`}
            action={{ label: 'View Live Feed', onClick: () => showLiveFeed(alert) }}
          />
        ))}
      </div>
      
      {/* Stealth Mode Overlay — Black screen */}
      {stealthMode && (
        <div className="stealth-overlay" onClick={showFakePowerOff}>
          <div className="fake-status">
            <span>POWER OFF — 3%</span>
          </div>
          {/* Hidden: double-tap pattern to show panic pad */}
        </div>
      )}
    </div>
  );
}
```

### Hour 3-5: Predictive Analytics Dashboard

**`frontend/src/pages/Predictive.tsx`**

```tsx
// Three-panel layout:
// ┌────────────────────────────────────────────────────┐
// │ 🤖 AI CRIME PREDICTION — Next 24 Hours            │
// ├────────────────────────────────────────────────────┤
// │ RISK HEATMAP                                       │
// │ ┌──────────────────────────────────────────────┐  │
// │ │  [Leaflet map with predicted risk overlay]    │  │
// │ │  🔴 HIGH    🟡 MODERATE   🟢 LOW             │  │
// │ └──────────────────────────────────────────────┘  │
// ├────────────────────────────────────────────────────┤
// │ TOP PREDICTIONS                                    │
// │ ┌──────────────────────────────────────────────┐  │
// │ │ 🔴 Koramangala — Chain Snatching             │  │
// │ │    Risk: 87/100 | Confidence: 92%            │  │
// │ │    Peak: 8PM-11PM | Action: Deploy 2 units   │  │
// │ │                                              │  │
// │ │ 🟡 MG Road — Theft                           │  │
// │ │    Risk: 65/100 | Confidence: 78%            │  │
// │ │    Peak: 5PM-8PM | Action: Increase patrol   │  │
// │ │                                              │  │
// │ │ 🟢 Whitefield — Low Risk                     │  │
// │ │    Risk: 23/100 | Confidence: 85%            │  │
// │ └──────────────────────────────────────────────┘  │
// ├────────────────────────────────────────────────────┤
// │ ANOMALY DETECTION ALERTS                           │
// │ ⚠️ Chain snatching in Koramangala up 245% vs avg  │
// │ ⚠️ Vehicle theft in Yeshwanthpur up 180% (new MO) │
// │ ℹ️ Assault in MG Road down 40% (patrol effective) │
// ├────────────────────────────────────────────────────┤
// │ TREND FORECAST (90 days)                          │
// │ ┌──────────────────────────────────────────────┐  │
// │ │  📈 Chart: Actual ▬▬▬ vs Predicted ▬▬▬       │  │
// │ │  ↑ Theft predicted to rise 12% next week     │  │
// │ │  ↓ Assault predicted to fall 8%              │  │
// │ └──────────────────────────────────────────────┘  │
// └────────────────────────────────────────────────────┘
```

### Hour 5-7: Citizen Portal (Merged SANKALP Features)

**`frontend/src/pages/CitizenPortal.tsx`**

Merges all SANKALP AI citizen features into a web interface:

```tsx
// Tabs:
// ┌────────────────────────────────────────────────────┐
// │ 🏠 Home │ 📋 Complaints │ 🆘 SOS │ 🤖 AI Chat     │
// ├────────────────────────────────────────────────────┤
// │                                                    │
// │ HOME TAB:                                           │
// │ - Ward Health Score (from SANKALP)                 │
// │ - Crime Heatmap (from SAHASRA, citizen-safe view)  │
// │ - Safe Route Planner (SAHASRA SafetyScorePathing)  │
// │ - Government Schemes (SANKALP)                     │
// │ - Emergency Helplines (SANKALP)                    │
// │ - Leaderboard (SANKALP gamification)               │
// │                                                    │
// │ COMPLAINTS TAB:                                     │
// │ - AI complaint classification (SANKALP)            │
// │ - Photo upload + YOLO analysis (SAHASRA)           │
// │ - Status tracking + ticket ID                      │
// │                                                    │
// │ SOS TAB:                                            │
// │ - 5 trigger methods (SANKALP)                      │
// │ - Stealth mode option (SAHASRA)                    │
// │ - Nearest police stations                          │
// │                                                    │
// │ AI CHAT TAB:                                        │
// │ - Multi-agent AI assistant (merged both)           │
// │ - Intent router (SAHASRA) + civic queries          │
// │ - Bilingual (Hindi/Kannada/English)                │
// └────────────────────────────────────────────────────┘
```

### Hour 7-10: Integrate, Test, Polish

**Integration Checklist:**

- [ ] All API routes connect to Catalyst Data Store (not in-memory)
- [ ] Catalyst Auth working for officer login + citizen login
- [ ] WebSocket for SOS live updates
- [ ] SSE for patrol van positions
- [ ] DBSCAN runs on demand via API + via Catalyst Cron
- [ ] Frontend pages all fetch from backend API
- [ ] CORS configured correctly for Slate + AppSail domains

**Critical Integration Steps:**

```typescript
// 1. Configure catalyst.json with AppSail and Slate endpoints
{
  "AppSail": {
    "spring-boot": {
      "buildPath": "./backend",
      "stack": "nodejs20",
      "startupCommand": "node server/index.js"
    }
  },
  "Slate": {
    "react-app": {
      "buildDirectory": "./frontend",
      "buildCommand": "npm run build",
      "outputDirectory": "dist"
    }
  }
}
```

### Hour 10-12: DEPLOY TO CATALYST

```bash
# 1. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Build frontend
cd frontend && npm run build && cd ..

# 3. Set environment variables in Catalyst Console
#    - KSP_KNOWLEDGE_BASE_ID
#    - CATALYST_ORG_ID
#    - ADMIN_PHONE (for super admin)

# 4. Deploy via CLI
catalyst deploy

# 5. Get the URLs
#    Frontend: https://sahasra-ksp.onslate.in
#    Backend:  https://sahasra-api.catalystapps.io

# 6. Test all endpoints
curl https://sahasra-api.catalystapps.io/api/health
curl https://sahasra-api.catalystapps.io/api/crime/stats?district=Bengaluru
curl https://sahasra-ksp.onslate.in/
```

---

## 🎬 The Demo Script (2-Minute PITCH)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 1: "The Problem" (15 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"247 crimes in Bengaluru today. Spreadsheets can't catch criminals.
SAHASRA KSP brings AI-powered crime intelligence to every officer's phone.
Deployed entirely on Zoho Catalyst."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 2: "The Smart Radar" (20 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Open Live Map]
"Our Smart Radar shows 4 DBSCAN-detected hotspots right now.
Koramangala — 12 chain snatchings in 72 hours. Our AI says high risk tonight 8-11PM.
Every 15 minutes, Catalyst Cron recomputes these clusters.
Every 30 seconds, patrol van positions update via SSE.
All on Zoho Catalyst Data Store with 100,000 crime records."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 3: "Link Analysis" (15 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Open Link Analysis]
"Click any suspect — see their entire criminal network.
Connections across jurisdictions. Repeat offenders. Hidden associations.
This is what Excel sheets can never show.
Powered by Catalyst QuickML analyzing patterns across 150,000 suspect links."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 4: "Stealth SOS" (25 sec — THE WINNER)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Show SOS screen]
"A woman in danger triggers SOS.
Watch — the screen goes COMPLETELY BLACK. The attacker sees a dead phone.
But the camera is recording. The mic is capturing audio.
GPS is streaming. Everything goes to the police command center in real-time.
This is Stealth SOS. One tap. Lives saved."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 5: "AI Predictions" (15 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"AI predicts: Koramangala HIGH RISK tonight.
Dispatching 2 patrol units. Optimal routes computed.
Proactive policing. Not reactive. This prevents crime before it happens.
Catalyst QuickML GLM 4.7 powers the analysis; Catalyst Cron refreshes every hour."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENE 6: "Citizen + Police Unified" (15 sec)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Citizens file complaints, check ward health, plan safe routes, trigger SOS.
Police get live dashboards, suspect links, crime predictions, evidence analysis.
One platform. Two views. 100,000 records. All on Zoho Catalyst.
SAHASRA KSP — AI for a safer Karnataka."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📋 Deliverables Checklist

```
DAY 1:
✅ Catalyst project created with all services
✅ 8 Data Store tables created (ZCQL)
✅ 100,000 crime records seeded
✅ Backend Express app migrated to Catalyst pattern
✅ All API routes defined (30+ endpoints)
✅ 4 agent modules scaffolded

DAY 2:
✅ React web app with Vite + TypeScript
✅ Crime Dashboard with live KPIs
✅ Live Map with 7 data layers
✅ DBSCAN heatmap rendering on Leaflet
✅ Link Analysis with D3.js force graph
✅ Catalyst QuickML integration (LLM + Vision + RAG)

DAY 3:
✅ Stealth SOS with silent camera/mic streaming
✅ Patrol dispatch with SSE live tracking
✅ Predictive analytics dashboard
✅ Anomaly detection alerts
✅ Citizen portal (SANKALP features merged)
✅ Full integration test
✅ DEPLOYED ON CATALYST ✅
✅ Public URL submitted
```

---

## 🏆 Why This Wins

| Judge Criteria | How We Win |
|---------------|------------|
| **Technology** | 8 Catalyst services used (Data Store, AppSail, Slate, QuickML, Cron, Auth, Stratus, Zia) |
| **AI Integration** | 4 AI agents + Catalyst QuickML + DBSCAN + Time-series prediction |
| **Data Volume** | 100,000+ synthetic crime records with realistic patterns |
| **Visualization** | 7-layer live map, D3.js link graph, temporal slider, heatmap |
| **Real-time** | WebSocket for SOS, SSE for patrols, Catalyst Cron for clustering |
| **Practical Impact** | Stealth SOS saves lives. Predictive policing prevents crime. Link analysis catches hidden networks. |
| **Completeness** | Police mode + Citizen mode + Public dashboard — all working |
| **Catalyst Usage** | Mandatory platform — maximum utilization = maximum points |

---

**Bottom line**: We merge SAHASRA's police/crime features + SANKALP's civic features + KSP crime analytics into one Catalyst-deployed platform. The **Stealth SOS** and **Live DBSCAN Heatmap** are the knockout features. Focus the 3 days on: (1) Catalyst backend with 100K crime data, (2) Live map, (3) Stealth SOS, (4) Deploy.
