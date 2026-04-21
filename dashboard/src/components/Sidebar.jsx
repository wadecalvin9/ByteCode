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
  Cpu
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

  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Payloads', path: '/payloads', icon: Cpu },
    { name: 'Tasks', path: '/tasks', icon: Terminal },
    { name: 'Security', path: '/security', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 border-r border-slate-900 flex flex-col bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="p-4 flex items-center gap-3 border-b border-slate-900/50">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-white tracking-tighter leading-none italic">BYTECODE</h2>
            <span className="text-[9px] text-primary font-mono font-bold tracking-widest uppercase">Console</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group text-xs font-semibold uppercase tracking-tight ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
                <span>{item.name}</span>
                {isActive && <ChevronRight className="ml-auto w-3 h-3 flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-900">
          <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-900/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                <User className="text-slate-400 w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.username || 'Operator'}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">Level 4</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-slate-800/50 hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-all text-[10px] font-bold uppercase tracking-wider"
            >
              <LogOut className="w-3 h-3" />
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Header */}
        <header className="h-14 border-b border-slate-900 flex items-center justify-between px-6 bg-slate-950 z-20">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-600" />
              <input 
                type="text" 
                placeholder="Search infrastructure..." 
                className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-xs text-white outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 ml-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Server v1.0.4</span>
            </div>
            <button className="relative text-slate-500 hover:text-white transition-colors p-1.5 rounded-lg">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full border border-slate-950" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 scrollbar-thin">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sidebar;
