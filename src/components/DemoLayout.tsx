import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet, Link } from 'react-router-dom';
import {
  PawPrint, LayoutDashboard, Briefcase, Heart, Calendar,
  Users, FileText, Camera, Clipboard, IndianRupee, Menu, X,
  LogOut, ChevronDown, ShoppingBag, UserCircle, RotateCcw,
  Sparkles, ArrowLeft, LogIn, UserPlus
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';

const demoOwnerNav = [
  { to: '/demo/dashboard', icon: LayoutDashboard, label: 'Demo Dashboard' },
  { to: '/demo/pets', icon: PawPrint, label: 'Bruno & Luna' },
  { to: '/demo/jobs', icon: Briefcase, label: 'Care Jobs' },
  { to: '/demo/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/demo/health', icon: Heart, label: 'Health Records' },
  { to: '/demo/family', icon: Users, label: 'Family Hub' },
  { to: '/demo/capsule', icon: Camera, label: 'Time Capsule' },
  { to: '/demo/checklists', icon: Clipboard, label: 'AI Checklists' },
];

const demoCaretakerNav = [
  { to: '/demo/caretaker', icon: LayoutDashboard, label: 'Riya\'s Dashboard' },
  { to: '/demo/marketplace', icon: ShoppingBag, label: 'Browse Jobs' },
  { to: '/demo/profile', icon: UserCircle, label: 'Riya\'s Profile' },
  { to: '/demo/earnings', icon: IndianRupee, label: 'Earnings (Demo)' },
  { to: '/demo/schedule', icon: Calendar, label: 'Schedule' },
];

export function DemoLayout() {
  const { role, setRole, resetDemo, isResetting } = useDemo();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = role === 'owner' ? demoOwnerNav : demoCaretakerNav;

  const handleRoleSwitch = (r: 'owner' | 'caretaker') => {
    setRole(r);
    setRoleMenuOpen(false);
    navigate(r === 'owner' ? '/demo/dashboard' : '/demo/caretaker');
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the public demo? This will restore fictional pets (Bruno & Luna), sample jobs, and Riya\'s profile to their initial states. Real user accounts are not affected.'
    );
    if (confirmed) {
      await resetDemo();
      navigate('/demo/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Persistent Demo Notice Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-peach-500 to-amber-600 text-white text-xs py-2 px-4 shadow-sm fixed top-0 left-0 right-0 z-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px]">
            Public Demo
          </span>
          <span className="font-medium">
            Fictional sample data for preview only. Actions do not save to cloud.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg font-medium transition-colors"
            title="Restore sample demo data"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            {isResetting ? 'Resetting...' : 'Reset Demo Data'}
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="bg-white text-amber-800 hover:bg-amber-50 px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Return to My Account
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hover:underline font-semibold text-white/90"
              >
                Sign In
              </Link>
              <span>•</span>
              <Link
                to="/signup"
                className="bg-white text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg font-semibold transition-colors"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-sage-100 fixed left-0 top-10 bottom-0 z-40">
        <div className="p-5 border-b border-sage-100">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-peach-500 rounded-xl flex items-center justify-center shadow-sm">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-sage-800">PawCircle</span>
              <div className="text-[10px] text-peach-600 font-semibold -mt-0.5">Sample Sandbox Demo</div>
            </div>
          </NavLink>
        </div>

        {/* Demo Role Switcher */}
        <div className="p-4 border-b border-sage-100 bg-peach-50/40">
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2.5 text-sm font-medium text-sage-700 hover:bg-peach-50 transition-colors border border-peach-200"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${role === 'owner' ? 'bg-sage-500' : 'bg-peach-500'}`} />
                <span>{role === 'owner' ? '🏠 Demo Owner (Alex)' : '🐾 Demo Caretaker (Riya)'}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {roleMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-sage-100 overflow-hidden z-50">
                <button
                  onClick={() => handleRoleSwitch('owner')}
                  className={`w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-sage-50 transition-colors ${role === 'owner' ? 'font-semibold text-sage-700 bg-sage-50' : 'text-sage-600'}`}
                >
                  🏠 Demo Owner (Alex)
                  {role === 'owner' && <span className="ml-auto text-xs badge-green">Active</span>}
                </button>
                <button
                  onClick={() => handleRoleSwitch('caretaker')}
                  className={`w-full px-4 py-3 text-sm text-left flex items-center gap-2 hover:bg-peach-50 transition-colors ${role === 'caretaker' ? 'font-semibold text-peach-600 bg-peach-50' : 'text-sage-600'}`}
                >
                  🐾 Demo Caretaker (Riya)
                  {role === 'caretaker' && <span className="ml-auto text-xs badge-peach">Active</span>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-peach-500 text-white shadow-sm'
                    : 'text-sage-600 hover:bg-peach-50 hover:text-sage-800'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sage-100 space-y-2">
          <Link
            to="/signup"
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold bg-sage-500 hover:bg-sage-600 text-white py-2 rounded-xl transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" /> Create Real Account
          </Link>
          <NavLink to="/" className="flex items-center gap-2 text-xs text-sage-500 hover:text-sage-700 py-1 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Back to Public Home
          </NavLink>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="lg:hidden fixed top-10 left-0 right-0 z-40 bg-white border-b border-sage-100 flex items-center justify-between px-4 py-3">
        <NavLink to="/demo" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-peach-500 rounded-lg flex items-center justify-center">
            <PawPrint className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-sage-800">PawCircle Demo</span>
        </NavLink>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRoleSwitch(role === 'owner' ? 'caretaker' : 'owner')}
            className="text-xs bg-peach-100 text-peach-700 px-3 py-1.5 rounded-lg font-medium"
          >
            Switch to {role === 'owner' ? 'Caretaker' : 'Owner'}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-sage-600 hover:bg-sage-50">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-4 pt-16 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 p-3 bg-peach-50 rounded-xl text-center">
              <div className="text-xs font-bold text-peach-700 uppercase">Public Demo Mode</div>
              <div className="text-xs text-peach-600 mt-0.5">Exploring sample dataset</div>
            </div>

            <nav className="space-y-0.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-peach-500 text-white' : 'text-sage-600 hover:bg-peach-50'
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

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-24 lg:pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

