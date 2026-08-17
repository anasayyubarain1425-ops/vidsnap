'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserState {
  id: string;
  email: string;
  downloadCount: number;
  subscriptionStatus: string;
  downloadsLeft: number | null;
}

type Section = 'password' | 'email' | 'subscription' | 'delete';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #1e2030', background: '#0a0a14',
  color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

export default function AccountPage() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section | null>(null);

  // Change password
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Change email
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // Delete account
  const [deletePw, setDeletePw] = useState('');
  const [deleteMsg, setDeleteMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((d: { user: UserState | null }) => {
        if (d.user) setUser(d.user);
        else window.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = useCallback(async () => {
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'Password must be at least 8 characters.' }); return; }
    setPwLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', currentPassword: curPw, newPassword: newPw }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) { setPwMsg({ ok: false, text: data.error ?? 'Failed.' }); return; }
      setPwMsg({ ok: true, text: 'Password updated successfully!' });
      setCurPw(''); setNewPw(''); setConfirmPw('');
    } finally { setPwLoading(false); }
  }, [curPw, newPw, confirmPw]);

  const handleChangeEmail = useCallback(async () => {
    setEmailMsg(null);
    if (!newEmail.includes('@')) { setEmailMsg({ ok: false, text: 'Enter a valid email.' }); return; }
    setEmailLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_email', newEmail, currentPassword: emailPw }),
      });
      const data = await res.json() as { ok?: boolean; email?: string; error?: string };
      if (!res.ok || data.error) { setEmailMsg({ ok: false, text: data.error ?? 'Failed.' }); return; }
      setUser(prev => prev ? { ...prev, email: data.email ?? newEmail } : prev);
      setEmailMsg({ ok: true, text: 'Email updated!' });
      setNewEmail(''); setEmailPw('');
    } finally { setEmailLoading(false); }
  }, [newEmail, emailPw]);

  const handleDelete = useCallback(async () => {
    setDeleteMsg(null);
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: deletePw }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || data.error) { setDeleteMsg({ ok: false, text: data.error ?? 'Failed.' }); return; }
      window.location.href = '/';
    } finally { setDeleteLoading(false); }
  }, [deletePw]);

  const handleSubscribe = useCallback(async () => {
    setStripeLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json() as { url?: string };
    if (data.url) window.location.href = data.url;
    else setStripeLoading(false);
  }, []);

  const card: React.CSSProperties = {
    background: '#0d0d18', border: '1px solid #1e2030', borderRadius: 16, padding: '24px 28px', marginBottom: 16,
  };
  const sectionBtn: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff',
  };
  const submitBtn: React.CSSProperties = {
    padding: '11px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700,
    background: 'linear-gradient(135deg,#00d4ff,#00ff88)', color: '#000', cursor: 'pointer',
  };
  const msgStyle = (ok: boolean): React.CSSProperties => ({
    padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 12,
    background: ok ? 'rgba(0,255,136,0.08)' : 'rgba(239,68,68,0.08)',
    border: `1px solid ${ok ? 'rgba(0,255,136,0.25)' : 'rgba(239,68,68,0.3)'}`,
    color: ok ? '#00ff88' : '#fca5a5',
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
      Loading…
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', color: '#e2e8f0' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#00d4ff,#00ff88)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#050505' }}>⬇</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: '#fff' }}>
            Vid<span style={{ background: 'linear-gradient(135deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Snap</span>
          </span>
        </a>
        <span style={{ color: '#374151', fontSize: 18 }}>/</span>
        <span style={{ color: '#9ca3af', fontSize: 14 }}>Account</span>
        <div style={{ flex: 1 }} />
        <a href="/history" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>History</a>
        <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>← Back</a>
      </nav>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', marginBottom: 4 }}>Account Settings</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 36 }}>{user?.email}</p>

        {/* ── Plan & Usage ──────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Plan & Usage</h2>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Current Plan</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: user?.subscriptionStatus === 'active' ? '#00ff88' : '#fff' }}>
                {user?.subscriptionStatus === 'active' ? '✓ Pro' : 'Free'}
              </div>
            </div>
            <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Downloads Used</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{user?.downloadCount ?? 0}</div>
            </div>
            {user?.subscriptionStatus !== 'active' && (
              <div style={{ flex: 1, background: '#111', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Free Remaining</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: (user?.downloadsLeft ?? 0) === 0 ? '#f87171' : '#00d4ff' }}>
                  {user?.downloadsLeft ?? 0} / 3
                </div>
              </div>
            )}
          </div>
          {user?.subscriptionStatus !== 'active' && (
            <button onClick={handleSubscribe} disabled={stripeLoading}
              style={{ ...submitBtn, marginTop: 16, width: '100%' }}>
              {stripeLoading ? 'Redirecting…' : '⚡ Upgrade to Pro — $10/month'}
            </button>
          )}
        </div>

        {/* ── Change Password ───────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeSection === 'password' ? 20 : 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Change Password</h2>
            <button style={sectionBtn} onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}>
              {activeSection === 'password' ? 'Cancel' : 'Change'}
            </button>
          </div>
          {activeSection === 'password' && (
            <>
              <Field label="Current Password">
                <input style={inputStyle} type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Enter current password" />
              </Field>
              <Field label="New Password">
                <input style={inputStyle} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="At least 8 characters" />
              </Field>
              <Field label="Confirm New Password">
                <input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password"
                  onKeyDown={e => { if (e.key === 'Enter') handleChangePassword(); }} />
              </Field>
              {pwMsg && <div style={msgStyle(pwMsg.ok)}>{pwMsg.text}</div>}
              <button style={{ ...submitBtn, marginTop: 16 }} onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? 'Saving…' : 'Update Password'}
              </button>
            </>
          )}
        </div>

        {/* ── Change Email ─────────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeSection === 'email' ? 20 : 0 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Change Email</h2>
              {activeSection !== 'email' && <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{user?.email}</p>}
            </div>
            <button style={sectionBtn} onClick={() => setActiveSection(activeSection === 'email' ? null : 'email')}>
              {activeSection === 'email' ? 'Cancel' : 'Change'}
            </button>
          </div>
          {activeSection === 'email' && (
            <>
              <Field label="New Email Address">
                <input style={inputStyle} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" />
              </Field>
              <Field label="Current Password (required)">
                <input style={inputStyle} type="password" value={emailPw} onChange={e => setEmailPw(e.target.value)} placeholder="Confirm with password"
                  onKeyDown={e => { if (e.key === 'Enter') handleChangeEmail(); }} />
              </Field>
              {emailMsg && <div style={msgStyle(emailMsg.ok)}>{emailMsg.text}</div>}
              <button style={{ ...submitBtn, marginTop: 16 }} onClick={handleChangeEmail} disabled={emailLoading}>
                {emailLoading ? 'Saving…' : 'Update Email'}
              </button>
            </>
          )}
        </div>

        {/* ── Delete Account ────────────────────────────────────────────── */}
        <div style={{ ...card, border: '1px solid rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: activeSection === 'delete' ? 20 : 0 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f87171', margin: 0 }}>Delete Account</h2>
              {activeSection !== 'delete' && <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Permanently delete your account and all data.</p>}
            </div>
            <button
              style={{ ...sectionBtn, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              onClick={() => { setActiveSection(activeSection === 'delete' ? null : 'delete'); setDeleteConfirm(false); }}
            >
              {activeSection === 'delete' ? 'Cancel' : 'Delete'}
            </button>
          </div>
          {activeSection === 'delete' && (
            <>
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#fca5a5', margin: 0, lineHeight: 1.6 }}>
                  ⚠ This action is <strong>permanent and irreversible</strong>. All your downloads, history, and subscription will be deleted immediately.
                </p>
              </div>
              {!deleteConfirm ? (
                <button
                  style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}
                  onClick={() => setDeleteConfirm(true)}
                >
                  I understand — continue
                </button>
              ) : (
                <>
                  <Field label="Enter your password to confirm">
                    <input style={{ ...inputStyle, border: '1px solid rgba(239,68,68,0.4)' }}
                      type="password" value={deletePw} onChange={e => setDeletePw(e.target.value)}
                      placeholder="Your current password"
                      onKeyDown={e => { if (e.key === 'Enter') handleDelete(); }} />
                  </Field>
                  {deleteMsg && <div style={msgStyle(deleteMsg.ok)}>{deleteMsg.text}</div>}
                  <button
                    style={{ marginTop: 12, padding: '11px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, background: '#dc2626', color: '#fff', cursor: 'pointer' }}
                    onClick={handleDelete} disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting…' : 'Permanently Delete My Account'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
