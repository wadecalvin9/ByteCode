import React, { useEffect, useState, useMemo } from 'react';
import {
  Users, Terminal as TerminalIcon, Loader2, Search,
  Bell, Monitor, Shield, Wifi, WifiOff, Send, Server,
  ChevronRight, Activity, MoreHorizontal, Skull
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { agentsApi, tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

/* ── Stat Card ─────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color, accent }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className={`stat-card__icon stat-card__icon--${color}`}>
      {Icon && <Icon size={16} />}
    </div>
    <MoreHorizontal className="stat-card__menu" />
    <p className="stat-card__label">{title}</p>
    <h3 className="stat-card__value">{value}</h3>
    {accent && <span className="stat-card__accent">{accent}</span>}
  </div>
);

/* ── Infrastructure Monitor ────────────────────────────── */
const InfrastructureMonitor = ({ agents }) => {
  const hostStats = useMemo(() => {
    const stats = {};
    agents.forEach(agent => {
      let pool = [];
      try { pool = typeof agent.server_pool === 'string' ? JSON.parse(agent.server_pool) : (agent.server_pool || []); }
      catch { pool = []; }
      if (pool.length === 0) pool = [window.location.origin];
      pool.forEach(host => {
        if (!stats[host]) stats[host] = { host, agents: 0, online: 0 };
        stats[host].agents++;
        if (agent.connection_status === 'online') stats[host].online++;
      });
    });
    return Object.values(stats).sort((a, b) => b.agents - a.agents);
  }, [agents]);

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">Infrastructure</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={13} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resilience Monitor</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {hostStats.length === 0 ? (
          <div className="dash-empty"><p>No infrastructure data</p></div>
        ) : (
          hostStats.map((stat, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.online > 0 ? 'var(--color-success)' : 'var(--color-text-dim)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{stat.host}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)' }}>{stat.online}/{stat.agents}</span>
              </div>
              <div style={{ height: 3, background: 'var(--color-border-muted)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-primary)', width: `${(stat.online / (stat.agents || 1)) * 100}%`, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{hostStats.length} host{hostStats.length !== 1 ? 's' : ''}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>{hostStats.filter(s => s.online > 0).length} reachable</span>
      </div>
    </div>
  );
};

/* ── OS Distribution ───────────────────────────────────── */
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
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];
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
            <circle key={i} cx="18" cy="18" r="14" fill="none"
              stroke={seg.color} strokeWidth="4"
              strokeDasharray={`${seg.percent} ${100 - seg.percent}`}
              strokeDashoffset={-seg.offset} className="donut-segment"
            />
          ))}
        </svg>
        <div className="donut-center">
          <span className="donut-total">{total}</span>
          <span className="donut-label">nodes</span>
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
        {segments.length === 0 && <span style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>No data</span>}
      </div>
    </div>
  );
};

/* ── Quick Dispatch ────────────────────────────────────── */
const QuickDispatch = ({ agents }) => {
  const [command, setCommand] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const handleBroadcast = async () => {
    if (!command.trim()) return;
    const online = agents.filter(a => a.connection_status === 'online');
    if (online.length === 0) return alert('No online agents.');
    if (!confirm(`Broadcast to ${online.length} node(s)?`)) return;
    setBroadcasting(true);
    try {
      for (const agent of online) await tasksApi.create(agent.id, 'shell', { command });
      setCommand('');
    } catch (err) { console.error(err); }
    finally { setBroadcasting(false); }
  };

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">Quick Dispatch</h4>
      </div>
      <p className="dispatch-hint">Broadcast a shell command to all online nodes</p>
      <div className="dispatch-agents">
        {agents.filter(a => a.connection_status === 'online').slice(0, 5).map((a, i) => (
          <div key={a.id} className="dispatch-agent-avatar" title={a.hostname} style={{ zIndex: 5 - i }}>
            <Monitor size={12} />
          </div>
        ))}
        {agents.filter(a => a.connection_status === 'online').length > 5 && (
          <span className="dispatch-agent-more">+{agents.filter(a => a.connection_status === 'online').length - 5}</span>
        )}
        {agents.filter(a => a.connection_status === 'online').length === 0 && (
          <span style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>No online nodes</span>
        )}
      </div>
      <div className="dispatch-input-wrap" style={{ marginTop: 'auto' }}>
        <TerminalIcon className="dispatch-input-icon" size={13} />
        <input type="text" value={command} onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleBroadcast()}
          placeholder="shell command..." className="dispatch-input" />
        <button onClick={handleBroadcast} disabled={broadcasting || !command.trim()} className="dispatch-send-btn">
          {broadcasting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const navigate = useNavigate();
  const [agents,      setAgents]      = useState([]);
  const [stats,       setStats]       = useState({ total: 0, active: 0, inactive: 0 });
  const [loading,     setLoading]     = useState(true);
  const [results,     setResults]     = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const [agentData, resultData] = await Promise.all([agentsApi.list(), tasksApi.resultsAll()]);
        if (mounted) {
          setAgents(agentData.agents || []);
          setStats(agentData.stats || { total: 0, active: 0, inactive: 0 });
          setResults(resultData.results || []);
        }
      } catch (err) { console.error(err); }
      finally { if (mounted) setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handlePurge = async (id, hostname) => {
    if (!window.confirm(`Remove ${hostname} from the database?`)) return;
    try {
      await agentsApi.purge(id);
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) { alert('Failed to purge: ' + err.message); }
  };

  const filtered = agents.filter(a =>
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery) ||
    a.id.includes(searchQuery)
  );

  if (loading) return (
    <div className="dash-loading">
      <Loader2 size={24} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      <p>Loading...</p>
    </div>
  );

  return (
    <div className="dashboard scroll-area">
      {/* Header */}
      <header className="dash-header">
        <h1 className="dash-title">Overview</h1>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" size={13} />
            <input type="text" placeholder="Search hostname, IP, ID..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input" />
          </div>
          <button className="dash-notif-btn" title="Notifications">
            <Bell size={15} />
            <span className="dash-notif-dot" />
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="dash-stats">
        <StatCard title="Total Nodes"  value={stats.total}    icon={Server}  color="blue"  accent="Registered endpoints" />
        <StatCard title="Online"       value={stats.active}   icon={Wifi}    color="green" accent="Active sessions" />
        <StatCard title="Offline"      value={stats.inactive} icon={WifiOff} color="amber" accent="Dormant nodes" />
      </section>

      {/* Charts */}
      <section className="dash-charts">
        <InfrastructureMonitor agents={agents} />
        <OSDistribution agents={agents} />
      </section>

      {/* Bottom */}
      <section className="dash-bottom">
        {/* Node table */}
        <div className="dash-card dash-card--table">
          <div className="dash-card__header">
            <h4 className="dash-card__title">Managed Nodes</h4>
            <Link to="/agents" className="dash-card__link">
              View all <ChevronRight size={13} />
            </Link>
          </div>
          {filtered.length === 0 ? (
            <div className="dash-empty">
              <Users size={28} style={{ color: 'var(--color-text-dim)' }} />
              <p>No agents registered</p>
            </div>
          ) : (
            <div className="dash-table-wrap scroll-area">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Hostname</th><th>OS</th><th>IP</th>
                    <th>Status</th><th>Last seen</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 6).map(agent => (
                    <tr key={agent.id} onClick={() => navigate(`/agents/${agent.id}`)}>
                      <td>
                        <div className="agent-name-cell">
                          <div className={`agent-dot ${agent.connection_status === 'online' ? 'online' : ''}`} />
                          <div>
                            <span className="agent-hostname">{agent.hostname}</span>
                            <span className="agent-uuid">{agent.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="os-badge">{agent.os}</span></td>
                      <td className="ip-cell">{agent.ip_address || '—'}</td>
                      <td>
                        <span className={`status-pill ${agent.connection_status === 'online' ? 'online' : 'offline'}`}>
                          {agent.connection_status}
                        </span>
                      </td>
                      <td className="time-cell">{formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}</td>
                      <td style={{ textAlign: 'right', paddingRight: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                          {agent.connection_status === 'offline' && (
                            <button onClick={e => { e.stopPropagation(); handlePurge(agent.id, agent.hostname); }}
                              style={{ background: 'none', border: 'none', padding: '4px 6px', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-dim)', transition: 'color 0.15s' }}
                              title="Remove node"
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-error)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-dim)'}
                            >
                              <Skull size={14} />
                            </button>
                          )}
                          <Link to={`/agents/${agent.id}`} className="row-action-btn">
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QuickDispatch agents={agents} />

          <div className="dash-card" style={{ flex: 1 }}>
            <div className="dash-card__header">
              <h4 className="dash-card__title">Recent Activity</h4>
              <Link to="/data" className="dash-card__link">View all <ChevronRight size={13} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--color-text-dim)', textAlign: 'center', padding: '16px 0' }}>No recent activity</p>
              ) : (
                results.slice(0, 5).map((intel, i) => (
                  <Link key={i} to="/data"
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-muted)', textDecoration: 'none', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border-muted)'}
                  >
                    <div style={{ padding: 6, borderRadius: 6, background: 'rgba(59,130,246,0.08)', color: 'var(--color-primary)', flexShrink: 0 }}>
                      <Activity size={12} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {intel.task_type || 'Task result'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>
                        {formatDistanceToNow(new Date(intel.created_at), { addSuffix: true })}
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
