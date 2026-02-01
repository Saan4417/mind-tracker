import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Activity, 
  Plus, 
  Settings as SettingsIcon, 
  FileText, 
  ChevronRight,
  Sparkles,
  LogOut,
  Trash2,
  X,
  History,
  TrendingUp,
  Zap,
  AlignLeft,
  Palette,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

import { AppState, View, CheckIn, MoodLevel, EnergyLevel, Pattern, BackgroundTheme } from './types';
import { loadState, addCheckIn, clearData, updateSettings } from './services/storageService';
import { generateDailyInsight, detectPatterns, generateWeeklyReport } from './services/geminiService';
import { Button } from './components/Button';
import { MoodSlider } from './components/MoodSlider';

// --- Main App Component ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [currentView, setCurrentView] = useState<View>('landing');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // Check if onboarded
    if (state.settings.hasOnboarded) {
      setCurrentView('dashboard');
    }

    // --- Dynamic Time-Based Ambient Background ---
    const updateAmbientTheme = () => {
      const root = document.documentElement;
      const theme = state.settings.backgroundTheme;

      let c1, c2, c3;

      if (theme === 'dynamic') {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) {
          // Morning (5am - 12pm): Energizing Dawn
          c1 = 'rgba(14, 165, 233, 0.25)';  // Sky 500
          c2 = 'rgba(20, 184, 166, 0.22)';  // Teal 500
          c3 = 'rgba(251, 146, 60, 0.25)';  // Orange 400
        } else if (hour >= 12 && hour < 17) {
          // Afternoon (12pm - 5pm): Flow State
          c1 = 'rgba(99, 102, 241, 0.25)';  // Indigo 500
          c2 = 'rgba(236, 72, 153, 0.2)';   // Pink 500
          c3 = 'rgba(6, 182, 212, 0.2)';    // Cyan 500
        } else if (hour >= 17 && hour < 21) {
          // Evening (5pm - 9pm): Golden Hour & Unwind
          c1 = 'rgba(139, 92, 246, 0.25)';  // Violet 500
          c2 = 'rgba(244, 63, 94, 0.22)';   // Rose 500
          c3 = 'rgba(37, 99, 235, 0.18)';   // Blue 600
        } else {
          // Night (9pm - 5am): Deep Reflection
          c1 = 'rgba(30, 58, 138, 0.3)';    // Blue 800
          c2 = 'rgba(126, 34, 206, 0.25)';  // Purple 700
          c3 = 'rgba(15, 23, 42, 0.6)';     // Slate 900 (Shadows)
        }
      } else if (theme === 'northern_lights') {
        c1 = 'rgba(16, 185, 129, 0.25)'; // Emerald
        c2 = 'rgba(45, 212, 191, 0.2)';  // Teal
        c3 = 'rgba(139, 92, 246, 0.15)'; // Violet
      } else if (theme === 'sunset') {
        c1 = 'rgba(249, 115, 22, 0.25)'; // Orange
        c2 = 'rgba(244, 63, 94, 0.2)';   // Rose
        c3 = 'rgba(251, 191, 36, 0.15)'; // Amber
      } else if (theme === 'deep_ocean') {
        c1 = 'rgba(59, 130, 246, 0.25)'; // Blue
        c2 = 'rgba(6, 182, 212, 0.2)';   // Cyan
        c3 = 'rgba(30, 64, 175, 0.2)';   // Deep Blue
      } else if (theme === 'lavender_dream') {
        c1 = 'rgba(168, 85, 247, 0.25)'; // Purple
        c2 = 'rgba(236, 72, 153, 0.2)';   // Pink
        c3 = 'rgba(99, 102, 241, 0.15)'; // Indigo
      } else {
        // Fallback
        c1 = 'rgba(99, 102, 241, 0.25)';
        c2 = 'rgba(45, 212, 191, 0.2)';
        c3 = 'rgba(244, 114, 182, 0.15)';
      }

      root.style.setProperty('--orb-1-fill', c1);
      root.style.setProperty('--orb-2-fill', c2);
      root.style.setProperty('--orb-3-fill', c3);
    };

    updateAmbientTheme();
    // Check every minute if dynamic, otherwise single update is enough (but interval is safe)
    const interval = setInterval(updateAmbientTheme, 1000 * 60); 

    // --- Mouse Parallax Effect ---
    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      // Use RequestAnimationFrame for smooth 60fps updates without thrashing
      if (frameId) cancelAnimationFrame(frameId);
      
      frameId = requestAnimationFrame(() => {
         const { innerWidth, innerHeight } = window;
         // Normalize to -1 to 1
         const x = (e.clientX / innerWidth) * 2 - 1;
         const y = (e.clientY / innerHeight) * 2 - 1;
         
         document.documentElement.style.setProperty('--mouse-x', x.toString());
         document.documentElement.style.setProperty('--mouse-y', y.toString());
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(interval);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [state.settings.backgroundTheme]); // Re-run when theme changes

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshState = () => {
    setState(loadState());
  };

  const handleThemeChange = (newTheme: BackgroundTheme) => {
      const newState = updateSettings({ backgroundTheme: newTheme });
      setState(newState);
  };

  // --- Views ---

  if (currentView === 'landing') {
    return (
      <LandingPage 
        onStart={() => {
          updateSettings({ hasOnboarded: true });
          refreshState();
          handleNavigate('dashboard');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen text-human-text flex">
      {/* Desktop Navigation */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-72 border-r border-white/5 flex-col p-8 bg-human-bg/50 backdrop-blur-xl z-50">
        <div className="mb-16 flex items-center gap-3 px-2">
           <div className="w-8 h-8 rounded-lg bg-human-accent flex items-center justify-center text-white">
             <Activity size={18} />
           </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Human<span className="text-human-muted font-normal">Code</span></h1>
        </div>
        <div className="flex flex-col gap-2">
          <SidebarLink icon={<Activity size={18} />} label="Overview" active={currentView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <SidebarLink icon={<Plus size={18} />} label="Check In" active={currentView === 'checkin'} onClick={() => handleNavigate('checkin')} />
          <SidebarLink icon={<TrendingUp size={18} />} label="Analysis" active={currentView === 'patterns'} onClick={() => handleNavigate('patterns')} />
          <SidebarLink icon={<SettingsIcon size={18} />} label="Settings" active={currentView === 'settings'} onClick={() => handleNavigate('settings')} />
        </div>
        
        <div className="mt-auto px-4 py-4 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
            <p className="text-xs text-human-muted mb-2">Current Status</p>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">Active Observer</span>
            </div>
        </div>
      </aside>

      {/* Mobile Bottom Dock */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <nav className="glass-panel rounded-full p-2 flex justify-between items-center shadow-2xl shadow-black/50">
          <NavButton icon={<Activity size={22} />} active={currentView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <NavButton icon={<Sparkles size={22} />} active={currentView === 'patterns'} onClick={() => handleNavigate('patterns')} />
          <div className="mx-2">
             <button 
                onClick={() => handleNavigate('checkin')}
                className="w-14 h-14 bg-human-text text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-90 transition-all"
             >
                <Plus size={28} />
             </button>
          </div>
          <NavButton icon={<SettingsIcon size={22} />} active={currentView === 'settings'} onClick={() => handleNavigate('settings')} />
          <NavButton icon={<AlignLeft size={22} />} active={false} onClick={() => {}} disabled />
        </nav>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-72 w-full max-w-5xl mx-auto p-6 md:p-12 pb-32 md:pb-12 min-h-screen">
        <div className="max-w-3xl mx-auto animate-fade-in">
             {currentView === 'dashboard' && <DashboardView state={state} onCheckIn={() => handleNavigate('checkin')} onViewPatterns={() => handleNavigate('patterns')} />}
             {currentView === 'checkin' && <CheckInView onComplete={() => { refreshState(); handleNavigate('dashboard'); }} onCancel={() => handleNavigate('dashboard')} />}
             {currentView === 'patterns' && <PatternsView state={state} />}
             {currentView === 'settings' && <SettingsView onReset={() => { refreshState(); handleNavigate('landing'); }} onThemeChange={handleThemeChange} currentTheme={state.settings.backgroundTheme} />}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components (Views) ---

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background interaction is handled by the global background elements */}
      
      <div className="relative z-10 max-w-lg flex flex-col items-center animate-fade-in">
        <div className="mb-10 p-4 bg-white/5 rounded-3xl ring-1 ring-white/10 shadow-2xl backdrop-blur-sm">
          <Activity size={48} className="text-human-text" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-semibold mb-6 tracking-tight text-white">
          Human<span className="text-human-muted font-light">Code</span>
        </h1>
        
        <p className="text-lg md:text-xl text-human-muted mb-12 leading-relaxed max-w-sm mx-auto font-light">
          Track your emotional patterns. <br/>
          Non-judgmental insights. <br/>
          <span className="text-human-text font-medium">Just observation.</span>
        </p>
        
        <Button onClick={onStart} size="lg" className="rounded-full w-full md:w-auto px-12 group">
          Begin Observation 
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};

const DashboardView: React.FC<{ state: AppState, onCheckIn: () => void, onViewPatterns: () => void }> = ({ state, onCheckIn, onViewPatterns }) => {
  const lastCheckIn = state.checkIns[0];
  const isToday = lastCheckIn && new Date(lastCheckIn.date).toDateString() === new Date().toDateString();

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-light text-white tracking-tight">Today</h2>
          <p className="text-human-muted mt-2 text-sm uppercase tracking-widest font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Hero Card */}
      {isToday ? (
        <div className="relative group overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-b from-white/10 to-white/0 animate-slide-up">
          <div className="bg-human-card relative rounded-[2rem] p-8 md:p-10 h-full">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity size={120} />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Recorded
                </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-light leading-snug text-white mb-8 max-w-xl">
              "{lastCheckIn.aiInsight}"
            </h3>
            
            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/5">
                <div>
                   <span className="text-xs text-human-muted uppercase tracking-wider block mb-1">Mood</span>
                   <span className="text-xl font-medium text-white">{lastCheckIn.mood} <span className="text-human-muted text-sm font-normal">/ 5</span></span>
                </div>
                <div>
                   <span className="text-xs text-human-muted uppercase tracking-wider block mb-1">Energy</span>
                   <span className="text-xl font-medium text-white">{lastCheckIn.energy}</span>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative group rounded-[2rem] border border-dashed border-white/10 p-12 text-center hover:border-human-accent/30 transition-colors animate-slide-up">
           <div className="max-w-xs mx-auto space-y-6">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-human-muted group-hover:text-white transition-colors">
                   <Plus size={32} />
               </div>
               <div>
                   <h3 className="text-xl font-medium text-white mb-2">No observation yet</h3>
                   <p className="text-human-muted">Take a moment to record your state. No judgment, just data.</p>
               </div>
               <Button onClick={onCheckIn} variant="primary" className="w-full">
                   Record Check-in
               </Button>
           </div>
        </div>
      )}

      {/* History Section */}
      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="text-lg font-medium text-white">Recent History</h3>
          <Button variant="ghost" size="sm" onClick={onViewPatterns} icon={<ChevronRight size={14} className="ml-1" />}>
            View Analysis
          </Button>
        </div>
        
        <div className="space-y-1">
            {state.checkIns.slice(0, 3).map((checkIn, i) => (
                <div 
                    key={checkIn.id} 
                    className="group flex justify-between items-center p-5 hover:bg-white/5 rounded-2xl transition-colors border border-transparent hover:border-white/5"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
                            ${checkIn.mood >= 4 ? 'bg-green-500/10 text-green-400' : 
                              checkIn.mood <= 2 ? 'bg-orange-500/10 text-orange-400' : 
                              'bg-white/5 text-white'}
                        `}>
                            {checkIn.mood}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                                {new Date(checkIn.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric'})}
                            </span>
                            <span className="text-xs text-human-muted">{checkIn.energy} Energy</span>
                        </div>
                    </div>
                    <span className="text-sm text-human-muted max-w-[150px] truncate hidden sm:block text-right">
                        {checkIn.note || "—"}
                    </span>
                </div>
            ))}
            {state.checkIns.length === 0 && (
                <p className="text-human-muted text-sm italic px-2">No history yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};

const CheckInView: React.FC<{ onComplete: () => void, onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<MoodLevel | null>(null);
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mood || !energy) return;
    setIsSubmitting(true);
    const insight = await generateDailyInsight(mood, energy, note);
    const newCheckIn: CheckIn = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      energy,
      note,
      aiInsight: insight,
      createdAt: Date.now()
    };
    addCheckIn(newCheckIn);
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <div className="max-w-xl mx-auto min-h-[60vh] flex flex-col">
       <div className="flex items-center justify-between mb-8">
           <Button variant="ghost" size="sm" onClick={onCancel} className="-ml-2"><X size={20}/></Button>
           <span className="text-xs font-mono text-human-muted uppercase tracking-widest">Step {step} / 3</span>
           <div className="w-8" /> 
       </div>

       <div className="flex-1 flex flex-col justify-center animate-fade-in">
           {step === 1 && (
             <div className="space-y-10">
                <div className="space-y-2">
                    <h3 className="text-3xl font-light text-white">How are you feeling?</h3>
                    <p className="text-human-muted">Take a moment to check in with yourself.</p>
                </div>
                <MoodSlider value={mood} onChange={(val) => { setMood(val); }} />
                <Button className="w-full mt-8" size="lg" disabled={!mood} onClick={() => setStep(2)}>
                    Continue <ChevronRight size={18} />
                </Button>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-10">
                <div className="space-y-2">
                    <h3 className="text-3xl font-light text-white">Energy Level</h3>
                    <p className="text-human-muted">How much capacity do you have right now?</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => setEnergy(lvl)}
                            className={`
                                group relative p-6 rounded-2xl border text-left transition-all duration-300
                                ${energy === lvl 
                                ? 'bg-human-accent text-white border-human-accent shadow-lg shadow-human-accent/20 scale-[1.02]' 
                                : 'bg-white/5 border-white/5 text-human-muted hover:bg-white/10 hover:border-white/10'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium">{lvl}</span>
                                <Zap size={20} className={energy === lvl ? 'text-white' : 'opacity-20'} />
                            </div>
                        </button>
                    ))}
                </div>
                <div className="flex gap-4 pt-4">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1" variant="primary" disabled={!energy} onClick={() => setStep(3)}>Continue</Button>
                </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-10">
                <div className="space-y-2">
                    <h3 className="text-3xl font-light text-white">Context (Optional)</h3>
                    <p className="text-human-muted">Briefly describe what's happening.</p>
                </div>
                <div className="relative">
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="I'm feeling..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[180px] focus:outline-none focus:border-human-accent/50 focus:bg-white/10 transition-all resize-none text-lg text-white placeholder:text-white/20"
                        autoFocus
                    />
                </div>
                <div className="flex gap-4">
                    <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                    <Button className="flex-1" onClick={handleSubmit} isLoading={isSubmitting}>Finish Check-in</Button>
                </div>
             </div>
           )}
       </div>
    </div>
  );
};

const PatternsView: React.FC<{ state: AppState }> = ({ state }) => {
    const [patterns, setPatterns] = useState<{title:string, description:string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
    const [generatingReport, setGeneratingReport] = useState(false);

    // Prepare chart data (chronological)
    const chartData = [...state.checkIns].reverse().map(c => ({
        date: new Date(c.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        mood: c.mood
    }));

    const handleAnalyze = async () => {
        setIsLoading(true);
        try {
            const resultJson = await detectPatterns(state.checkIns);
            const parsed = JSON.parse(resultJson);
            if (Array.isArray(parsed)) setPatterns(parsed);
        } catch (e) {
            console.error("Failed to parse patterns", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        const report = await generateWeeklyReport(state.checkIns);
        setWeeklyReport(report);
        setGeneratingReport(false);
    };

    return (
        <div className="space-y-10 animate-fade-in">
             <header>
                <h2 className="text-4xl font-light text-white tracking-tight">Patterns</h2>
                <p className="text-human-muted mt-2">Observations over time.</p>
            </header>

            {/* Chart */}
            <div className="bg-human-card border border-white/5 p-6 md:p-8 rounded-[2rem] h-80 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-human-card to-transparent pointer-events-none z-10" />
                {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6C7DFF" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6C7DFF" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                            <XAxis dataKey="date" stroke="#525252" tick={{fontSize: 10}} tickLine={false} axisLine={false} dy={10} />
                            <YAxis domain={[1, 5]} stroke="#525252" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#ededed' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="mood" 
                                stroke="#6C7DFF" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorMood)" 
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-human-muted space-y-4">
                        <BarChart2 size={32} className="opacity-20" />
                        <p className="text-sm font-medium opacity-50">Log at least 2 days to visualize trends</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patterns */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-lg font-medium text-white">Recurring Loops</h3>
                        {state.checkIns.length > 2 && (
                            <Button variant="ghost" size="sm" onClick={handleAnalyze} isLoading={isLoading}>
                                <Sparkles size={14} className="mr-2" /> Refresh
                            </Button>
                        )}
                    </div>
                    {patterns.length > 0 ? (
                        <div className="space-y-3">
                            {patterns.map((p, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                    <h4 className="font-medium text-human-accent mb-2 text-sm uppercase tracking-wide">{p.title}</h4>
                                    <p className="text-sm text-human-muted leading-relaxed">{p.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 p-8 rounded-2xl text-center">
                             <p className="text-human-muted text-sm leading-relaxed mb-4">
                                {isLoading ? "Analyzing behavioral data..." : "AI pattern detection requires at least 3 entries to identify loops."}
                             </p>
                             {!isLoading && state.checkIns.length > 2 && (
                                 <Button variant="secondary" size="sm" onClick={handleAnalyze}>Analyze Now</Button>
                             )}
                        </div>
                    )}
                </div>

                {/* Weekly Report */}
                <div className="space-y-4">
                     <div className="flex justify-between items-center px-1">
                        <h3 className="text-lg font-medium text-white">Weekly Report</h3>
                        <Button variant="ghost" size="sm" onClick={handleGenerateReport} isLoading={generatingReport}>
                             Generate
                        </Button>
                    </div>
                    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-6 rounded-2xl h-full min-h-[200px] flex flex-col">
                        <div className="flex items-center gap-3 mb-6 opacity-50">
                             <FileText size={18} />
                             <span className="text-xs uppercase tracking-widest">AI Summary</span>
                        </div>
                        {weeklyReport ? (
                            <div className="prose prose-invert prose-sm">
                                <p className="text-human-text/90 leading-relaxed font-light whitespace-pre-line text-lg">"{weeklyReport}"</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center">
                                <p className="text-sm text-human-muted opacity-50">Generate a summary of your week to find observations.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SettingsView: React.FC<{ 
    onReset: () => void, 
    onThemeChange: (t: BackgroundTheme) => void,
    currentTheme: BackgroundTheme 
}> = ({ onReset, onThemeChange, currentTheme }) => {

    const themes: { id: BackgroundTheme, label: string, colors: string[] }[] = [
        { id: 'dynamic', label: 'Dynamic (Time)', colors: ['#0ea5e9', '#ec4899', '#f59e0b'] },
        { id: 'northern_lights', label: 'Northern Lights', colors: ['#10b981', '#2dd4bf', '#8b5cf6'] },
        { id: 'sunset', label: 'Sunset', colors: ['#f97316', '#f43f5e', '#fbbf24'] },
        { id: 'deep_ocean', label: 'Deep Ocean', colors: ['#3b82f6', '#06b6d4', '#1e40af'] },
        { id: 'lavender_dream', label: 'Lavender Dream', colors: ['#a855f7', '#ec4899', '#6366f1'] },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
             <header>
                <h2 className="text-4xl font-light text-white tracking-tight">Settings</h2>
                <p className="text-human-muted mt-2">Personalize and Manage.</p>
            </header>

            <div className="grid gap-6 max-w-2xl">
                
                {/* Visual Ambiance Section */}
                <div className="bg-human-card border border-white/5 p-8 rounded-3xl space-y-6">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-human-accent">
                             <Palette size={20} />
                         </div>
                         <div>
                            <h3 className="text-xl font-medium text-white">Visual Ambiance</h3>
                            <p className="text-human-muted text-sm">Choose the atmospheric background.</p>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {themes.map(t => (
                            <button
                                key={t.id}
                                onClick={() => onThemeChange(t.id)}
                                className={`
                                    relative p-4 rounded-xl border text-left transition-all group overflow-hidden
                                    ${currentTheme === t.id 
                                        ? 'bg-white/10 border-human-accent ring-1 ring-human-accent/50' 
                                        : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}
                                `}
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <span className={`text-sm font-medium ${currentTheme === t.id ? 'text-white' : 'text-human-muted group-hover:text-white'}`}>
                                        {t.label}
                                    </span>
                                    {t.id === 'dynamic' ? <Clock size={16} className="opacity-50" /> : (
                                        <div className="flex -space-x-2">
                                            {t.colors.map((c, i) => (
                                                <div key={i} className="w-4 h-4 rounded-full ring-2 ring-black/50" style={{ backgroundColor: c }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {currentTheme === t.id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-human-accent/10 to-transparent pointer-events-none" />
                                )}
                            </button>
                        ))}
                     </div>
                </div>

                <div className="bg-human-card border border-white/5 p-8 rounded-3xl space-y-4">
                    <h3 className="text-xl font-medium text-white">Privacy First</h3>
                    <p className="text-human-muted text-sm leading-relaxed">
                        Human Code is designed to be a passive observer. All data is stored locally in your browser for this demo. We do not provide medical advice.
                    </p>
                    <div className="pt-4 flex gap-4">
                         <a href="#" className="text-sm text-human-accent hover:underline">Privacy Policy</a>
                         <a href="#" className="text-sm text-human-accent hover:underline">Terms of Service</a>
                    </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl space-y-6">
                    <div>
                        <h3 className="text-xl font-medium text-red-400 mb-2">Data Management</h3>
                        <p className="text-human-muted text-sm">
                            Permanently remove all local data. This action cannot be undone.
                        </p>
                    </div>
                    <Button 
                        variant="danger" 
                        onClick={() => {
                            if(window.confirm("Are you sure you want to delete all history?")) {
                                clearData();
                                onReset();
                            }
                        }}
                        icon={<Trash2 size={18} />}
                    >
                        Delete All Data
                    </Button>
                </div>
                
                <div className="text-center pt-8">
                    <Button variant="ghost" onClick={onReset} className="mx-auto" icon={<LogOut size={18} />}>
                        Exit Demo
                    </Button>
                    <p className="mt-4 text-xs text-human-muted opacity-30">v1.1.0 Human Code Ai</p>
                </div>
            </div>
        </div>
    );
};

// --- Helpers ---

const NavButton: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, disabled?: boolean }> = ({ 
    icon, active, onClick, disabled
}) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`
            p-4 rounded-full transition-all duration-300 flex items-center justify-center relative
            ${active ? 'text-white' : 'text-human-muted hover:text-human-text'}
            ${disabled ? 'opacity-0 pointer-events-none' : ''}
        `}
    >
        {active && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></span>
        )}
        {icon}
    </button>
);

const SidebarLink: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({
    icon, label, active, onClick
}) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-4 px-4 py-3 rounded-xl w-full transition-all duration-200 group
            ${active 
                ? 'bg-white/10 text-white' 
                : 'text-human-muted hover:text-white hover:bg-white/5'}
        `}
    >
        <span className={`transition-colors ${active ? 'text-human-accent' : 'text-human-muted group-hover:text-white'}`}>
            {icon}
        </span>
        <span className="font-medium text-sm">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-human-accent shadow-[0_0_8px_rgba(108,125,255,0.8)]" />}
    </button>
);

export default App;