import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { seedDatabase } from './db/seed';
import { Layout } from './components/Layout';

import Landing from './pages/Landing';
import OwnerDashboard from './pages/OwnerDashboard';
import PetProfiles, { PetForm } from './pages/PetProfiles';
import CareJobs, { PostJobForm } from './pages/CareJobs';
import Marketplace from './pages/Marketplace';
import CaretakerDashboard from './pages/CaretakerDashboard';
import CaretakerProfile from './pages/CaretakerProfile';
import Earnings from './pages/Earnings';
import Schedule from './pages/Schedule';
import HealthRecords from './pages/HealthRecords';
import FamilyHub from './pages/FamilyHub';
import TimeCapsule from './pages/TimeCapsule';
import AIChecklists from './pages/AIChecklists';

function AppRoutes() {
  const { role } = useApp();

  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        {/* Owner routes */}
        <Route path="/dashboard" element={<OwnerDashboard />} />
        <Route path="/pets" element={<PetProfiles />} />
        <Route path="/pets/new" element={<PetForm />} />
        <Route path="/pets/:id" element={<PetForm />} />
        <Route path="/pets/:id/edit" element={<PetForm />} />
        <Route path="/jobs" element={<CareJobs />} />
        <Route path="/jobs/new" element={<PostJobForm />} />
        <Route path="/health" element={<HealthRecords />} />
        <Route path="/family" element={<FamilyHub />} />
        <Route path="/capsule" element={<TimeCapsule />} />
        <Route path="/checklists" element={<AIChecklists />} />

        {/* Caretaker routes */}
        <Route path="/caretaker" element={<CaretakerDashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/profile" element={<CaretakerProfile />} />
        <Route path="/earnings" element={<Earnings />} />
        <Route path="/schedule" element={<Schedule />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={role === 'owner' ? '/dashboard' : '/caretaker'} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

