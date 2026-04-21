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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-2xl shadow-primary/20">
            <Terminal className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">BYTECODE</h1>
          <p className="text-slate-400">C2 Infrastructure Command Center</p>
        </div>

        <div className="card glass p-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Operator Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="input w-full pl-10"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Security Credential</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  className="input w-full pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-sm p-3 rounded-lg flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-error" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Establish Uplink'
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-500 uppercase tracking-[0.2em]">
          Authorized Personnel Only // System Level 4
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
