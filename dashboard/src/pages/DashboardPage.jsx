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
  return (
    <div className="card p-6 flex items-center gap-5">
      <div className={`p-4 rounded-2xl bg-${color}/10 border border-${color}/20`}>
        <Icon className={`w-6 h-6 text-${color}`} />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Infrastructure Overview</h1>
          <p className="text-slate-400">Real-time status of all deployed agents</p>
        </div>
        <button className="btn btn-primary">
          <Zap className="w-4 h-4" />
          Deploy New Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Agents" value={stats.total} icon={Users} color="primary" />
        <StatCard title="Active Beacons" value={stats.active} icon={Activity} color="success" />
        <StatCard title="Offline Assets" value={stats.inactive} icon={Clock} color="warning" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Connected Assets
          </h2>
          <Link to="/agents" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
            View All Infrastructure <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                className="card p-5 group hover:border-primary/30 transition-all hover:bg-primary/[0.02]"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-3 rounded-xl ${agent.connection_status === 'online' ? 'bg-success/10' : 'bg-slate-800'} border border-white/5`}>
                    <Globe className={`w-5 h-5 ${agent.connection_status === 'online' ? 'text-success' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors truncate">{agent.hostname}</h4>
                      <span className={`badge ${
                        agent.connection_status === 'online' 
                          ? 'bg-success/10 text-success border border-success/20' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {agent.connection_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Terminal className="w-3 h-3" />
                        {agent.os} {agent.arch}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last Seen: {formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-slate-600" />
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
