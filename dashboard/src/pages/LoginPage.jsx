import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Terminal } from 'lucide-react';
import { authApi } from '../utils/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
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
    <div style={styles.shell}>
      {/* ── Left panel ── */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.brand}>
            <div style={styles.brandIcon}>
              <Terminal size={22} color="#fff" strokeWidth={1.8} />
            </div>
            <span style={styles.brandName}>ByteCode</span>
          </div>

          <div style={styles.heroText}>
            <h1 style={styles.heroHeading}>Operator<br />Command Centre</h1>
            <p style={styles.heroSub}>
              Centralised infrastructure monitoring and<br />
              tactical command and control.
            </p>
          </div>

          <div style={styles.featureList}>
            {[
              'Real-time endpoint telemetry',
              'AES-256-GCM encrypted channels',
              'Live task dispatch and auditing',
              'Exfiltration data explorer',
            ].map((f) => (
              <div key={f} style={styles.featureItem}>
                <div style={styles.featureDot} />
                <span style={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={styles.leftFooter}>
          ByteCode v1.1.1 — Restricted access
        </p>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={styles.right}>
        <div style={styles.formWrap}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Sign in</h2>
            <p style={styles.formSub}>Enter your operator credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Username */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Username</label>
              <div style={styles.inputWrap}>
                <User size={14} style={styles.inputIcon} />
                <input
                  type="text"
                  style={styles.input}
                  placeholder="operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label style={styles.fieldLabel}>Password</label>
              <div style={styles.inputWrap}>
                <Lock size={14} style={styles.inputIcon} />
                <input
                  type="password"
                  style={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={styles.error}>
                <div style={styles.errorDot} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; }}
            >
              {loading
                ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  shell: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    background: '#080c10',
    overflow: 'hidden',
  },

  /* Left */
  left: {
    width: '44%',
    background: '#0d1117',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '40px 48px',
  },
  leftInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 64,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  heroText: { marginBottom: 40 },
  heroHeading: {
    fontSize: 36,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
    marginBottom: 16,
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  heroSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.6,
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12 },
  featureDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#3b82f6',
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  leftFooter: {
    fontSize: 11,
    color: '#334155',
    fontFamily: '"Geist", system-ui, sans-serif',
  },

  /* Right */
  right: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 48px',
  },
  formWrap: { width: '100%', maxWidth: 360 },
  formHeader: { marginBottom: 32 },
  formTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    letterSpacing: '-0.03em',
    marginBottom: 6,
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  formSub: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 7 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    color: '#475569',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#0d1117',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 14px 10px 36px',
    fontSize: 13,
    color: '#f1f5f9',
    outline: 'none',
    fontFamily: '"Geist", system-ui, sans-serif',
    transition: 'border-color 0.15s',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 12,
    color: '#ef4444',
    fontFamily: '"Geist", system-ui, sans-serif',
  },
  errorDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#ef4444',
    flexShrink: 0,
  },
  submitBtn: {
    width: '100%',
    padding: '11px 0',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: '"Geist", system-ui, sans-serif',
    letterSpacing: '-0.01em',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
};

export default LoginPage;
