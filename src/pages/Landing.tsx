import { useNavigate } from 'react-router-dom';
import { PawPrint, Star, Shield, Clock, ArrowRight, Heart, Briefcase, CheckCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Landing() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const handleGetStarted = (role: 'owner' | 'caretaker') => {
    setRole(role);
    navigate(role === 'owner' ? '/dashboard' : '/caretaker');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-sage-500 rounded-xl flex items-center justify-center shadow-sm">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-sage-800">PawCircle</span>
              <div className="text-[10px] text-sage-400 -mt-0.5">Find trusted pet care</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleGetStarted('caretaker')} className="btn-ghost text-sm hidden sm:block">
              Become a Caretaker
            </button>
            <button onClick={() => handleGetStarted('owner')} className="btn-primary text-sm py-2">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 lg:pt-24 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-peach-100 text-peach-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              🐾 Pet care marketplace — local demo
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-sage-900 leading-tight mb-5">
              Find Trusted Care<br />
              <span className="text-sage-500">for Your Beloved Pets</span>
            </h1>
            <p className="text-sage-600 text-lg leading-relaxed mb-8">
              Post care opportunities, get applications from experienced caretakers, track every routine, and keep your pet's memories forever — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <button onClick={() => handleGetStarted('owner')} className="btn-primary flex items-center justify-center gap-2 text-base py-3 px-7">
                I'm a Pet Owner <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => handleGetStarted('caretaker')} className="btn-outline flex items-center justify-center gap-2 text-base py-3 px-7">
                I'm a Caretaker <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-5 text-sm text-sage-500">
              <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-sage-400" /> Free to use</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-sage-400" /> Local & private</div>
              <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-sage-400" /> No signup needed</div>
            </div>
          </div>

          {/* Hero cards */}
          <div className="relative hidden lg:block">
            <div className="absolute -top-6 -left-4 w-64 card shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=56&h=56&fit=crop" className="w-14 h-14 rounded-xl object-cover" alt="Bruno" />
                <div>
                  <div className="font-semibold text-sage-800">Bruno</div>
                  <div className="text-xs text-sage-400">Golden Retriever • 3 yrs</div>
                  <div className="badge-green mt-1">Cared for ✓</div>
                </div>
              </div>
              <div className="text-xs text-sage-500">Next: Evening walk at 6:00 PM</div>
            </div>
            <div className="absolute top-16 right-0 w-60 card shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" className="w-10 h-10 rounded-full object-cover" alt="Riya" />
                <div>
                  <div className="font-semibold text-sage-800 text-sm">Riya Sharma</div>
                  <div className="flex items-center gap-0.5 text-xs text-yellow-500">★★★★★ <span className="text-sage-400 ml-1">4.9</span></div>
                </div>
              </div>
              <div className="text-xs text-sage-600 font-medium">Applied for weekend care</div>
              <div className="text-xs text-sage-400">₹800 · Selected ✓</div>
            </div>
            <div className="absolute bottom-0 left-8 w-56 card shadow-lg">
              <div className="text-xs font-semibold text-sage-700 mb-2">Earnings (Demo)</div>
              <div className="text-2xl font-bold text-sage-600">₹800</div>
              <div className="badge-yellow mt-1">Pending approval</div>
            </div>
            <div className="w-full h-64 bg-gradient-to-br from-sage-100 to-peach-50 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-sage-800 mb-3">Everything in One Place</h2>
            <p className="text-sage-500 text-base max-w-lg mx-auto">From posting a care job to tracking every meal and walk — PawCircle has it all.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Briefcase, color: 'bg-sage-100 text-sage-600', title: 'Post Care Jobs', desc: 'Describe what your pet needs, set a budget, and get applications from local caretakers.' },
              { icon: Star, color: 'bg-yellow-100 text-yellow-600', title: 'Review & Hire', desc: 'See applicant profiles, read messages, and choose the right caretaker with confidence.' },
              { icon: Clock, color: 'bg-peach-100 text-peach-500', title: 'Track Every Routine', desc: 'Feeding, walks, grooming — every task logged with timestamps and completion notes.' },
              { icon: Heart, color: 'bg-red-100 text-red-400', title: 'Health Records', desc: 'Vaccinations, vet visits, grooming history — all organised and with due-date reminders.' },
              { icon: Shield, color: 'bg-blue-100 text-blue-500', title: 'Simulated Earnings', desc: 'Caretakers track agreed amounts, approval status, and demo-paid history — zero real payments.' },
              { icon: PawPrint, color: 'bg-purple-100 text-purple-500', title: 'Pet Time Capsule', desc: 'Preserve photos, milestones, and memories. Turn a completed care task into a memory.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="card-hover">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sage-800 mb-2">{title}</h3>
                <p className="text-sm text-sage-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Notice */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-peach-50 border border-peach-200 rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-5">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-peach-700 mb-2">⚡ Local Demo Mode</h3>
            <p className="text-sm text-peach-600 leading-relaxed">
              PawCircle is a single-device prototype. All data is stored locally in your browser. No real money is transferred, no real accounts exist, and nothing is sent over the internet. Demo role switcher only — not real access control.
            </p>
          </div>
          <button onClick={() => handleGetStarted('owner')} className="btn-secondary whitespace-nowrap flex-shrink-0">
            Explore Demo →
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sage-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to try PawCircle?</h2>
          <p className="text-sage-200 mb-8">Bruno and Luna are already waiting. Jump into the demo with realistic data pre-loaded.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => handleGetStarted('owner')} className="bg-white text-sage-700 hover:bg-sage-50 font-semibold px-8 py-3.5 rounded-xl transition-all shadow hover:shadow-md">
              🏠 Enter as Pet Owner
            </button>
            <button onClick={() => handleGetStarted('caretaker')} className="bg-peach-400 hover:bg-peach-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow hover:shadow-md">
              🐾 Enter as Caretaker (Riya)
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-sm text-sage-400">
        © 2026 PawCircle · Local demo · No real payments · Find trusted care. Track every task. Reward every effort.
      </footer>
    </div>
  );
}

