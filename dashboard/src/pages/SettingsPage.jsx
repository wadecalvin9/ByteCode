import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle2, Loader2, Database, HardDrive, Key, User, Server, Shield } from 'lucide-react';
import { authApi } from '../utils/api';

const S = {
  page: { flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--color-background)' },
  heading: { fontSize: 18, fontWeight: 700, color: 'var(--color-text-header)', letterSpacing: '-0.02em', marginBottom: 4 },
  sub: { fontSize: 12, color: 'var(--color-text-muted)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 },
  section: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' },
  sectionHead: { padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--color-text-header)', flex: 1 },
  sectionBody: { padding: 20 },
  label: { display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 10, color: 'var(--color-text-dim)', pointerEvents: 'none' },
  input: { width: '100%', background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--color-text)', outline: 'none', fontFamily: 'var(--font-sans)', transition: 'border-color 0.15s' },
  row: { display: 'flex', gap: 12 },
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--color-border-muted)' },
  infoLabel: { fontSize: 11, color: 'var(--color-text-muted)' },
  infoValue: { fontSize: 12, fontWeight: 600, color: 'var(--color-text-header)' },
  notice: { padding: '12px 16px', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 10, marginTop: 16 },
};

const SettingsPage = () => {
  const [oldPassword,     setOldPassword]     = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [message,         setMessage]         = useState({ type: '', text: '' });

  const operatorRaw = localStorage.getItem('bytecode_user');
  const operator = operatorRaw ? JSON.parse(operatorRaw) : null;
  const username = operator?.username || 'admin';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setMessage({ type: 'error', text: 'Passwords do not match' });
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally { setLoading(false); }
  };

  const focusBorder  = e => e.target.style.borderColor = 'rgba(59,130,246,0.5)';
  const blurBorder   = e => e.target.style.borderColor = 'var(--color-border)';

  return (
    <div style={S.page}>
      <div>
        <h1 style={S.heading}>Settings</h1>
        <p style={S.sub}>Manage credentials and platform configuration</p>
      </div>

      <div style={S.grid}>
        {/* Left — Security */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.section}>
            <div style={S.sectionHead}>
              <Lock size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={S.sectionTitle}>Change Password</span>
            </div>
            <div style={S.sectionBody}>
              {message.text && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 12, background: message.type === 'success' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.label}>Current password</label>
                  <div style={S.inputWrap}>
                    <Lock size={13} style={S.inputIcon} />
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                      placeholder="••••••••" style={S.input} required onFocus={focusBorder} onBlur={blurBorder} />
                  </div>
                </div>
                <div style={S.row}>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>New password</label>
                    <div style={S.inputWrap}>
                      <Key size={13} style={S.inputIcon} />
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters" style={S.input} required onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={S.label}>Confirm password</label>
                    <div style={S.inputWrap}>
                      <Key size={13} style={S.inputIcon} />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password" style={S.input} required onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  style={{ padding: '9px 16px', background: 'var(--color-primary)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-sans)', marginTop: 4 }}>
                  {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                  Update Password
                </button>
              </form>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionHead}>
              <User size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span style={S.sectionTitle}>Operator Profile</span>
            </div>
            <div style={S.sectionBody}>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Username</span>
                <span style={{ ...S.infoValue, fontFamily: 'var(--font-mono)' }}>{username}</span>
              </div>
              <div style={{ ...S.infoRow, borderBottom: 'none' }}>
                <span style={S.infoLabel}>Role</span>
                <span style={S.infoValue}>Operator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.section}>
            <div style={S.sectionHead}>
              <Database size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span style={S.sectionTitle}>State Persistence</span>
            </div>
            <div style={S.sectionBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: HardDrive, title: 'SQLite Storage', desc: 'All operational data persists in bytecode.db. Server restarts do not wipe data.' },
                  { icon: Server,    title: 'Server Status',  desc: 'Express server runs as a subprocess managed by the Electron process.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 8, background: 'var(--color-surface-raised)', border: '1px solid var(--color-border-muted)' }}>
                    <div style={{ padding: 8, borderRadius: 7, background: 'rgba(59,130,246,0.08)', color: 'var(--color-primary)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-header)', marginBottom: 4 }}>{title}</div>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.notice}>
                <Shield size={14} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-warning)', marginBottom: 4 }}>Note</div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    Changing your password does not invalidate active agent sessions. To force re-authentication, rotate the encryption PSK in the Payload Builder and redeploy agents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
