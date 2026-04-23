import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Terminal, Loader2 } from 'lucide-react';
import { authApi } from '../utils/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authApi.login(username, password);
      localStorage.setItem('bytecode_token', data.token);
      localStorage.setItem('bytecode_user', JSON.stringify(data.operator));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05070a]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-surface border border-border mb-6 shadow-2xl shadow-primary/5">
            <Terminal className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight uppercase">ByteCode Core</h1>
          <p className="text-slate-500 font-medium text-sm uppercase tracking-widest">Operator Authentication Gateway</p>
        </div>

        <div className="card p-10 bg-surface/50 border-border shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Operator ID</label>
              <div className="relative group">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  className="w-full bg-black/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="Enter operator username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Security Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  className="w-full bg-black/40 border border-border rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary/50 transition-all placeholder:text-slate-700 shadow-inner"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/30 text-error text-sm p-4 rounded-lg flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Authenticate Operator'
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-10 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold">
          Restricted Infrastructure • Secure Operations Gateway
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
