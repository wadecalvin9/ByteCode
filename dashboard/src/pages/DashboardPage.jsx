import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Terminal as TerminalIcon, 
  Activity, 
  Cpu, 
  Globe, 
  Clock, 
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi, tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, subValue, icon, color }) => {
  const Icon = icon;
  const colorMap = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    error: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="card p-4 flex items-center gap-4 hover:border-slate-700 transition-all group">
      <div className={`p-2.5 rounded-xl border ${colorMap[color] || colorMap.primary}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5 group-hover:text-slate-400 transition-colors">{title}</p>
        <div className="flex items-end gap-2">
          <h3 className="text-2xl font-black text-white leading-none">{value}</h3>
          <span className="text-[10px] font-bold text-slate-600 mb-0.5">{subValue}</span>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchAgents = async () => {
      try {
        const data = await agentsApi.list();
        if (isMounted) {
          setAgents(data.agents || []);
          setStats(data.stats || { total: 0, active: 0, inactive: 0 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery) ||
    a.id.includes(searchQuery)
  );

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 scrollbar-thin flex flex-col space-y-6">
      {/* Global Intelligence Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <StatCard title="Total Fleet" value={stats.total} subValue="Nodes" icon={Users} color="primary" />
        <StatCard title="Online Assets" value={stats.active} subValue={`${((stats.active/stats.total)*100 || 0).toFixed(0)}%`} icon={Activity} color="success" />
        <StatCard title="Offline Assets" value={stats.inactive} subValue="Zombie" icon={Clock} color="warning" />
        <StatCard title="Task Throughput" value="1.2k" subValue="24h" icon={Zap} color="primary" />
      </div>

      {/* Fleet Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md group">
            <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search fleet by hostname, IP, or UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-primary/40 transition-all placeholder:text-slate-700"
            />
          </div>
          
          <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block" />

          {/* Broadcast Command Bar */}
          <div className="flex-1 max-w-xl relative group hidden lg:block">
            <TerminalIcon className="absolute left-3 top-2.5 w-4 h-4 text-primary animate-pulse" />
            <input 
              type="text" 
              placeholder="Fleet Broadcast: shell 'whoami'..."
              onKeyDown={async (e) => {
                if(e.key === 'Enter' && e.target.value) {
                  const cmd = e.target.value;
                  const onlineAgents = agents.filter(a => a.connection_status === 'online');
                  if(confirm(`Broadcast command to ${onlineAgents.length} online agents?`)) {
                    for(const agent of onlineAgents) {
                      await tasksApi.create(agent.id, 'shell', { command: cmd });
                    }
                    e.target.value = '';
                    alert('Broadcast dispatched successfully.');
                  }
                }
              }}
              className="w-full bg-primary/5 border border-primary/20 rounded-xl pl-10 pr-4 py-2 text-sm text-primary outline-none focus:border-primary/50 transition-all placeholder:text-primary/30 font-mono"
            />
          </div>

          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-primary shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <MoreVertical className="w-4 h-4 rotate-90" />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-primary shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button className="px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-hover transition-all flex items-center gap-3 shadow-lg shadow-primary/20">
          <Zap className="w-4 h-4" />
          Deploy Payload
        </button>
      </div>

      {/* Fleet View Area */}
      <div className="flex-1 min-h-0">
        <div className="card h-full flex flex-col overflow-hidden border-slate-800/50 bg-slate-950/40">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.4em]">Synchronizing Fleet Data</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-800/50">
                <Users className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Match Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-sm">No agents match your current filter or no assets are registered in the fleet.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/80 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-3 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">Asset Hostname</th>
                    <th className="px-6 py-3 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">Architecture</th>
                    <th className="px-6 py-3 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">IP Address</th>
                    <th className="px-6 py-3 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">Last Beacon</th>
                    <th className="px-6 py-3 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider text-right">Command</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredAgents.map((agent) => (
                    <tr 
                      key={agent.id} 
                      className="group hover:bg-primary/[0.02] transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/agents/${agent.id}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${agent.connection_status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
                          <div>
                            <span className="text-sm font-bold text-white block group-hover:text-primary transition-colors leading-none mb-1">{agent.hostname}</span>
                            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">{agent.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-700">{agent.os}</span>
                          <span className="text-[10px] text-slate-600 font-bold">{agent.arch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                        {agent.ip_address || '0.0.0.0'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                          {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 hover:text-primary hover:border-primary/40 transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                {filteredAgents.map((agent) => (
                  <Link 
                    key={agent.id} 
                    to={`/agents/${agent.id}`}
                    className="card p-5 group hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${agent.connection_status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-primary transition-colors leading-none mb-1">{agent.hostname}</h4>
                          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">{agent.id}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        agent.connection_status === 'online' 
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                          : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                      }`}>
                        {agent.connection_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                      <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Architecture</p>
                        <p className="text-xs font-bold text-slate-400">{agent.os} {agent.arch}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Last Seen</p>
                        <p className="text-xs font-bold text-slate-400">{formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
