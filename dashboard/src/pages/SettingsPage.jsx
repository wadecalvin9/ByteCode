import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  User, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Database,
  RefreshCw,
  HardDrive,
  Fingerprint,
  Zap,
  Activity,
  Server,
  Key
} from 'lucide-react';
import { authApi } from '../utils/api';

const SettingsPage = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage({ type: 'error', text: 'New passwords do not match' });
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authApi.changePassword(oldPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-8 bg-background scrollbar-thin">
      <header className="mb-10 flex items-center justify-between">
        <div className="animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Control Center</h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">Infrastructure Governance & Security</p>
        </div>
        
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Signal Integrity</p>
            <p className="text-xs font-bold text-emerald-500 uppercase">Encrypted // Stable</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile & Security */}
        <div className="lg:col-span-7 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="card overflow-hidden border-slate-800/50 bg-surface/10 backdrop-blur-md">
            <div className="px-8 py-5 border-b border-slate-800/50 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <Fingerprint className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Operator Authentication</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MFA Active</span>
              </div>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
              {message.text && (
                <div className={`p-4 rounded-xl flex items-center gap-4 animate-in zoom-in duration-300 ${
                  message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Existing Credentials</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Operator Secret</label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
                      placeholder="Min. 12 characters"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Secret</label>
                  <div className="relative group">
                    <RefreshCw className="absolute left-4 top-3.5 w-4 h-4 text-slate-600 group-focus-within:text-primary transition-colors" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/20 border border-slate-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white outline-none focus:border-primary/50 focus:bg-black/40 transition-all"
                      placeholder="Repeat new secret"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary/10 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Rotate Credentials
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6 border-slate-800/50 bg-surface/10 backdrop-blur-sm flex items-center justify-between group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Identity</h4>
                  <p className="text-sm font-bold text-white uppercase mt-0.5">Admin Operator</p>
                </div>
              </div>
              <Activity className="w-5 h-5 text-emerald-500 opacity-30" />
            </div>

            <div className="card p-6 border-slate-800/50 bg-surface/10 backdrop-blur-sm flex items-center justify-between group hover:border-sky-500/30 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20 group-hover:scale-110 transition-transform">
                  <Server className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Node Status</h4>
                  <p className="text-sm font-bold text-white uppercase mt-0.5">Primary Hub</p>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            </div>
          </div>
        </div>

        {/* Persistence & DB Info */}
        <div className="lg:col-span-5 space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="card border-slate-800/50 bg-surface/10 backdrop-blur-md p-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3 mb-8">
              <Database className="w-5 h-5 text-sky-400" />
              State Persistence
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                <div className="p-3 bg-sky-500/10 rounded-xl">
                  <HardDrive className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-wider">SQLite Layer</h5>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Tactical state is strictly persisted in <code className="text-sky-300 font-mono">bytecode.db</code>. 
                    Re-launching the orchestration hub does not purge operational intelligence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-white uppercase tracking-wider">Sync Integrity</h5>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    In-memory task queues are synchronized with the persistent layer every 500ms to ensure sub-second 
                    latency across geographic nodes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform">
                <Shield className="w-16 h-16 text-amber-500" />
              </div>
              <div className="flex items-center gap-3 text-amber-500 mb-3">
                <AlertCircle className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">OpSec Protocol</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                CREDENTIAL ROTATION DOES NOT INVALIDATE ACTIVE BEACONS. 
                FOR COMPLETE COMMS ISOLATION, ROTATE THE ENCRYPTION PSK IN THE PAYLOAD BUILDER AND RE-DEPLOY AGENTS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
