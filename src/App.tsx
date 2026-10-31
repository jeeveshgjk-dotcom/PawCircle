import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { DemoProvider } from './context/DemoContext';
import { Layout } from './components/Layout';
import { DemoLayout } from './components/DemoLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Auth Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';

// Real Cloud Account Pages
import OwnerDashboard from './pages/OwnerDashboard';
import PetProfiles, { PetForm } from './pages/PetProfiles';
import CaretakerProfile from './pages/CaretakerProfile';
import CaretakerDashboard from './pages/CaretakerDashboard';

// Live Account Pages for Authenticated Users (Clean, Private, Live Data)
import LiveCareJobs, { LivePostJobForm } from './pages/live/LiveCareJobs';
import LiveSchedule from './pages/live/LiveSchedule';
import LiveHealthRecords from './pages/live/LiveHealthRecords';
import LiveFamilyHub from './pages/live/LiveFamilyHub';
import LiveTimeCapsule from './pages/live/LiveTimeCapsule';
import LiveAIChecklists from './pages/live/LiveAIChecklists';
import LiveMarketplace from './pages/live/LiveMarketplace';
import LiveEarnings from './pages/live/LiveEarnings';

// Public Demo Pages (Isolated Dexie Local Sandbox for Unauthenticated Visitors)
import DemoOwnerDashboard from './pages/demo/DemoOwnerDashboard';
import DemoPetProfiles, { DemoPetForm } from './pages/demo/DemoPetProfiles';
import DemoCaretakerDashboard from './pages/demo/DemoCaretakerDashboard';
import DemoCaretakerProfile from './pages/demo/DemoCaretakerProfile';
import CareJobs, { PostJobForm } from './pages/CareJobs';
import Marketplace from './pages/Marketplace';
import Earnings from './pages/Earnings';
import Schedule from './pages/Schedule';
import HealthRecords from './pages/HealthRecords';
import FamilyHub from './pages/FamilyHub';
import TimeCapsule from './pages/TimeCapsule';
import AIChecklists from './pages/AIChecklists';

function AppRoutes() {
  return (
    <Routes>
      {/* ──────────────── Public Unauthenticated Pages ──────────────── */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* ──────────────── Public Demo Sandbox Routes (/demo/*) ──────────────── */}
      <Route
        path="/demo"
        element={
          <DemoProvider>
            <DemoLayout />
          </DemoProvider>
        }
      >
        <Route index element={<Navigate to="/demo/dashboard" replace />} />
        <Route path="dashboard" element={<DemoOwnerDashboard />} />
        <Route path="pets" element={<DemoPetProfiles />} />
        <Route path="pets/new" element={<DemoPetForm />} />
        <Route path="pets/:id/edit" element={<DemoPetForm />} />
        <Route path="jobs" element={<CareJobs />} />
        <Route path="jobs/new" element={<PostJobForm />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="health" element={<HealthRecords />} />
        <Route path="family" element={<FamilyHub />} />
        <Route path="capsule" element={<TimeCapsule />} />
        <Route path="checklists" element={<AIChecklists />} />

        {/* Demo Caretaker Views */}
        <Route path="caretaker" element={<DemoCaretakerDashboard />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="profile" element={<DemoCaretakerProfile />} />
        <Route path="earnings" element={<Earnings />} />
      </Route>

      {/* ──────────────── Real Cloud Account Protected Routes ──────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<OwnerDashboard />} />
        <Route path="/pets" element={<PetProfiles />} />
        <Route path="/pets/new" element={<PetForm />} />
        <Route path="/pets/:id" element={<PetForm />} />
        <Route path="/pets/:id/edit" element={<PetForm />} />
        <Route path="/profile" element={<CaretakerProfile />} />
        <Route path="/caretaker" element={<CaretakerDashboard />} />

        {/* Live Account Modules (Private & Scoped to Logged In User) */}
        <Route path="/jobs" element={<LiveCareJobs />} />
        <Route path="/jobs/new" element={<LivePostJobForm />} />
        <Route path="/schedule" element={<LiveSchedule />} />
        <Route path="/health" element={<LiveHealthRecords />} />
        <Route path="/family" element={<LiveFamilyHub />} />
        <Route path="/capsule" element={<LiveTimeCapsule />} />
        <Route path="/checklists" element={<LiveAIChecklists />} />
        <Route path="/marketplace" element={<LiveMarketplace />} />
        <Route path="/earnings" element={<LiveEarnings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
