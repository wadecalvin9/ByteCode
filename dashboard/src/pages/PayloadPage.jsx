import React, { useState } from 'react';
import { payloadsApi } from '../utils/api';
import { Download, Cpu, Loader2, CheckCircle, AlertCircle, Globe, Terminal as TerminalIcon } from 'lucide-react';

const PayloadPage = () => {
  const [serverUrl, setServerUrl] = useState(() => {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${host}:3001`;
  });
  const [platform, setPlatform] = useState('windows');
  const [interval, setIntervalVal] = useState(10);
  const [jitter, setJitter] = useState(15);
  const [showGui, setShowGui] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [compilationLog, setCompilationLog] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startLogSimulation = () => {
    const logs = [
      "[*] Initializing Go compilation environment...",
      "[*] Pulling ByteCode agent source v2.4.0...",
      "[*] Injecting C2 configuration into internal/config/config.go...",
      `[*] Setting C2_URL = ${serverUrl}`,
      `[*] Setting BEACON_INTERVAL = ${interval}s`,
      `[*] Setting JITTER = ${jitter}%`,
      "[*] Resolving dependencies...",
      "[*] Compiling with GOOS=" + platform + " GOARCH=amd64...",
      "[*] Stripping symbols and optimizing binary...",
      "[*] Generating unique agent signature...",
      "[+] Compilation successful. Artifact ready for deployment."
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
      const data = await payloadsApi.generate(serverUrl, showGui, interval, jitter);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const downloadUrl = `http://${window.location.hostname}:3001${result.downloadUrl}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 scrollbar-thin space-y-6">
      <div className="shrink-0">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Payload Foundry</h1>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Forge custom beacon artifacts for targeted deployment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Section */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-thin">
          <div className="card p-6 border-slate-800/50 bg-slate-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Mission Configuration</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {['windows', 'linux'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                        platform === p ? 'bg-primary border-primary text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">C2 Callback URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-600" />
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Interval (s)</label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setIntervalVal(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-primary/50 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jitter (%)</label>
                  <input
                    type="number"
                    value={jitter}
                    onChange={(e) => setJitter(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800 flex items-center justify-between group cursor-pointer" onClick={() => setShowGui(!showGui)}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Debug Mode</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Enable console GUI for testing</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${showGui ? 'bg-primary' : 'bg-slate-800'}`}>
                  <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${showGui ? 'left-5' : 'left-1'}`} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                Forge Artifact
              </button>
            </form>
          </div>

          <div className="card p-6 border-slate-800/50 bg-slate-900/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Configuration Blueprint</span>
            </div>
            <pre className="text-[10px] font-mono text-primary/70 bg-black/40 p-4 rounded-lg border border-primary/10 overflow-x-auto">
{JSON.stringify({
  target: platform,
  c2: serverUrl,
  timing: { interval: `${interval}s`, jitter: `${jitter}%` },
  stealth: showGui ? "DEBUG_ENABLED" : "STRIP_SYMBOLS",
  build: "v2.4.0-stable"
}, null, 2)}
            </pre>
          </div>
        </div>

        {/* Console & Result Section */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
          <div className="card flex-1 flex flex-col bg-black/40 border-slate-800/50 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Foundry Console</span>
              </div>
              <span className="text-[9px] font-mono text-slate-600">STDOUT-STREAM-01</span>
            </div>
            <div className="flex-1 p-6 font-mono text-[11px] space-y-2 overflow-y-auto scrollbar-thin">
              {compilationLog.map((line, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  <span className={line.startsWith('[+]') ? 'text-emerald-500' : line.startsWith('[*]') ? 'text-primary/70' : 'text-slate-400'}>
                    {line}
                  </span>
                </div>
              ))}
              {!isGenerating && compilationLog.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 select-none grayscale">
                  <TerminalIcon className="w-12 h-12 mb-4" />
                  <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Waiting for forge command</p>
                </div>
              )}
              {isGenerating && <div className="w-1 h-4 bg-primary animate-pulse inline-block ml-1 align-middle" />}
            </div>
          </div>

          {result && (
            <div className="card p-6 border-emerald-500/20 bg-emerald-500/5 animate-in zoom-in duration-500 shrink-0">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Artifact Forged</h3>
                    <p className="text-xs font-mono text-emerald-500/70">{result.filename}</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-8 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  Exfiltrate Binary
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="card p-6 border-red-500/20 bg-red-500/5 animate-in slide-in-from-bottom-4 duration-500 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Forge Failure</h3>
                  <p className="text-xs font-bold text-red-500/70 uppercase tracking-wider">{error}</p>
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
