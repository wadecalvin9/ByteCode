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
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header Area */}
      <div className="px-8 py-8 border-b border-border bg-background shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Infrastructure Endpoints</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1.5">Managed device inventory & connectivity status</p>
            </div>
          </div>
          
          <div className="flex items-center gap-10">
            <div className="text-right">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Fleet Connectivity Status</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-white leading-none">{stats.active}</span>
                  <span className="text-[9px] font-bold text-success uppercase leading-none">Online</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-slate-400 leading-none">{stats.total}</span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase leading-none">Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Filter fleet by hostname, IP, or session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-border rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 shadow-inner"
            />
          </div>
          <button 
            onClick={fetchAgents}
            className="p-2.5 bg-surface border border-border rounded-lg text-slate-500 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

    <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-6">
        <div className="card border-border bg-transparent">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/20">
                <th className="px-6 py-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Endpoint Hostname</th>
                <th className="px-6 py-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">System Profile</th>
                <th className="px-6 py-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Network Identity</th>
                <th className="px-6 py-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-3.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAgents.length > 0 ? (
                filteredAgents.map((agent) => (
                  <tr key={agent.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/agents/${agent.id}`} className="flex items-center gap-3 group/item">
                        <div className={`w-2 h-2 rounded-full ${agent.connection_status === 'online' ? 'bg-success shadow-[0_0_10px_var(--color-success)]' : 'bg-slate-800'}`} />
                        <div>
                          <div className="text-[13px] font-bold text-white group-hover/item:text-primary transition-colors leading-none">{agent.hostname}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-1.5">{agent.id.substring(0, 12)}...</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{agent.os}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-3 h-3 text-slate-600" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{agent.arch} • PID {agent.pid}</span>
                        </div>
                        {getGeoFromMetadata(agent.metadata) && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-primary/40" />
                            <span className="text-[9px] font-bold text-primary/60 uppercase tracking-wider">
                              {getGeoFromMetadata(agent.metadata).city}, {getGeoFromMetadata(agent.metadata).country}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-mono text-slate-300">{agent.ip_address || '0.0.0.0'}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Internal: {agent.internal_ip || 'unknown'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${agent.connection_status === 'online' ? 'text-success' : 'text-slate-600'}`}>
                          {agent.connection_status === 'online' ? 'Active' : 'Offline'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {agent.connection_status === 'offline' && (
                          <button 
                            onClick={() => handlePurge(agent.id, agent.hostname)}
                            disabled={purging === agent.id}
                            className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Remove Infrastructure Record"
                          >
                            {purging === agent.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <Link 
                          to={`/agents/${agent.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-slate-400 hover:text-white hover:border-primary/50 transition-all shadow-sm"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider">Manage</span>
                          <ChevronRight className="w-3 h-3" />
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
