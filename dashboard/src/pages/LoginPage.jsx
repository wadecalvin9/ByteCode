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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-5 shadow-2xl shadow-primary/20">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">BYTECODE</h1>
          <p className="text-slate-400 font-medium">C2 Infrastructure Command Center</p>
        </div>

        <div className="card p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-3">Operator Username</label>
              <div className="relative">
                <User className="absolute left-4 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="input w-full pl-12"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-3">Security Credential</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  className="input w-full pl-12"
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
              className="btn btn-primary w-full py-3 text-base font-semibold"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Establish Uplink'
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-10 text-center text-xs text-slate-600 uppercase tracking-[0.2em] font-medium">
          Authorized Personnel Only • System Level 4
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
