import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Terminal as TerminalIcon, 
  Cpu, 
  Globe, 
  Clock, 
  ChevronLeft, 
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Trash2
} from 'lucide-react';
import { agentsApi, tasksApi } from '../utils/api';
import { format } from 'date-fns';

const AgentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const resultEndRef = useRef(null);

  const fetchDetails = useCallback(async () => {
    try {
      const details = await agentsApi.get(id);
      setData(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isMounted) {
        await fetchDetails();
      }
    };

    init();
    const interval = setInterval(fetchDetails, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchDetails]);

  const lastResultsLength = useRef(0);

  useEffect(() => {
    const newLength = data?.results?.length || 0;
    if (newLength > lastResultsLength.current) {
      resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      lastResultsLength.current = newLength;
    }
  }, [data?.results]);

  const handleRunCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    setExecuting(true);
    try {
      await tasksApi.create(id, 'execute_command', { command });
      setCommand('');
      // Notification of task queued would go here
    } catch (err) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleKillAgent = async () => {
    if (window.confirm('Are you sure you want to terminate this agent? It will no longer respond to beacons.')) {
      try {
        await agentsApi.kill(id);
        navigate('/agents');
      } catch (err) {
        alert(err.message);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { agent, results } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{agent.hostname}</h1>
            <span className={`badge ${
              agent.connection_status === 'online' ? 'bg-success/10 text-success' : 'bg-slate-800 text-slate-500'
            }`}>
              {agent.connection_status}
            </span>
          </div>
          <p className="text-slate-500 font-mono text-sm">{agent.id}</p>
        </div>
        <button 
          onClick={handleKillAgent}
          className="btn border border-error/20 bg-error/5 text-error hover:bg-error/10"
        >
          <Trash2 className="w-4 h-4" />
          Terminate Agent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Info */}
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-primary" />
            System Metadata
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> OS Platform</span>
              <span className="text-white font-medium">{agent.os}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Cpu className="w-4 h-4" /> Architecture</span>
              <span className="text-white font-medium">{agent.arch}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-2"><TerminalIcon className="w-4 h-4" /> Process ID</span>
              <span className="text-white font-mono">{agent.pid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm flex items-center gap-2"><Clock className="w-4 h-4" /> Beacon Int.</span>
              <span className="text-white font-medium">{agent.beacon_interval}s</span>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-2">Internal IP Addresses</p>
              <div className="bg-black/40 p-3 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                {agent.internal_ip || 'No IP registered'}
              </div>
            </div>
          </div>
        </div>

        {/* Console / Tasks */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="card flex-1 flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
              <div className="flex items-center gap-2 text-primary">
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Command Console</span>
              </div>
              <span className="text-xs text-slate-500">Connected via Secure Tunnel</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm bg-black/20">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <TerminalIcon className="w-12 h-12 mb-4" />
                  <p>Awaiting commands...</p>
                </div>
              ) : (
                results.map((res) => (
                  <div key={res.id} className="animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded uppercase">{res.task_type}</span>
                      <span>{format(new Date(res.created_at), 'HH:mm:ss')}</span>
                      {res.status === 'success' ? (
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-error" />
                      )}
                    </div>
                    <div className="pl-4 border-l border-slate-800 space-y-2">
                      <div className="text-primary/70">
                        $ {JSON.parse(res.task_payload).command || res.task_type}
                      </div>
                      <pre className="whitespace-pre-wrap text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                        {res.output || (res.error ? `ERROR: ${res.error}` : 'No output')}
                      </pre>
                    </div>
                  </div>
                ))
              )}
              <div ref={resultEndRef} />
            </div>

            <form onSubmit={handleRunCommand} className="p-4 border-t border-slate-800 bg-slate-900/30">
              <div className="relative flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-primary font-bold font-mono">$</span>
                  <input 
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter system command..."
                    className="w-full bg-black border border-slate-800 rounded-lg pl-8 pr-4 py-3 text-sm font-mono text-white focus:border-primary/50 outline-none transition-all"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!command.trim() || executing}
                  className="btn btn-primary px-6"
                >
                  {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetailPage;
