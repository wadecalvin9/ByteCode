import React, { useState } from 'react';
import { 
  Terminal, 
  Users, 
  Activity, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck,
  ChevronRight,
  Search,
  Bell,
  User,
  Cpu,
  Globe,
  Database,
  Key,
  Layers
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(() => {
    const userData = localStorage.getItem('bytecode_user');
    return userData ? JSON.parse(userData) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('bytecode_token');
    localStorage.removeItem('bytecode_user');
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Fleet Intelligence',
      items: [
        { name: 'Overview', path: '/', icon: LayoutDashboard },
        { name: 'Node Assets', path: '/agents', icon: Users },
        { name: 'Network Graph', path: '/network', icon: Globe, pro: true },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Payload Foundry', path: '/payloads', icon: Cpu },
        { name: 'Task Auditor', path: '/tasks', icon: Terminal },
        { name: 'Exfiltrated Data', path: '/data', icon: Database, pro: true },
      ]
    },
    {
      title: 'Security & Access',
      items: [
        { name: 'Credential Vault', path: '/vault', icon: Key, pro: true },
        { name: 'OPSEC Settings', path: '/security', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 flex flex-col bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-slate-900/50">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30 rotate-3">
            <Layers className="text-white w-5 h-5 -rotate-3" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white tracking-tighter leading-none italic uppercase">BYTECODE</h2>
            <span className="text-[9px] text-primary font-mono font-bold tracking-[0.2em] uppercase">Operations</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto scrollbar-thin">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] px-3">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.pro ? '#' : item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${
                        isActive 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      } ${item.pro ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-600 group-hover:text-slate-400'}`} />
                      <span className="text-xs font-bold tracking-tight">{item.name}</span>
                      {item.pro && (
                        <span className="ml-auto text-[8px] font-black bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-slate-700">PRO</span>
                      )}
                      {isActive && <div className="absolute right-2 w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(37,99,235,0.8)]" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-900 bg-slate-950/50">
          <div className="p-3 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0 shadow-inner">
                <User className="text-slate-400 w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate uppercase tracking-tight">{user?.username || 'Operator'}</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Level 4 Clearance</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xl bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all text-[10px] font-black uppercase tracking-[0.1em]"
            >
              <LogOut className="w-3.5 h-3.5" />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm group">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search fleet intelligence..." 
                className="w-full bg-black/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-primary/40 focus:bg-black/60 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>
          <div className="flex items-center gap-8 ml-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">C2 System Normal</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full border border-slate-950" />
              </button>
              <button className="text-slate-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
