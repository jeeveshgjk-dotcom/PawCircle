import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PawPrint, LayoutDashboard, Briefcase, Heart, Calendar,
  Users, Camera, Clipboard, IndianRupee, Menu, X,
  LogOut, ShoppingBag, UserCircle, Cloud, ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ownerNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/pets', icon: PawPrint, label: 'My Pets' },
  { to: '/jobs', icon: Briefcase, label: 'Care Jobs' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/health', icon: Heart, label: 'Health Records' },
  { to: '/family', icon: Users, label: 'Family Hub' },
  { to: '/capsule', icon: Camera, label: 'Time Capsule' },
  { to: '/checklists', icon: Clipboard, label: 'AI Checklists' },
];

const caretakerNav = [
  { to: '/caretaker', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Browse Jobs' },
  { to: '/profile', icon: UserCircle, label: 'My Profile' },
  { to: '/earnings', icon: IndianRupee, label: 'Earnings' },
  { to: '/schedule', icon: Calendar, label: 'My Schedule' },
];

export function Navbar() {
  const { user, profile, household, userHouseholds, switchHousehold, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const effectiveRole = profile?.role || 'owner';
  const navItems = effectiveRole === 'owner' ? ownerNav : caretakerNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-emerald-950/10 shadow-[2px_0_20px_-10px_rgba(16,185,129,0.08)] fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-emerald-950/5">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">PawCircle</span>
              <div className="text-[10px] text-emerald-600 font-bold tracking-wide uppercase -mt-0.5">Private Account</div>
            </div>
          </NavLink>
        </div>

        {/* User Account Section */}
        <div className="p-4 border-b border-emerald-950/5 bg-gradient-to-br from-emerald-50/50 via-white to-orange-50/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-800 truncate">{displayName}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Cloud className="w-2.5 h-2.5 text-emerald-600" /> Live
            </span>
          </div>

          {effectiveRole === 'owner' && userHouseholds && userHouseholds.length > 1 ? (
            <div className="mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Active Household:
              </label>
              <select
                className="w-full mt-1 text-xs bg-white border border-emerald-200/80 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium outline-none cursor-pointer focus:ring-2 focus:ring-emerald-400 transition-all"
                value={household?.id || ''}
                onChange={e => switchHousehold(e.target.value)}
              >
                {userHouseholds.map(h => (
                  <option key={h.id} value={h.id}>
                    🏠 {h.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 truncate mb-2 font-medium">
              {effectiveRole === 'owner' ? (household?.name || 'My Household') : 'Pet Caretaker'}
            </div>
          )}

          <div className="badge-green text-[10px] py-1 px-2.5 shadow-sm">
            {effectiveRole === 'owner' ? '🏠 Pet Owner' : '🐾 Caretaker'}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-600 hover:bg-emerald-50/70 hover:text-emerald-800'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-emerald-950/5">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2.5 rounded-xl transition-colors border border-rose-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-emerald-950/5 flex items-center justify-between px-4 py-3 shadow-sm">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-lg flex items-center justify-center text-white shadow-sm shadow-emerald-500/25">
            <PawPrint className="w-4 h-4" />
          </div>
          <span className="text-base font-extrabold text-slate-900 tracking-tight">PawCircle</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold truncate max-w-[120px]">
            {displayName}
          </span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-slate-600 hover:bg-emerald-50">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-4 pt-16 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 p-3 bg-gradient-to-br from-emerald-50/70 to-orange-50/40 rounded-xl border border-emerald-100">
              <div className="font-bold text-sm text-slate-800">{displayName}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email}</div>

              {effectiveRole === 'owner' && userHouseholds && userHouseholds.length > 1 ? (
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Household:
                  </label>
                  <select
                    className="w-full mt-1 text-xs bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-slate-800 font-medium outline-none"
                    value={household?.id || ''}
                    onChange={e => switchHousehold(e.target.value)}
                  >
                    {userHouseholds.map(h => (
                      <option key={h.id} value={h.id}>
                        🏠 {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 truncate mt-1">
                  {effectiveRole === 'owner' ? (household?.name || 'My Household') : 'Pet Caretaker'}
                </div>
              )}

              <div className="badge-green text-[10px] mt-2 py-0.5 px-2">
                {effectiveRole === 'owner' ? '🏠 Pet Owner' : '🐾 Caretaker'}
              </div>
            </div>

            <nav className="space-y-1 mb-6">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-600 hover:bg-emerald-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="w-full text-xs text-rose-600 font-bold py-2.5 rounded-xl hover:bg-rose-50 text-center border border-rose-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
