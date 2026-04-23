import React, { useEffect, useState } from 'react';
import { 
  Terminal, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { tasksApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="status-pill online">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
        </span>
      );
    case 'failed':
      return (
        <span className="status-pill offline">
          <XCircle className="w-3 h-3 mr-1" /> Failed
        </span>
      );
    case 'pending':
      return (
        <span className="status-pill amber">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </span>
      );
    default:
      return (
        <span className="status-pill slate">
          <AlertCircle className="w-3 h-3 mr-1" /> {status}
        </span>
      );
  }
};

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTasks = async () => {
    try {
      const data = await tasksApi.listAll();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchTasks();
    };
    init();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.agent_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="dashboard scroll-area">
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Task Manager</h1>
          <p className="dash-subtitle">Monitoring of all dispatched commands</p>
        </div>
        <div className="dash-header-actions">
          <div className="dash-search">
            <Search className="dash-search-icon" />
            <input
              type="text"
              placeholder="Search by Task ID, Type, or Agent..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dash-search-input"
            />
          </div>
          <select 
            className="filter-select ml-2"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <button 
            className="dash-notif-btn ml-2" 
            onClick={() => { setLoading(true); fetchTasks(); }}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <section className="dash-full-row mt-6">
        <div className="dash-card dash-card--table w-full">
          <div className="dash-card__header">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <h4 className="dash-card__title">Task History</h4>
            </div>
            <div className="text-xs text-slate-500">
              Showing {filteredTasks.length} results
            </div>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mb-4" />
              <p>Loading task history...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="dash-empty">
              <Terminal className="w-8 h-8 text-slate-700" />
              <p>No tasks found matching your criteria</p>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Task ID</th>
                    <th>Type</th>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map(task => (
                    <tr key={task.id}>
                      <td>
                        <span className="font-mono text-xs text-slate-400">
                          {task.id.substring(0, 12)}...
                        </span>
                      </td>
                      <td>
                        <span className="type-badge">{task.type}</span>
                      </td>
                      <td>
                        <Link to={`/agents/${task.agent_id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                          <Monitor className="w-3.5 h-3.5" />
                          <span className="text-sm font-medium">
                            {task.agent_id.substring(0, 8)}...
                          </span>
                        </Link>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="time-cell">
                        {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                      </td>
                      <td>
                        <Link to={`/agents/${task.agent_id}`} className="row-action-btn">
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
      </section>
    </div>
  );
};

export default TasksPage;
