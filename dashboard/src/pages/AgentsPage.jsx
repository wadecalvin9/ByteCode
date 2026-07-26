import React, { useEffect, useState } from 'react';
import { Search, Trash2, ChevronRight, Monitor, Cpu, Loader2, RefreshCw, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const AgentsPage = () => {
  const [agents,      setAgents]      = useState([]);
  const [stats,       setStats]       = useState({ total: 0, active: 0, inactive: 0 });
  const [loading,     setLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [purging,     setPurging]     = useState(null);

  const fetchAgents = async () => {
    try {
      const data = await agentsApi.list();
      setAgents(data.agents);
      setStats(data.stats);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePurge = async (e, id, hostname) => {
    e.preventDefault();
    if (!window.confirm(`Remove ${hostname} from the database?`)) return;
    setPurging(id);
    try {
      await agentsApi.purge(id);
      setAgents(prev => prev.filter(a => a.id !== id));
      const data = await agentsApi.list();
      setStats(data.stats);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setPurging(null); }
  };

  const getGeo = (meta) => {
    try { return JSON.parse(meta || '{}').geo; } catch { return null; }
  };

  const filtered = agents.filter(a =>
    a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.ip_address?.includes(searchQuery) ||
    a.id.includes(searchQuery)
  );

  if (loading && agents.length === 0) {
    return (
      <div className="dash-loading" style={{ flex: 1 }}>
        <Loader2 size={24} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
        <p>Loading endpoints...</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1 className="page-title">Endpoints</h1>
            <p className="page-subtitle">Managed device inventory and connectivity status</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Fleet status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-success)', letterSpacing: '-0.03em' }}>{stats.active}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>online</span>
                <span style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-header)', letterSpacing: '-0.03em' }}>{stats.total}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 500 }}>total</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-dim)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Filter by hostname, IP, or ID..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 12px 7px 30px', fontSize: 12, color: 'var(--color-text)', outline: 'none', fontFamily: 'var(--font-sans)' }}
              onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <button onClick={fetchAgents} title="Refresh"
            style={{ padding: '7px 10px', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px 24px' }}>
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-muted)' }}>
                {['Hostname', 'System', 'Network', 'Status', 'Last seen', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(agent => {
                const geo = getGeo(agent.metadata);
                const isOnline = agent.connection_status === 'online';
                return (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--color-border-muted)', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/agents/${agent.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? 'var(--color-success)' : 'var(--color-text-dim)', boxShadow: isOnline ? '0 0 6px var(--color-success)' : 'none', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.2 }}>{agent.hostname}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{agent.id.substring(0, 12)}...</div>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Monitor size={11} style={{ color: 'var(--color-text-dim)' }} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{agent.os}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Cpu size={11} style={{ color: 'var(--color-text-dim)' }} />
                          <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>{agent.arch} · PID {agent.pid}</span>
                        </div>
                        {geo && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MapPin size={11} style={{ color: 'var(--color-text-dim)' }} />
                            <span style={{ fontSize: 10, color: 'var(--color-text-dim)' }}>{geo.city}, {geo.country}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{agent.ip_address || '—'}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 2 }}>int: {agent.internal_ip || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                      <div style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 4 }}>
                        {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: 11 }}>
                      {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {!isOnline && (
                          <button onClick={e => handlePurge(e, agent.id, agent.hostname)} disabled={purging === agent.id}
                            title="Remove from database"
                            style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-error)', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: purging === agent.id ? 0.5 : 1 }}>
                            {purging === agent.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                          </button>
                        )}
                        <Link to={`/agents/${agent.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 11, fontWeight: 600, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text-header)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                        >
                          Manage <ChevronRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 0', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: 12 }}>
                    No endpoints found
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
