import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Zap, 
  Globe, 
  Save, 
  RotateCcw,
  ShieldAlert,
  Terminal,
  Server,
  Fingerprint,
  Lock,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('malleable');
  const [saving, setSaving] = useState(false);
  
  const [malleableConfig, setMalleableConfig] = useState({
    heartbeatInterval: 30,
    jitter: 15,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    customHeaders: 'X-Session-ID: {{ID}}\nAccept-Language: en-US,en;q=0.9',
    requestMethod: 'GET'
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
    }, 1500);
  };

  const tabs = [
    { id: 'malleable', label: 'Malleable C2', icon: Shield },
    { id: 'infrastructure', label: 'Infrastructure', icon: Server },
    { id: 'security', label: 'Security & Access', icon: Lock },
    { id: 'logs', label: 'Audit Systems', icon: Database },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-black overflow-hidden p-8">
      <header className="mb-10 shrink-0">
        <h1 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Infrastructure Configuration</h1>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Configure strategic stealth profiles and global C2 behavior</p>
      </header>

      <div className="flex-1 flex gap-10 min-h-0">
        {/* Navigation Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col gap-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all group ${
                activeTab === tab.id 
                  ? 'bg-primary/10 border-primary/30 text-primary shadow-[0_0_20px_rgba(0,242,255,0.1)]' 
                  : 'bg-surface border-border text-slate-600 hover:text-slate-400 hover:border-slate-800'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-primary' : 'text-slate-700 group-hover:text-slate-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pr-4 pb-20">
          {activeTab === 'malleable' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="dash-card border-border bg-surface !p-10 space-y-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Temporal Signature
                        </h3>
                        <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest max-w-2xl leading-relaxed">Modify beacon frequency and jitter to evade time-series behavioral analysis.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-black border border-border">
                        <Activity className="w-8 h-8 text-slate-800" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3 block">Check-in Interval (S)</span>
                      <input 
                        type="number"
                        value={malleableConfig.heartbeatInterval}
                        onChange={e => setMalleableConfig({...malleableConfig, heartbeatInterval: e.target.value})}
                        className="w-full bg-black border border-border rounded-xl px-6 py-4 text-white outline-none focus:border-primary/40 transition-all font-mono text-sm"
                      />
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3 block">Timing Variance (%)</span>
                      <input 
                        type="number"
                        value={malleableConfig.jitter}
                        onChange={e => setMalleableConfig({...malleableConfig, jitter: e.target.value})}
                        className="w-full bg-black border border-border rounded-xl px-6 py-4 text-white outline-none focus:border-primary/40 transition-all font-mono text-sm"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="dash-card border-border bg-surface !p-10 space-y-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                            <Globe className="w-5 h-5 text-primary" />
                            Transport Layer Masks
                        </h3>
                        <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest max-w-2xl leading-relaxed">Encapsulate C2 protocol within legitimate-looking HTTP traffic patterns.</p>
                    </div>
                </div>

                <div className="space-y-8">
                  <label className="block">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3 block">User-Agent Masquerade</span>
                    <input 
                      type="text"
                      value={malleableConfig.userAgent}
                      onChange={e => setMalleableConfig({...malleableConfig, userAgent: e.target.value})}
                      className="w-full bg-black border border-border rounded-xl px-6 py-4 text-white outline-none focus:border-primary/40 transition-all font-mono text-xs"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-3 block">Custom Transport Headers</span>
                    <textarea 
                      rows={5}
                      value={malleableConfig.customHeaders}
                      onChange={e => setMalleableConfig({...malleableConfig, customHeaders: e.target.value})}
                      className="w-full bg-black border border-border rounded-xl px-6 py-4 text-white outline-none focus:border-primary/40 transition-all font-mono text-xs resize-none"
                      placeholder="Header-Name: Value"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-6 pt-6">
                <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-black border border-border text-slate-600 hover:text-white hover:border-slate-800 transition-all text-[10px] font-black uppercase tracking-widest">
                  <RotateCcw className="w-4 h-4" /> Reset To Default
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-black shadow-[0_10px_30px_rgba(0,242,255,0.2)] hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-20"
                >
                  {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Synchronize
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'malleable' && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-32 pointer-events-none">
              <ShieldAlert className="w-20 h-20 mb-6 text-slate-700" />
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-slate-700">Module Access Restricted</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const Activity = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;

export default SettingsPage;
