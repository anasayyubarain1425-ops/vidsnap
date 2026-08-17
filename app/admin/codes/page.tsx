'use client';

import { useState, useEffect, useCallback } from 'react';

interface PromoCode {
  id: string;
  code: string;
  description: string;
  durationDays: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const inputStyle: React.CSSProperties = {
  padding: '9px 13px', borderRadius: 9, border: '1px solid #1e2030',
  background: '#0a0a14', color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  width: '100%',
};

export default function AdminCodesPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authErr, setAuthErr] = useState('');

  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New code form
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDays, setNewDays] = useState('30');
  const [newMax, setNewMax] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadCodes = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/codes', {
        headers: { 'x-admin-secret': s },
      });
      if (res.status === 403) { setAuthErr('Incorrect secret.'); setAuthed(false); return; }
      const data = await res.json() as { codes?: PromoCode[]; error?: string };
      if (data.error) { setError(data.error); return; }
      setCodes(data.codes ?? []);
      setAuthed(true);
      setAuthErr('');
    } catch {
      setError('Failed to load codes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try session-based auth first (no secret needed if ADMIN_EMAIL matches session)
    loadCodes('');
  }, [loadCodes]);

  const handleCreate = useCallback(async () => {
    setCreateMsg(null);
    setCreating(true);
    try {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase() || undefined,
          description: newDesc.trim(),
          durationDays: Number(newDays) || 30,
          maxUses: newMax ? Number(newMax) : null,
          expiresAt: newExpiry || null,
        }),
      });
      const data = await res.json() as { ok?: boolean; code?: PromoCode; error?: string };
      if (!res.ok || data.error) { setCreateMsg({ ok: false, text: data.error ?? 'Failed.' }); return; }
      setCreateMsg({ ok: true, text: `Code "${data.code?.code}" created!` });
      setCodes(prev => [data.code!, ...prev]);
      setNewCode(''); setNewDesc(''); setNewDays('30'); setNewMax(''); setNewExpiry('');
    } finally { setCreating(false); }
  }, [secret, newCode, newDesc, newDays, newMax, newExpiry]);

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    setToggling(id);
    await fetch('/api/admin/codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ id, active: !active }),
    });
    setCodes(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    setToggling(null);
  }, [secret]);

  const handleDelete = useCallback(async (id: string, code: string) => {
    if (!confirm(`Delete code "${code}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/codes?id=${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': secret },
    });
    setCodes(prev => prev.filter(c => c.id !== id));
    setDeleting(null);
  }, [secret]);

  const card: React.CSSProperties = {
    background: '#0d0d18', border: '1px solid #1e2030', borderRadius: 14, padding: '22px 24px', marginBottom: 16,
  };

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ ...card, minWidth: 340, marginBottom: 0 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Access</h2>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Enter your admin secret to continue.</p>
          <input
            style={inputStyle}
            type="password"
            placeholder="Admin secret"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') loadCodes(secret); }}
          />
          {authErr && <p style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{authErr}</p>}
          <button
            onClick={() => loadCodes(secret)}
            style={{ marginTop: 14, width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00d4ff,#00ff88)', color: '#000', fontWeight: 700, cursor: 'pointer' }}
          >
            Sign in
          </button>
          <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#374151' }}>
            Or set <code style={{ color: '#6b7280' }}>ADMIN_EMAIL</code> and sign in normally
          </p>
        </div>
      </div>
    );
  }

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
        <span style={{ color: '#9ca3af', fontSize: 14 }}>Admin — Promo Codes</span>
        <div style={{ flex: 1 }} />
        <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>← Back to app</a>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', marginBottom: 6 }}>Promo Codes</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 36 }}>Create and manage access codes that grant free Pro access for a set period.</p>

        {/* ── Create new code ──────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>Create New Code</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Code (blank = auto-generate)</label>
              <input style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.08em' }}
                placeholder="FRIEND30" value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Duration (days)</label>
              <input style={inputStyle} type="number" min="1" max="3650" placeholder="30" value={newDays}
                onChange={e => setNewDays(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Max Uses (blank = unlimited)</label>
              <input style={inputStyle} type="number" min="1" placeholder="Unlimited" value={newMax}
                onChange={e => setNewMax(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Code Expiry Date (optional)</label>
              <input style={inputStyle} type="date" value={newExpiry}
                onChange={e => setNewExpiry(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Description (internal note)</label>
            <input style={inputStyle} placeholder="e.g. Sent to beta testers, July 2025" value={newDesc}
              onChange={e => setNewDesc(e.target.value)} />
          </div>
          {createMsg && (
            <p style={{ fontSize: 13, color: createMsg.ok ? '#00ff88' : '#f87171', marginBottom: 10 }}>{createMsg.text}</p>
          )}
          <button
            onClick={handleCreate} disabled={creating}
            style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#00d4ff,#00ff88)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            {creating ? 'Creating…' : '+ Create Code'}
          </button>
        </div>

        {/* ── Codes list ───────────────────────────────────────────────── */}
        {loading && <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Loading…</p>}
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
        {!loading && codes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
            No codes yet — create your first one above.
          </div>
        )}
        {codes.map(c => (
          <div key={c.id} style={{
            ...card,
            opacity: c.active ? 1 : 0.55,
            border: c.active ? '1px solid #1e2030' : '1px solid #111',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              {/* Code + badge */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', color: '#00d4ff' }}>
                    {c.code}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '2px 10px', borderRadius: 100, fontWeight: 700,
                    background: c.active ? 'rgba(0,255,136,0.1)' : 'rgba(107,114,128,0.15)',
                    border: `1px solid ${c.active ? 'rgba(0,255,136,0.3)' : 'rgba(107,114,128,0.3)'}`,
                    color: c.active ? '#00ff88' : '#6b7280',
                  }}>
                    {c.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                {c.description && <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px' }}>{c.description}</p>}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>⏱ {c.durationDays} days access</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    👤 {c.usedCount}{c.maxUses != null ? `/${c.maxUses}` : ''} uses
                  </span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>📅 Code expires: {formatDate(c.expiresAt)}</span>
                  <span style={{ fontSize: 12, color: '#4b5563' }}>Created {formatDate(c.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                <button
                  onClick={() => handleToggle(c.id, c.active)}
                  disabled={toggling === c.id}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: c.active ? 'rgba(239,68,68,0.08)' : 'rgba(0,255,136,0.08)',
                    border: `1px solid ${c.active ? 'rgba(239,68,68,0.25)' : 'rgba(0,255,136,0.25)'}`,
                    color: c.active ? '#f87171' : '#00ff88',
                  }}
                >
                  {toggling === c.id ? '…' : c.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.code)}
                  disabled={deleting === c.id}
                  style={{
                    padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171',
                  }}
                >
                  {deleting === c.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
