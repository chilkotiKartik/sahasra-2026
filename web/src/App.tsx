import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { ROLE_ROUTE_PERMISSIONS } from '@shared/types';

import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { CommandCenter } from './pages/CommandCenter';
import { CaseExplorer } from './pages/CaseExplorer';
import { Governance } from './pages/Governance';
import { BiasFairness } from './pages/BiasFairness';
import { MoSearch } from './pages/MoSearch';
import { ReportGenerator } from './pages/ReportGenerator';
import { Escalations } from './pages/Escalations';

// Heavy routes (TensorFlow.js / Leaflet / force-graph / recharts) are code-split
// so they load only when their screen is opened, keeping the main bundle light.
const named = (p: Promise<any>, key: string) => p.then((m) => ({ default: m[key] }));
const HotspotMap = lazy(() => named(import('./pages/HotspotMap'), 'HotspotMap'));
const NetworkGraph = lazy(() => named(import('./pages/NetworkGraph'), 'NetworkGraph'));
const Trends = lazy(() => named(import('./pages/Trends'), 'Trends'));
const CameraIntelligence = lazy(() => named(import('./pages/CameraIntelligence'), 'CameraIntelligence'));
const Fleet = lazy(() => named(import('./pages/Fleet'), 'Fleet'));
const ForecastEngine = lazy(() => named(import('./pages/ForecastEngine'), 'ForecastEngine'));
const PatrolPlanner = lazy(() => named(import('./pages/PatrolPlanner'), 'PatrolPlanner'));
import { GeoTemporalMatrix } from './pages/GeoTemporalMatrix';
import { CaseDiary } from './pages/CaseDiary';
import { PanicSOS } from './pages/PanicSOS';
import { EvidenceLocker } from './pages/EvidenceLocker';
import { RepeatFlag } from './pages/RepeatFlag';
import { Deadlines } from './pages/Deadlines';
import { PatternProfiler } from './pages/PatternProfiler';
import { CaseComparator } from './pages/CaseComparator';
import { SuspectRanking } from './pages/SuspectRanking';
import { AnomalyExplorer } from './pages/AnomalyExplorer';
import { ReportBuilder } from './pages/ReportBuilder';
import { SeriesBuilder } from './pages/SeriesBuilder';
import { BeatChecklist } from './pages/BeatChecklist';
import { OfflineQueue } from './pages/OfflineQueue';
import { BeatFeed } from './pages/BeatFeed';
import { WarrantGenerator } from './pages/WarrantGenerator';
import { ClearanceSnapshot } from './pages/ClearanceSnapshot';
import { EvidenceCapture } from './pages/EvidenceCapture';
import { NearbyUnits } from './pages/NearbyUnits';
import { ShiftHandover } from './pages/ShiftHandover';
import { Commendations } from './pages/Commendations';
import { CommunityTip } from './pages/CommunityTip';
import { EquipmentChecklist } from './pages/EquipmentChecklist';
import { FieldReport } from './pages/FieldReport';
import { DataCoverage } from './pages/DataCoverage';
import { AnnotationNotebook } from './pages/AnnotationNotebook';
import { ExternalCorrelator } from './pages/ExternalCorrelator';
import { WitnessManager } from './pages/WitnessManager';
import { BeatNotes } from './pages/BeatNotes';
import { CollabRequest } from './pages/CollabRequest';
import { ActivityCenter } from './pages/ActivityCenter';
import { SuspectTimeline } from './pages/SuspectTimeline';
import { SimilarCases } from './pages/SimilarCases';

// Role + Auth Guard Component
const RoleGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoutes = ROLE_ROUTE_PERMISSIONS[user.role] || [];
  const currentPath = location.pathname;

  const isAuthorized = allowedRoutes.includes(currentPath);

  if (!isAuthorized) {
    return <Unauthorized />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Main Operations Shell Layout Routes with RBAC Guard */}
      <Route
        path="/"
        element={
          <Layout />
        }
      >
        <Route index element={<Navigate to="/command-center" replace />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        <Route
          path="command-center"
          element={
            <RoleGuard>
              <CommandCenter />
            </RoleGuard>
          }
        />
        <Route
          path="hotspot-map"
          element={
            <RoleGuard>
              <HotspotMap />
            </RoleGuard>
          }
        />
        <Route
          path="network-graph"
          element={
            <RoleGuard>
              <NetworkGraph />
            </RoleGuard>
          }
        />
        <Route
          path="camera-intelligence"
          element={
            <RoleGuard>
              <CameraIntelligence />
            </RoleGuard>
          }
        />
        <Route
          path="case-explorer"
          element={
            <RoleGuard>
              <CaseExplorer />
            </RoleGuard>
          }
        />
        <Route
          path="trends"
          element={
            <RoleGuard>
              <Trends />
            </RoleGuard>
          }
        />
        <Route
          path="governance"
          element={
            <RoleGuard>
              <Governance />
            </RoleGuard>
          }
        />
        <Route path="bias-fairness" element={<RoleGuard><BiasFairness /></RoleGuard>} />
        <Route path="fleet" element={<RoleGuard><Fleet /></RoleGuard>} />
        <Route path="mo-search" element={<RoleGuard><MoSearch /></RoleGuard>} />
        <Route path="forecast" element={<RoleGuard><ForecastEngine /></RoleGuard>} />
        <Route path="report" element={<RoleGuard><ReportGenerator /></RoleGuard>} />
        <Route path="escalations" element={<RoleGuard><Escalations /></RoleGuard>} />
        <Route path="patrol-planner" element={<RoleGuard><PatrolPlanner /></RoleGuard>} />
        <Route path="geo-temporal" element={<RoleGuard><GeoTemporalMatrix /></RoleGuard>} />
        <Route path="case-diary" element={<RoleGuard><CaseDiary /></RoleGuard>} />
        <Route path="panic" element={<RoleGuard><PanicSOS /></RoleGuard>} />
        <Route path="evidence-locker" element={<RoleGuard><EvidenceLocker /></RoleGuard>} />
        <Route path="repeat-check" element={<RoleGuard><RepeatFlag /></RoleGuard>} />
        <Route path="deadlines" element={<RoleGuard><Deadlines /></RoleGuard>} />
        <Route path="pattern-profiler" element={<RoleGuard><PatternProfiler /></RoleGuard>} />
        <Route path="case-comparator" element={<RoleGuard><CaseComparator /></RoleGuard>} />
        <Route path="suspect-ranking" element={<RoleGuard><SuspectRanking /></RoleGuard>} />
        <Route path="anomaly-explorer" element={<RoleGuard><AnomalyExplorer /></RoleGuard>} />
        <Route path="report-builder" element={<RoleGuard><ReportBuilder /></RoleGuard>} />
        <Route path="series-builder" element={<RoleGuard><SeriesBuilder /></RoleGuard>} />
        <Route path="beat-checklist" element={<RoleGuard><BeatChecklist /></RoleGuard>} />
        <Route path="offline-queue" element={<RoleGuard><OfflineQueue /></RoleGuard>} />
        <Route path="beat-feed" element={<RoleGuard><BeatFeed /></RoleGuard>} />
        <Route path="warrant-generator" element={<RoleGuard><WarrantGenerator /></RoleGuard>} />
        <Route path="clearance" element={<RoleGuard><ClearanceSnapshot /></RoleGuard>} />
        <Route path="evidence-capture" element={<RoleGuard><EvidenceCapture /></RoleGuard>} />
        <Route path="nearby-units" element={<RoleGuard><NearbyUnits /></RoleGuard>} />
        <Route path="shift-handover" element={<RoleGuard><ShiftHandover /></RoleGuard>} />
        <Route path="commendations" element={<RoleGuard><Commendations /></RoleGuard>} />
        <Route path="community-tip" element={<RoleGuard><CommunityTip /></RoleGuard>} />
        <Route path="equipment-checklist" element={<RoleGuard><EquipmentChecklist /></RoleGuard>} />
        <Route path="field-report" element={<RoleGuard><FieldReport /></RoleGuard>} />
        <Route path="data-coverage" element={<RoleGuard><DataCoverage /></RoleGuard>} />
        <Route path="annotation-notebook" element={<RoleGuard><AnnotationNotebook /></RoleGuard>} />
        <Route path="external-correlator" element={<RoleGuard><ExternalCorrelator /></RoleGuard>} />
        <Route path="witness-manager" element={<RoleGuard><WitnessManager /></RoleGuard>} />
        <Route path="beat-notes" element={<RoleGuard><BeatNotes /></RoleGuard>} />
        <Route path="collab-request" element={<RoleGuard><CollabRequest /></RoleGuard>} />
        <Route path="activity" element={<RoleGuard><ActivityCenter /></RoleGuard>} />
        <Route path="suspect-timeline" element={<RoleGuard><SuspectTimeline /></RoleGuard>} />
        <Route path="similar-cases" element={<RoleGuard><SimilarCases /></RoleGuard>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/command-center" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
