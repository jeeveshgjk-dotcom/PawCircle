import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  PawPrint, LayoutDashboard, Briefcase, Heart, Calendar,
  Users, FileText, Camera, Clipboard, IndianRupee, Menu, X,
  LogOut, ChevronDown, ShoppingBag, UserCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

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
  const { role, setRole } = useApp();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = role === 'owner' ? ownerNav : caretakerNav;

  const switchRole = (r: typeof role) => {
    setRole(r);
    setRoleMenuOpen(false);
    navigate(r === 'owner' ? '/dashboard' : '/caretaker');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-sage-100 fixed left-0 top-0 z-40">
        {/* Logo */}
        <div className="p-5 border-b border-sage-100">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-sage-800">PawCircle</span>
              <div className="text-[10px] text-sage-400 font-medium -mt-0.5">Find trusted pet care</div>
            </div>
          </NavLink>
        </div>

        {/* Role Switcher */}
        <div className="p-4 border-b border-sage-100">
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full flex items-center justify-between gap-2 bg-sage-50 rounded-xl px-3 py-2.5 text-sm font-medium text-sage-700 hover:bg-sage-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${role === 'owner' ? 'bg-sage-500' : 'bg-peach-400'}`} />
                <span>{role === 'owner' ? '🏠 Pet Owner' : '🐾 Caretaker'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {roleMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-sage-100 overflow-hidden z-50">
                <button
                  onClick={() => switchRole('owner')}
                  className={`w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-sage-50 transition-colors ${role === 'owner' ? 'font-semibold text-sage-700 bg-sage-50' : 'text-sage-600'}`}
                >
                  🏠 Pet Owner
                  {role === 'owner' && <span className="ml-auto text-xs badge-green">Active</span>}
                </button>
                <button
                  onClick={() => switchRole('caretaker')}
                  className={`w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-peach-50 transition-colors ${role === 'caretaker' ? 'font-semibold text-peach-600 bg-peach-50' : 'text-sage-600'}`}
                >
                  🐾 Pet Caretaker (Riya)
                  {role === 'caretaker' && <span className="ml-auto text-xs badge-peach">Active</span>}
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-[10px] text-center text-sage-400 font-medium">⚡ Local Demo Mode</div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sage-500 text-white shadow-sm'
                    : 'text-sage-600 hover:bg-sage-50 hover:text-sage-800'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sage-100">
          <NavLink to="/" className="flex items-center gap-2 text-sm text-sage-500 hover:text-sage-700 transition-colors">
            <LogOut className="w-4 h-4" />
            Back to Home
          </NavLink>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-sage-100 flex items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sage-500 rounded-lg flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-sage-800">PawCircle</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="text-xs bg-sage-100 text-sage-700 px-3 py-1.5 rounded-lg font-medium"
          >
            {role === 'owner' ? '🏠 Owner' : '🐾 Caretaker'}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-sage-600 hover:bg-sage-50">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Role Menu */}
      {roleMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30" onClick={() => setRoleMenuOpen(false)}>
          <div className="absolute top-16 right-4 bg-white rounded-xl shadow-xl border border-sage-100 overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => switchRole('owner')} className={`w-full px-5 py-3 text-sm text-left hover:bg-sage-50 ${role === 'owner' ? 'font-semibold text-sage-700' : ''}`}>🏠 Pet Owner</button>
            <button onClick={() => switchRole('caretaker')} className={`w-full px-5 py-3 text-sm text-left hover:bg-peach-50 ${role === 'caretaker' ? 'font-semibold text-peach-600' : ''}`}>🐾 Pet Caretaker (Riya)</button>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 pt-16 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <nav className="space-y-0.5 mt-2">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-sage-500 text-white' : 'text-sage-600 hover:bg-sage-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

