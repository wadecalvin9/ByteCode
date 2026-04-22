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
  Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi, tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

/* ───────────────── Stat Card ───────────────── */
const StatCard = ({ title, value, icon: Icon, color, accent }) => (
  <div className={`stat-card stat-card--${color}`}>
    <div className={`stat-card__icon stat-card__icon--${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <MoreHorizontal className="stat-card__menu" />
    <p className="stat-card__label">{title}</p>
    <h3 className="stat-card__value">{value}</h3>
    {accent && <span className="stat-card__accent">{accent}</span>}
  </div>
);

/* ───────────────── Mini Bar Chart (simulated fleet activity) ───────────────── */
const FleetActivityChart = ({ agents }) => {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const active = Math.floor(Math.random() * (agents.length + 1));
    return { hour: i, active, total: agents.length };
  });
  const max = Math.max(...hours.map(h => h.total), 1);

  return (
    <div className="dash-card">
      <div className="dash-card__header">
        <h4 className="dash-card__title">Fleet Activity</h4>
        <div className="dash-card__legend">
          <span className="legend-dot legend-dot--blue" /> Online
          <span className="legend-dot legend-dot--slate" /> Offline
        </div>
      </div>
      <div className="chart-area">
        {hours.map((h, i) => (
          <div key={i} className="chart-bar-group">
            <div className="chart-bar-bg" style={{ height: `${(h.total / max) * 100}%` }}>
              <div 
                className="chart-bar-fill" 
                style={{ height: `${(h.active / (h.total || 1)) * 100}%` }} 
              />
            </div>
            {i % 4 === 0 && <span className="chart-label">{String(i).padStart(2, '0')}</span>}
          </div>
        ))}
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

  if (loading) {
    return (
      <div className="dash-loading">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p>Synchronizing Fleet Data</p>
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
          title="Total Fleet" 
          value={stats.total} 
          icon={Server} 
          color="blue"
          accent={`${stats.total} nodes`}
        />
        <StatCard 
          title="Online" 
          value={stats.active} 
          icon={Wifi} 
          color="green"
          accent={`${((stats.active / stats.total) * 100 || 0).toFixed(0)}% uptime`}
        />
        <StatCard 
          title="Offline" 
          value={stats.inactive} 
          icon={WifiOff} 
          color="amber"
          accent="dormant"
        />
      </section>

      {/* ── Charts Row ── */}
      <section className="dash-charts">
        <FleetActivityChart agents={agents} />
        <OSDistribution agents={agents} />
      </section>

      {/* ── Bottom Row: Table + Quick Dispatch ── */}
      <section className="dash-bottom">
        {/* Node Assets Table */}
        <div className="dash-card dash-card--table">
          <div className="dash-card__header">
            <h4 className="dash-card__title">Node Assets</h4>
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
                      <td>
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
        <QuickDispatch agents={agents} />
      </section>
    </div>
  );
};

export default DashboardPage;
