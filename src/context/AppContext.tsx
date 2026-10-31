import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../types';

interface AppContextType {
  role: Role;
  setRole: (r: Role) => void;
  householdId: string;
  caretakerId: string;
}

const AppContext = createContext<AppContextType>({
  role: 'owner',
  setRole: () => {},
  householdId: 'hh-alex-001',
  caretakerId: 'ct-riya-001',
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem('pawcircle_role') as Role) || 'owner';
  });

  const setRole = (r: Role) => {
    localStorage.setItem('pawcircle_role', r);
    setRoleState(r);
  };

  return (
    <AppContext.Provider value={{
      role,
      setRole,
      householdId: 'hh-alex-001',
      caretakerId: 'ct-riya-001',
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

