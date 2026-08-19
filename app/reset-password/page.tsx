'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new link.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Reset failed.'); setStatus('error'); return; }
      setStatus('success');
    } catch {
      setError('Network error. Please try again.'); setStatus('error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0a0a0f)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'var(--font-mono, monospace)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'var(--bg-card, #12121a)',
        border: '1px solid var(--border-color, #1e2030)',
        borderRadius: 16,
        padding: '2.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
          }}>
            QuickSnap
          </div>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>Set a new password</p>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p style={{ color: '#00ff88', fontWeight: 600, marginBottom: '0.5rem' }}>Password updated!</p>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Your password has been changed. You can now sign in.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #00d4ff, #00ff88)',
                color: '#000',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Go to Sign In →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={!token || status === 'loading'}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 8,
                  border: '1px solid #2d2d3d',
                  background: '#0d0d18',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                disabled={!token || status === 'loading'}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: 8,
                  border: '1px solid #2d2d3d',
                  background: '#0d0d18',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!token || status === 'loading'}
              style={{
                width: '100%',
                padding: '0.78rem',
                borderRadius: 8,
                border: 'none',
                background: !token ? '#374151' : 'linear-gradient(135deg, #00d4ff, #00ff88)',
                color: !token ? '#9ca3af' : '#000',
                fontWeight: 700,
                cursor: !token ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                marginBottom: '1rem',
              }}
            >
              {status === 'loading' ? 'Updating…' : 'Set New Password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
              <a href="/" style={{ color: '#00d4ff', textDecoration: 'none' }}>← Back to QuickSnap</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
