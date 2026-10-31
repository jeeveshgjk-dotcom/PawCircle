import { useNavigate, Link } from 'react-router-dom';
import { PawPrint, Star, Shield, Clock, ArrowRight, Heart, Briefcase, CheckCircle, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-950/5">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">PawCircle</span>
              <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider -mt-0.5">Vibrant Pet Care</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/demo" className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50/80">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Explore Demo
            </Link>
            {user ? (
              <Link to="/dashboard" className="btn-primary text-xs py-2 px-4 shadow-emerald-500/20">
                My Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-xs hidden sm:flex items-center gap-1.5 text-slate-700 hover:text-emerald-700">
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-16 lg:pt-24 lg:pb-24">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-24 right-1/4 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-orange-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold px-3.5 py-1.5 rounded-full mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Live Supabase Cloud & Public Demo Sandbox
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                Find Trusted Care<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500">
                  for Your Beloved Pets
                </span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 font-medium">
                Post care opportunities, get applications from experienced caretakers, track every routine with live checklists, and keep your pet's memories forever.
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 mb-8">
                <Link
                  to="/signup"
                  className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-7 shadow-lg shadow-emerald-500/25"
                >
                  Create Free Account <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/demo"
                  className="btn-secondary flex items-center justify-center gap-2 text-base py-3.5 px-7 shadow-lg shadow-orange-500/25"
                >
                  <Sparkles className="w-4 h-4" /> Explore Public Demo
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Free to use</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Private cloud database</div>
                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Instant demo sandbox</div>
              </div>
            </div>

            {/* Hero cards */}
            <div className="relative hidden lg:block">
              <div className="absolute -top-6 -left-4 w-72 card shadow-card-hover border-emerald-100 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3.5 mb-3">
                  <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=64&h=64&fit=crop" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30" alt="Bruno" />
                  <div>
                    <div className="font-bold text-slate-900 text-base">Bruno</div>
                    <div className="text-xs text-slate-500">Golden Retriever • 3 yrs</div>
                    <div className="badge-green mt-1 text-[11px]">Cared for ✓</div>
                  </div>
                </div>
                <div className="text-xs text-slate-600 bg-emerald-50/70 rounded-xl p-2.5 border border-emerald-100">
                  🐾 Next: Evening walk at 6:00 PM
                </div>
              </div>
              <div className="absolute top-20 right-0 w-64 card shadow-card-hover border-orange-100 hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-3 mb-2.5">
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop" className="w-11 h-11 rounded-full object-cover ring-2 ring-orange-500/30" alt="Riya" />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">Riya Sharma</div>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">★★★★★ <span className="text-slate-500 font-normal">4.9</span></div>
                  </div>
                </div>
                <div className="text-xs text-slate-700 font-medium">Applied for weekend care</div>
                <div className="text-xs font-bold text-emerald-700 mt-1">₹800 · Selected ✓</div>
              </div>
              <div className="absolute bottom-2 left-6 w-60 card shadow-card-hover border-emerald-100 hover:scale-[1.02] transition-transform">
                <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Earnings (Live)</div>
                <div className="text-2xl font-black text-emerald-700">₹800</div>
                <div className="badge-yellow mt-1.5">Approved & Verified</div>
              </div>
              <div className="w-full h-80 bg-gradient-to-br from-emerald-100/70 via-teal-50 to-orange-100/50 rounded-3xl border border-emerald-200/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20 border-y border-emerald-950/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3 tracking-tight">Everything in One Place</h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto font-medium">From posting a care job to tracking every meal and walk — PawCircle has it all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Briefcase, color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60', title: 'Post Care Jobs', desc: 'Describe what your pet needs, set a budget, and get applications from verified caretakers.' },
              { icon: Star, color: 'bg-amber-50 text-amber-600 border border-amber-200/60', title: 'Review & Hire', desc: 'See applicant profiles, read messages, and choose the right caretaker with complete confidence.' },
              { icon: Clock, color: 'bg-orange-50 text-orange-600 border border-orange-200/60', title: 'Track Every Routine', desc: 'Feeding, walks, grooming — every task logged with timestamps and completion notes.' },
              { icon: Heart, color: 'bg-rose-50 text-rose-600 border border-rose-200/60', title: 'Health Records', desc: 'Vaccinations, vet visits, grooming history — all organised and with due-date reminders.' },
              { icon: Shield, color: 'bg-teal-50 text-teal-600 border border-teal-200/60', title: 'Earnings & Activity', desc: 'Caretakers track agreed amounts, approval status, and payout history transparently.' },
              { icon: PawPrint, color: 'bg-purple-50 text-purple-600 border border-purple-200/60', title: 'Pet Time Capsule', desc: 'Preserve photos, milestones, and memories. Turn a completed care task into a memory.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card-hover">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 shadow-xs`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-emerald-50 border border-orange-200/70 rounded-3xl p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 shadow-sm">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-100/80 px-2.5 py-0.5 rounded-full mb-2 border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-600" /> Instant Sandbox
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">⚡ Try the Public Demo Sandbox</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Experience PawCircle immediately with pre-loaded fictional data (Bruno, Luna, and caretaker Riya). Switch between Owner and Caretaker roles with no registration needed.
            </p>
          </div>
          <Link to="/demo" className="btn-secondary whitespace-nowrap flex-shrink-0 shadow-orange-500/25">
            Explore Demo Now →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 py-16 text-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">Ready to manage your own pets?</h2>
          <p className="text-emerald-100 text-base mb-8 max-w-xl mx-auto font-medium">Create your free PawCircle account backed by Supabase cloud storage.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
              Create Free Account
            </Link>
            <Link to="/demo" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
              Open Public Demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="text-center py-8 text-xs text-slate-400 font-medium">
        © 2026 PawCircle · Find trusted care. Track every task. Reward every effort.
      </footer>
    </div>
  );
}
