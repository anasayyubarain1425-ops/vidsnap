'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryRow {
  id: string;
  url: string;
  title: string;
  thumbnail: string | null;
  platform: string;
  formatLabel: string;
  fileSizeBytes: number | null;
  durationSeconds: number | null;
  createdAt: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDuration(s: number | null): string {
  if (!s) return '';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/history');
      if (res.status === 401) { setError('Please sign in to view your history.'); return; }
      const data = await res.json() as { history?: HistoryRow[]; error?: string };
      if (data.error) { setError(data.error); return; }
      setHistory(data.history ?? []);
    } catch {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(id);
    await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
    setHistory(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }, []);

  const filtered = history.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.platform.toLowerCase().includes(search.toLowerCase())
  );

  const base: React.CSSProperties = {
    minHeight: '100vh',
    background: '#050505',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    color: '#e2e8f0',
  };

  return (
    <div style={base}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 56, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#00d4ff,#00ff88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#050505',
          }}>⬇</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: '#fff' }}>
            Vid<span style={{ background: 'linear-gradient(135deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Snap</span>
          </span>
        </a>
        <span style={{ color: '#374151', fontSize: 18 }}>/</span>
        <span style={{ color: '#9ca3af', fontSize: 14 }}>Download History</span>
        <div style={{ flex: 1 }} />
        <a href="/account" style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>Account</a>
        <a href="/" style={{ color: '#00d4ff', fontSize: 13, textDecoration: 'none' }}>← Back</a>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', margin: 0 }}>
              Download History
            </h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
              {history.length} download{history.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or platform…"
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1px solid #1e2030',
              background: '#0d0d18', color: '#e2e8f0', fontSize: 14, outline: 'none', width: 260,
            }}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>Loading…</div>
        )}

        {!loading && error && (
          <div style={{
            padding: '16px 20px', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, color: '#fca5a5',
          }}>
            {error}
            {error.includes('sign in') && (
              <> — <a href="/" style={{ color: '#00d4ff' }}>Sign in</a></>
            )}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ color: '#6b7280', fontSize: 16 }}>
              {search ? 'No results for your search.' : 'No downloads yet — paste a URL on the home page to get started!'}
            </p>
            {!search && <a href="/" style={{ color: '#00d4ff', fontSize: 14 }}>Go to home →</a>}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(row => (
              <div key={row.id} style={{
                display: 'flex', gap: 16, alignItems: 'center',
                background: '#0d0d18', border: '1px solid #1e2030',
                borderRadius: 14, padding: '14px 16px',
                transition: 'border-color 150ms',
              }}>
                {/* Thumbnail */}
                <div style={{
                  flexShrink: 0, width: 90, height: 54, borderRadius: 8,
                  overflow: 'hidden', background: '#111', border: '1px solid #1e2030',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {row.thumbnail
                    ? <img src={row.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <span style={{ fontSize: 24 }}>🎬</span>}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#00d4ff', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
                    {row.platform}
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 600, color: '#fff',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {row.title}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{row.formatLabel}</span>
                    {row.fileSizeBytes && <span style={{ fontSize: 12, color: '#6b7280' }}>· {formatBytes(row.fileSizeBytes)}</span>}
                    {row.durationSeconds && <span style={{ fontSize: 12, color: '#6b7280' }}>· {formatDuration(row.durationSeconds)}</span>}
                    <span style={{ fontSize: 12, color: '#4b5563' }}>· {timeAgo(row.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a
                    href={`/?url=${encodeURIComponent(row.url)}`}
                    style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
                      color: '#00d4ff', textDecoration: 'none', whiteSpace: 'nowrap',
                    }}
                  >
                    ↩ Re-download
                  </a>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 12,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#f87171', cursor: 'pointer',
                    }}
                  >
                    {deleting === row.id ? '…' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
