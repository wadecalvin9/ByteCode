import React, { useEffect, useState } from 'react';
import { Terminal, Search, RefreshCw, Clock, CheckCircle2, XCircle, ChevronRight, Monitor } from 'lucide-react';
import { tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const pill = {
  completed: { bg: 'rgba(16,185,129,0.08)', color: 'var(--color-success)', border: 'rgba(16,185,129,0.2)' },
  failed:    { bg: 'rgba(239,68,68,0.08)',  color: 'var(--color-error)',   border: 'rgba(239,68,68,0.2)'  },
  pending:   { bg: 'rgba(245,158,11,0.08)', color: 'var(--color-warning)', border: 'rgba(245,158,11,0.2)' },
};

const StatusBadge = ({ status }) => {
  const s = pill[status] || { bg: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', border: 'var(--color-border)' };
  const Icon = status === 'completed' ? CheckCircle2 : status === 'failed' ? XCircle : Clock;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <Icon size={11} /> {status}
    </span>
  );
};

const TasksPage = () => {
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      const data = await tasksApi.listAll();
      setTasks(data.tasks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.agent_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="dashboard scroll-area">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Task Manager</h1>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" size={13} />
            <input type="text" placeholder="Search by ID, type, or agent..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input" />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button className="dash-notif-btn" onClick={() => { setLoading(true); fetchTasks(); }} title="Refresh">
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </header>

      <section style={{ flex: 1, display: 'flex', marginTop: 0 }}>
        <div className="dash-card dash-card--table" style={{ flex: 1 }}>
          <div className="dash-card__header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal size={15} style={{ color: 'var(--color-primary)' }} />
              <h4 className="dash-card__title">Task History</h4>
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="dash-empty"><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="dash-empty">
              <Terminal size={24} style={{ color: 'var(--color-text-dim)' }} />
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="dash-table-wrap scroll-area">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Type</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <tr key={task.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-muted)' }}>{task.id.substring(0, 12)}...</span></td>
                      <td><span className="type-badge">{task.type}</span></td>
                      <td>
                        <Link to={`/agents/${task.agent_id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--color-text-muted)', fontSize: 12, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                          <Monitor size={13} />
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{task.agent_id.substring(0, 8)}...</span>
                        </Link>
                      </td>
                      <td><StatusBadge status={task.status} /></td>
                      <td className="time-cell">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</td>
                      <td>
                        <Link to={`/agents/${task.agent_id}`} className="row-action-btn">
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TasksPage;
