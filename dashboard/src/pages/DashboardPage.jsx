import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Terminal, 
  Activity, 
  Cpu, 
  Globe, 
  Clock, 
  MoreVertical,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { agentsApi } from '../utils/api';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon, color }) => {
  const Icon = icon;
  
  const colorClasses = {
    primary: 'bg-primary/10 border-primary/20 text-primary',
    success: 'bg-success/10 border-success/20 text-success',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    error: 'bg-error/10 border-error/20 text-error',
  };

  const iconColor = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  };

  return (
    <div className="card p-6 flex items-center gap-5 hover:border-slate-600 transition-colors">
      <div className={`p-4 rounded-2xl border ${colorClasses[color] || colorClasses.primary}`}>
        <Icon className={`w-6 h-6 ${iconColor[color] || iconColor.primary}`} />
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
        <h3 className="text-4xl font-bold text-white">{value}</h3>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const fetchAgents = async () => {
      try {
        const data = await agentsApi.list();
        if (isMounted) {
          setAgents(data.agents);
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 10000); // Polling every 10s
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-white mb-2">Infrastructure Overview</h1>
          <p className="text-slate-500 text-base">Real-time status of all deployed agents</p>
        </div>
        <button className="btn btn-primary whitespace-nowrap">
          <Zap className="w-4 h-4" />
          Deploy New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Total Agents" value={stats.total} icon={Users} color="primary" />
        <StatCard title="Active Beacons" value={stats.active} icon={Activity} color="success" />
        <StatCard title="Offline Assets" value={stats.inactive} icon={Clock} color="warning" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            Connected Assets
          </h2>
          <Link to="/agents" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse bg-slate-900/50" />
            ))
          ) : agents.length === 0 ? (
            <div className="xl:col-span-2 card p-12 flex flex-col items-center justify-center border-dashed">
              <div className="p-4 rounded-full bg-slate-800 mb-4 text-slate-500">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No Agents Connected</h3>
              <p className="text-slate-500 text-sm">Deploy an agent to start monitoring infrastructure</p>
            </div>
          ) : (
            agents.slice(0, 6).map((agent) => (
              <Link 
                key={agent.id} 
                to={`/agents/${agent.id}`}
                className="card p-6 group hover:border-primary/40 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${agent.connection_status === 'online' ? 'bg-success/10 border border-success/30' : 'bg-slate-800 border border-slate-700'}`}>
                    <Globe className={`w-5 h-5 ${agent.connection_status === 'online' ? 'text-success' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate text-lg">{agent.hostname}</h4>
                      <span className={`badge flex-shrink-0 ${
                        agent.connection_status === 'online' 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : 'bg-slate-800/50 text-slate-400 border border-slate-700'
                      }`}>
                        {agent.connection_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" />
                        {agent.os} {agent.arch}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Last: {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
