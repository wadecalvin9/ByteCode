import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Trash2, 
  ChevronRight, 
  Activity, 
  Monitor, 
  Cpu, 
  ShieldCheck,
  Loader2,
  RefreshCw,
  Skull,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [purging, setPurging] = useState(null);

  const fetchAgents = async () => {
    try {
      const data = await agentsApi.list();
      setAgents(data.agents);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchAgents();
    };
    init();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePurge = async (id, hostname) => {
    if (!window.confirm(`Permanently remove ${hostname} from the database? This will also delete all associated exfiltration data.`)) return;
    
    setPurging(id);
    try {
      await agentsApi.purge(id);
      setAgents(prev => prev.filter(a => a.id !== id));
      // Refresh stats
      const data = await agentsApi.list();
      setStats(data.stats);
    } catch (err) {
      alert('Failed to purge agent: ' + err.message);
    } finally {
      setPurging(null);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery) ||
    a.id.includes(searchQuery)
  );

  const getGeoFromMetadata = (metadataStr) => {
    try {
      const metadata = JSON.parse(metadataStr || '{}');
      return metadata.geo;
    } catch {
      return null;
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synchronizing Fleet Assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header Area */}
      <div className="px-8 pt-10 pb-6 border-b border-slate-900 bg-slate-950/50 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Node Assets</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Strategic Fleet Management Console</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operational Strength</div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white">{stats.active}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">Online</span>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <span className="text-xl font-black text-slate-400">{stats.total}</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase">Total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search fleet by hostname, IP, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:bg-slate-900 transition-all placeholder:text-slate-700"
            />
          </div>
          <button 
            onClick={fetchAgents}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Asset Table */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6">
        <div className="card border-slate-900 bg-slate-950/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Hostname</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Specifications</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Identity</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pulse Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Mission Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <Link to={`/agents/${agent.id}`} className="flex items-center gap-4 group/item">
                        <div className={`w-2.5 h-2.5 rounded-full ${agent.connection_status === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
                        <div>
                          <div className="text-sm font-black text-white group-hover/item:text-primary transition-colors">{agent.hostname}</div>
                          <div className="text-[9px] font-mono text-slate-600 mt-0.5">{agent.id}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3 h-3 text-slate-700" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{agent.os}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3 h-3 text-slate-700" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{agent.arch} • PID {agent.pid}</span>
                        </div>
                        {getGeoFromMetadata(agent.metadata) && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3 h-3 text-primary/50" />
                            <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">
                              {getGeoFromMetadata(agent.metadata).city}, {getGeoFromMetadata(agent.metadata).country}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-mono text-slate-300">{agent.ip_address || '0.0.0.0'}</div>
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Internal: {agent.internal_ip || 'unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${agent.connection_status === 'online' ? 'text-emerald-500' : 'text-slate-600'}`}>
                          {agent.connection_status === 'online' ? 'Operational' : 'Zombified'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">
                          Seen {formatDistanceToNow(new Date(agent.last_seen))} ago
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {agent.connection_status === 'offline' && (
                          <button 
                            onClick={() => handlePurge(agent.id, agent.hostname)}
                            disabled={purging === agent.id}
                            className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                            title="Purge Zombie Node"
                          >
                            {purging === agent.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
                          </button>
                        )}
                        <Link 
                          to={`/agents/${agent.id}`}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tactical Interface</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-8 h-8 text-slate-800 animate-pulse" />
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">No Assets Detected in this sector</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentsPage;
