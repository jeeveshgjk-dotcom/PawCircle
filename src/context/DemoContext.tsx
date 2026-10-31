import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../types';
import { seedDatabase, resetDemoDatabase } from '../db/seed';

interface DemoContextType {
  role: Role;
  setRole: (r: Role) => void;
  householdId: string;
  caretakerId: string;
  resetDemo: () => Promise<void>;
  isResetting: boolean;
}

const DemoContext = createContext<DemoContextType>({
  role: 'owner',
  setRole: () => {},
  householdId: 'hh-alex-001',
  caretakerId: 'ct-riya-001',
  resetDemo: async () => {},
  isResetting: false,
});

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem('pawcircle_demo_role') as Role) || 'owner';
  });
  const [isResetting, setIsResetting] = useState(false);

  // Seed demo data ONLY when demo context mounts (isolated from real accounts)
  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  const setRole = (r: Role) => {
    localStorage.setItem('pawcircle_demo_role', r);
    setRoleState(r);
  };

  const resetDemo = async () => {
    setIsResetting(true);
    try {
      await resetDemoDatabase();
    } catch (err) {
      console.error('Error resetting demo database:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        role,
        setRole,
        householdId: 'hh-alex-001',
        caretakerId: 'ct-riya-001',
        resetDemo,
        isResetting,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}

