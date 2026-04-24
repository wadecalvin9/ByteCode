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
  HardDrive
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
    <div className="dashboard scroll-area p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          Tactical Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">Configure infrastructure security and operator credentials</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile & Security */}
        <div className="space-y-6">
          <div className="card border-slate-800 bg-slate-900/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Credential Rotation
              </h3>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {message.text && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  <span className="text-xs font-semibold">{message.text}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-600" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/40 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-primary/50 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-black font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Credentials
              </button>
            </form>
          </div>

          <div className="card border-slate-800 bg-slate-900/40 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Active Operator</h4>
                <p className="text-xs text-slate-500">Authorized management session active</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-full">
              Verified
            </div>
          </div>
        </div>

        {/* Persistence & DB Info */}
        <div className="space-y-6">
          <div className="card border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-6">
              <Database className="w-4 h-4 text-sky-400" />
              Infrastructure Persistence
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 bg-sky-500/10 rounded-lg">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">SQLite Database</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Data is stored in <code className="text-sky-300 font-mono">./data/bytecode.db</code>. 
                    Running <code className="text-primary font-mono">bytecode start</code> will NOT override your data. 
                    The system persists all agents, tasks, and results across restarts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Task Redundancy</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Redis is used for sub-second task delivery and WebSocket state. Primary data integrity is maintained 
                    in the persistent SQLite layer.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">OpSec Warning</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                Changing your password will NOT invalidate existing agent beacons, but it is recommended to rotate your 
                Encryption PSK (in agent config) periodically for maximum operational security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
