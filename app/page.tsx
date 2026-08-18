'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { VideoInfo, VideoFormat } from './api/video-info/route';

// Only show formats that work without ffmpeg (single-container)
const QUALITY_LABELS = ['1080p', '720p', '480p'];

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', icon: '▶', color: '#FF0000' },
  { name: 'TikTok', icon: '♪', color: '#00F2EA' },
  { name: 'Twitter/X', icon: '✕', color: '#1DA1F2' },
  { name: 'Instagram', icon: '◉', color: '#E1306C' },
  { name: 'Facebook', icon: 'f', color: '#1877F2' },
  { name: 'Vimeo', icon: '⬡', color: '#1AB7EA' },
  { name: 'Dailymotion', icon: '◈', color: '#00D0E2' },
  { name: 'Reddit', icon: '◎', color: '#FF4500' },
];

function formatDuration(seconds: number): string {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

interface UserState {
  id: string;
  email: string;
  downloadCount: number;
  subscriptionStatus: string;
  canDownload: boolean;
  downloadsLeft: number | null;
  onPromo: boolean;
  promoExpiresAt: string | null;
}

type Step = 'idle' | 'loading' | 'ready' | 'downloading';
type AuthModal = 'closed' | 'login' | 'register' | 'forgot';

const FREE_LIMIT = 3;

export default function Home() {
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [user, setUser] = useState<UserState | null>(null);
  const [authModal, setAuthModal] = useState<AuthModal>('closed');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotResetLink, setForgotResetLink] = useState<string | null>(null); // shown in-page

  // Promo code redemption
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);

  const [subscribedBanner, setSubscribedBanner] = useState(false);

  // Load user on mount + handle Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSessionId = params.get('session_id');
    const subscribed = params.get('subscribed');

    // Clean URL immediately
    if (subscribed || stripeSessionId) {
      window.history.replaceState({}, '', '/');
    }

    // If returning from successful Stripe checkout, verify payment server-side
    if (subscribed === '1' && stripeSessionId) {
      fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(stripeSessionId)}`)
        .then(r => r.json())
        .then((d: { ok?: boolean }) => { if (d.ok) setSubscribedBanner(true); })
        .catch(() => {})
        .finally(() => {
          fetch('/api/auth/me').then(r => r.json()).then((d: { user: UserState | null }) => {
            if (d.user) setUser(d.user);
          });
        });
    } else {
      fetch('/api/auth/me')
        .then(r => r.json())
        .then((d: { user: UserState | null }) => { if (d.user) setUser(d.user); })
        .catch(() => {});
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const d = await fetch('/api/auth/me').then(r => r.json()) as { user: UserState | null };
    if (d.user) setUser(d.user);
    return d.user;
  }, []);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleAuth = useCallback(async (mode: 'login' | 'register') => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await res.json() as { error?: string; id?: string; email?: string };
      if (!res.ok || data.error) {
        setAuthError(data.error ?? 'Something went wrong.');
        return;
      }
      await refreshUser();
      setAuthModal('closed');
      setAuthEmail('');
      setAuthPassword('');
    } finally {
      setAuthLoading(false);
    }
  }, [authEmail, authPassword, refreshUser]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const openForgot = useCallback((prefillEmail?: string) => {
    setForgotEmail(prefillEmail ?? authEmail);
    setForgotError('');
    setForgotResetLink(null);
    setAuthModal('forgot');
  }, [authEmail]);

  const handleForgot = useCallback(async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotResetLink(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json() as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || data.error) {
        setForgotError(data.error ?? 'Something went wrong.');
        return;
      }
      if (data.token) {
        const link = `${window.location.origin}/reset-password?token=${data.token}`;
        setForgotResetLink(link);
      } else {
        // Account not found — we still show a neutral message
        setForgotResetLink('__notfound__');
      }
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  }, [forgotEmail]);

  const handleSubscribe = useCallback(async () => {
    if (!user) { setAuthModal('login'); return; }
    setStripeLoading(true);
    try {
      // Try Paddle first (works in Pakistan), fall back to Stripe
      const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      const usePaddle = Boolean(paddleToken && typeof window !== 'undefined' && (window as unknown as { Paddle?: unknown }).Paddle);

      if (usePaddle) {
        const res = await fetch('/api/paddle/checkout', { method: 'POST' });
        const data = await res.json() as { transactionId?: string; error?: string };
        if (data.transactionId && (window as unknown as { Paddle?: { Checkout?: { open: (opts: unknown) => void } } }).Paddle?.Checkout) {
          (window as unknown as { Paddle: { Checkout: { open: (opts: unknown) => void } } }).Paddle.Checkout.open({
            transactionId: data.transactionId,
            settings: { theme: 'dark' },
          });
        } else {
          setError(data.error ?? 'Failed to start checkout.');
        }
      } else {
        // Stripe fallback
        const res = await fetch('/api/stripe/checkout', { method: 'POST' });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error ?? 'Payment not configured yet. Please contact support.');
        }
      }
    } finally {
      setStripeLoading(false);
    }
  }, [user]);

  const handlePromoRedeem = useCallback(async () => {
    if (!user) { setAuthModal('login'); return; }
    if (!promoCode.trim()) { setPromoMsg({ ok: false, text: 'Please enter a code.' }); return; }
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const res = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      const data = await res.json() as { ok?: boolean; message?: string; error?: string; expiresAt?: string };
      if (!res.ok || data.error) {
        setPromoMsg({ ok: false, text: data.error ?? 'Invalid code.' });
        return;
      }
      setPromoMsg({ ok: true, text: data.message ?? '🎉 Code applied!' });
      setPromoCode('');
      setShowPromoInput(false);
      await refreshUser();
    } catch {
      setPromoMsg({ ok: false, text: 'Network error. Please try again.' });
    } finally {
      setPromoLoading(false);
    }
  }, [user, promoCode, refreshUser]);

  // ── Video fetch ───────────────────────────────────────────────────────────
  const handleFetch = useCallback(async () => {
    if (!url.trim()) return;
    if (!user) { setAuthModal('login'); return; }
    setStep('loading');
    setError('');
    setVideoInfo(null);
    setSelectedFormat(null);

    try {
      const res = await fetch('/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as VideoInfo & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to fetch video info');
        setStep('idle');
        return;
      }

      // Show all formats; select "Best available quality" by default
      setVideoInfo(data);
      // Default to best quality option
      const best = data.formats.find(f => f.label === 'Best available quality') ?? data.formats[0] ?? null;
      setSelectedFormat(best);
      setStep('ready');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStep('idle');
    }
  }, [url, user]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      inputRef.current?.focus();
    } catch {
      inputRef.current?.focus();
    }
  }, []);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!videoInfo || !selectedFormat) return;
    if (!user) { setAuthModal('login'); return; }
    if (!user.canDownload) { setShowPaywall(true); return; }

    setStep('downloading');
    setDownloadStatus('Connecting to server...');
    setDownloadProgress(0);
    setError('');

    try {
      // Build filename from video title + format ext
      const safeTitle = videoInfo.title.replace(/[/\\:*?"<>|]/g, '_').slice(0, 80);
      const ext = selectedFormat.ext ?? 'mp4';
      const filename = `${safeTitle}.${ext}`;

      setDownloadStatus('Fetching video... (this may take 30–60 seconds)');
      setDownloadProgress(5);

      const params = new URLSearchParams({
        url: videoInfo.webpage_url,
        format_id: selectedFormat.format_id,
        filename,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail ?? '',
        platform: videoInfo.platform,
        duration: String(videoInfo.duration ?? ''),
        format_label: selectedFormat.label,
      });
      const streamUrl = `/api/stream?${params.toString()}`;

      const streamRes = await fetch(streamUrl);
      if (!streamRes.ok) {
        const errData = await streamRes.json().catch(() => ({})) as { error?: string; code?: string };
        if (errData.code === 'QUOTA_EXCEEDED') {
          setShowPaywall(true);
          setStep('ready');
          setDownloadStatus('');
          return;
        }
        if (errData.code === 'UNAUTHENTICATED') {
          setAuthModal('login');
          setStep('ready');
          setDownloadStatus('');
          return;
        }
        throw new Error(errData.error ?? 'Download failed. Please try again.');
      }

      setDownloadStatus('Downloading...');
      setDownloadProgress(10);

      const contentLength = streamRes.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = streamRes.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setDownloadProgress(Math.min(95, 10 + Math.round((received / total) * 85)));
        } else {
          // No content-length: pulse the bar
          setDownloadProgress(prev => Math.min(90, prev + 1));
        }
      }

      setDownloadProgress(100);
      setDownloadStatus('Saving file…');

      const blob = new Blob(chunks);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

      // Refresh user quota
      await refreshUser();

      setDownloadStatus('✅ Download complete! Check your Downloads folder.');
      setTimeout(() => { setStep('ready'); setDownloadStatus(''); setDownloadProgress(0); }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Download failed. Please try again.';
      setError(msg);
      setStep('ready');
      setDownloadStatus('');
      setDownloadProgress(0);
    }
  }, [videoInfo, selectedFormat, user, refreshUser]);

  const handleReset = useCallback(() => {
    setStep('idle');
    setUrl('');
    setVideoInfo(null);
    setSelectedFormat(null);
    setError('');
    setDownloadStatus('');
    setDownloadProgress(0);
    setShowPaywall(false);
  }, []);

  const isDownloading = (step as string) === 'downloading';
  const downloadsLeft = user ? (user.downloadsLeft ?? null) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>

      {/* Auth Modal */}
      {authModal !== 'closed' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setAuthModal('closed')}>
          <div style={{
            background: '#0d0d0d', border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 20, padding: 36, width: '100%', maxWidth: 420,
          }} onClick={e => e.stopPropagation()}>

            {/* ── Forgot password panel ─────────────────────────── */}
            {authModal === 'forgot' ? (
              <>
                <button
                  style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12 }}
                  onClick={() => { setAuthModal('login'); setForgotResetLink(null); }}
                >
                  ← Back to Sign in
                </button>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.5px' }}>
                  Reset your password
                </h2>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
                  Enter your email and we&apos;ll generate a reset link for you.
                </p>

                {forgotResetLink && forgotResetLink !== '__notfound__' ? (
                  /* ── Reset link ready ── */
                  <div>
                    <div style={{
                      padding: '14px 16px', background: 'rgba(0,255,136,0.06)',
                      border: '1px solid rgba(0,255,136,0.25)', borderRadius: 12, marginBottom: 16,
                    }}>
                      <p style={{ fontSize: 13, color: '#00ff88', fontWeight: 600, marginBottom: 8 }}>✓ Reset link ready</p>
                      <p style={{ fontSize: 12, color: '#a0a0a0', lineHeight: 1.5, marginBottom: 12 }}>
                        Copy the link below and open it in your browser to set a new password. It expires in <strong style={{ color: '#fff' }}>1 hour</strong>.
                      </p>
                      <div style={{
                        background: '#111', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '10px 12px',
                        wordBreak: 'break-all', fontSize: 11, color: '#00d4ff', fontFamily: 'monospace',
                        lineHeight: 1.6, cursor: 'text', userSelect: 'all',
                      }}>
                        {forgotResetLink}
                      </div>
                    </div>
                    <button
                      className="gradient-btn"
                      style={{ width: '100%', padding: '13px', fontSize: 14, marginBottom: 10 }}
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(forgotResetLink); } catch { /* ignore */ }
                        window.open(forgotResetLink, '_blank');
                      }}
                    >
                      📋 Copy & Open reset link
                    </button>
                    <button
                      style={{ width: '100%', background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', padding: '6px 0' }}
                      onClick={() => { setForgotResetLink(null); setForgotEmail(''); }}
                    >
                      Request another link
                    </button>
                  </div>
                ) : forgotResetLink === '__notfound__' ? (
                  /* ── Account not found (neutral message) ── */
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#a0a0a0', lineHeight: 1.6, marginBottom: 20 }}>
                      If an account with that email exists, a reset link has been prepared.
                      <br />Please check your email or try signing up.
                    </p>
                    <button
                      className="pill-btn-secondary"
                      style={{ padding: '12px 28px', fontSize: 14 }}
                      onClick={() => { setForgotResetLink(null); setAuthModal('register'); }}
                    >
                      Create a new account
                    </button>
                  </div>
                ) : (
                  /* ── Forgot password form ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input
                      className="url-input"
                      style={{ padding: '14px 16px', fontSize: 15, borderRadius: 12, width: '100%', boxSizing: 'border-box' }}
                      type="email" placeholder="Email address" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleForgot(); }}
                      autoFocus
                    />
                    {forgotError && (
                      <p style={{ color: '#fca5a5', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                        {forgotError}
                      </p>
                    )}
                    <button
                      className="gradient-btn"
                      style={{ padding: '14px', fontSize: 15, width: '100%' }}
                      onClick={handleForgot}
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? 'Generating link…' : 'Get reset link'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* ── Login / Register panels ─────────────────────── */
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.5px' }}>
                  {authModal === 'login' ? 'Sign in' : 'Create account'}
                </h2>
                <p style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>
                  {authModal === 'login'
                    ? 'Welcome back — sign in to continue downloading.'
                    : 'Join free and get 3 downloads instantly.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    className="url-input"
                    style={{ padding: '14px 16px', fontSize: 15, borderRadius: 12, width: '100%', boxSizing: 'border-box' }}
                    type="email" placeholder="Email address" value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAuth(authModal as 'login' | 'register'); }}
                  />
                  <div>
                    <input
                      className="url-input"
                      style={{ padding: '14px 16px', fontSize: 15, borderRadius: 12, width: '100%', boxSizing: 'border-box' }}
                      type="password" placeholder="Password (min 8 characters)" value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAuth(authModal as 'login' | 'register'); }}
                    />
                    {authModal === 'login' && (
                      <div style={{ textAlign: 'right', marginTop: 6 }}>
                        <button
                          style={{ background: 'none', border: 'none', color: '#00d4ff', fontSize: 12, cursor: 'pointer', padding: 0 }}
                          onClick={() => openForgot()}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
                  {authError && (
                    <p style={{ color: '#fca5a5', fontSize: 13, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                      {authError}
                    </p>
                  )}
                  <button
                    className="gradient-btn"
                    style={{ padding: '14px', fontSize: 15, width: '100%' }}
                    onClick={() => handleAuth(authModal as 'login' | 'register')}
                    disabled={authLoading}
                  >
                    {authLoading ? '...' : authModal === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                </div>
                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#666' }}>
                  {authModal === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    style={{ color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                    onClick={() => { setAuthModal(authModal === 'login' ? 'register' : 'login'); setAuthError(''); }}
                  >
                    {authModal === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Subscription success banner */}
      {subscribedBanner && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, background: 'rgba(0,20,0,0.95)',
          border: '1px solid rgba(0,255,136,0.5)', borderRadius: 14,
          padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 0 40px rgba(0,255,136,0.2)',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <p style={{ color: '#00ff88', fontWeight: 700, fontSize: 15, margin: 0 }}>
              Welcome to VidSnap Pro!
            </p>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Your subscription is active — unlimited downloads unlocked.
            </p>
          </div>
          <button
            onClick={() => setSubscribedBanner(false)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 20, cursor: 'pointer', marginLeft: 8 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setShowPaywall(false)}>
          <div style={{
            background: '#0d0d0d', border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 20, padding: 40, width: '100%', maxWidth: 440, textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30,
            }}>⬇</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>
              Upgrade to <span className="gradient-text">Pro</span>
            </h2>
            <p style={{ fontSize: 15, color: '#a0a0a0', marginBottom: 8, lineHeight: 1.6 }}>
              You&apos;ve used all <strong style={{ color: '#fff' }}>3 free downloads</strong>.
            </p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>
              Subscribe for unlimited downloads — 1080p, 720p, 480p and audio.
            </p>
            <div style={{
              background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 16, padding: '20px 24px', marginBottom: 24,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>VidSnap Pro</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Unlimited downloads · All qualities</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="gradient-text" style={{ fontSize: 26, fontWeight: 700 }}>$10</span>
                <span style={{ color: '#666', fontSize: 13 }}>/month</span>
              </div>
            </div>
            <button
              className="gradient-btn"
              style={{ padding: '16px 32px', fontSize: 16, width: '100%', marginBottom: 12 }}
              onClick={handleSubscribe}
              disabled={stripeLoading}
            >
              {stripeLoading ? 'Redirecting...' : '⚡ Subscribe — $10/month'}
            </button>
            <button
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer' }}
              onClick={() => setShowPaywall(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '56px', display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#050505',
          }}>⬇</div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px', color: '#fff' }}>
            Vid<span className="gradient-text">Snap</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              {user.subscriptionStatus !== 'active' && downloadsLeft !== null && (
                <span style={{
                  fontSize: 12, color: downloadsLeft === 0 ? '#fca5a5' : '#00d4ff',
                  fontFamily: 'monospace', padding: '4px 10px',
                  background: downloadsLeft === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(0,212,255,0.1)',
                  borderRadius: 100, border: `1px solid ${downloadsLeft === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(0,212,255,0.2)'}`,
                }}>
                  {downloadsLeft}/{FREE_LIMIT} free
                </span>
              )}
              {user.subscriptionStatus === 'active' && (
                <span style={{
                  fontSize: 12, color: '#00ff88', fontFamily: 'monospace',
                  padding: '4px 10px', background: 'rgba(0,255,136,0.08)',
                  borderRadius: 100, border: '1px solid rgba(0,255,136,0.2)',
                }}>
                  ✓ Pro
                </span>
              )}
              {user.onPromo && user.subscriptionStatus !== 'active' && (
                <span style={{
                  fontSize: 12, color: '#a78bfa', fontFamily: 'monospace',
                  padding: '4px 10px', background: 'rgba(167,139,250,0.08)',
                  borderRadius: 100, border: '1px solid rgba(167,139,250,0.2)',
                }}>
                  🎁 Promo
                </span>
              )}
              <span style={{ fontSize: 13, color: '#666', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
              <a href="/history" style={{ color: '#6b7280', fontSize: 12, textDecoration: 'none', padding: '6px 12px', border: '1px solid #1e2030', borderRadius: 8 }}>
                History
              </a>
              <a href="/account" style={{ color: '#6b7280', fontSize: 12, textDecoration: 'none', padding: '6px 12px', border: '1px solid #1e2030', borderRadius: 8 }}>
                Account
              </a>
              <button className="pill-btn-secondary" style={{ padding: '6px 16px', fontSize: 12 }} onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <button className="pill-btn-secondary" style={{ padding: '7px 18px', fontSize: 13 }} onClick={() => setAuthModal('login')}>
                Sign in
              </button>
              <button className="gradient-btn" style={{ padding: '7px 18px', fontSize: 13 }} onClick={() => setAuthModal('register')}>
                Sign up free
              </button>
            </>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
        {/* Hero */}
        <section style={{ textAlign: 'center', padding: '80px 0 60px' }}>
          <div style={{
            display: 'inline-block', padding: '4px 16px', borderRadius: 100,
            border: '1px solid rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.06)',
            color: '#00d4ff', fontSize: 12, fontWeight: 500,
            letterSpacing: '0.5px', marginBottom: 24,
            fontFamily: 'monospace', textTransform: 'uppercase',
          }}>
            1080p · 720p · 480p · Audio
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 700,
            letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 20, color: '#fff',
          }}>
            Download Any Video
            <br />from <span className="gradient-text">Any Website</span>
          </h1>
          <p style={{ fontSize: 18, color: '#a0a0a0', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 48px' }}>
            {user
              ? user.subscriptionStatus === 'active'
                ? 'Unlimited downloads. Paste a link and go.'
                : `${downloadsLeft ?? 0} free download${(downloadsLeft ?? 0) !== 1 ? 's' : ''} remaining — subscribe for unlimited.`
              : 'Sign up free and get 3 downloads instantly. Subscribe for unlimited.'}
          </p>

          {/* URL Input */}
          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '8px 8px 8px 20px',
            }}>
              <span style={{ color: '#666', fontSize: 20, flexShrink: 0 }}>🔗</span>
              <input
                ref={inputRef}
                className="url-input"
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 16, padding: '10px 0', outline: 'none',
                  color: '#fff', minWidth: 0,
                }}
                placeholder="Paste video URL here..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleFetch(); }}
                disabled={(step as string) === 'loading' || isDownloading}
              />
              <button className="pill-btn-secondary" style={{ padding: '10px 20px', fontSize: 13, flexShrink: 0 }} onClick={handlePaste}>
                Paste
              </button>
              <button
                className="gradient-btn"
                style={{ padding: '12px 28px', fontSize: 15, flexShrink: 0 }}
                onClick={handleFetch}
                disabled={!url.trim() || (step as string) === 'loading' || isDownloading}
              >
                {(step as string) === 'loading' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="animate-spin-slow" style={{ display: 'inline-block' }}>⟳</span>
                    Fetching...
                  </span>
                ) : 'Analyze'}
              </button>
            </div>
          </div>

          {!user && (
            <p style={{ marginTop: 16, fontSize: 13, color: '#555' }}>
              <button style={{ color: '#00d4ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }} onClick={() => setAuthModal('register')}>
                Sign up free
              </button>
              {' '}to start downloading · 3 free downloads included
            </p>
          )}

          {error && (
            <div style={{
              marginTop: 16, padding: '12px 20px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, color: '#fca5a5', fontSize: 14,
              textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠ {error}
            </div>
          )}
        </section>

        {/* Video Info Card */}
        {(step === 'ready' || isDownloading) && videoInfo && (
          <section style={{ marginBottom: 60 }}>
            <div className="glow-card" style={{ padding: 28, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {videoInfo.thumbnail && (
                  <div style={{
                    flexShrink: 0, width: 200, height: 118, borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)', background: '#111',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={videoInfo.thumbnail} alt="thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      crossOrigin="anonymous"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#00d4ff', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                    {videoInfo.platform}
                  </div>
                  <h2 style={{
                    fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.3px',
                    lineHeight: 1.4, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {videoInfo.title}
                  </h2>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#a0a0a0' }}>👤 {videoInfo.uploader}</span>
                    {videoInfo.duration > 0 && <span style={{ fontSize: 13, color: '#a0a0a0' }}>⏱ {formatDuration(videoInfo.duration)}</span>}
                    <span style={{ fontSize: 13, color: '#a0a0a0' }}>📦 {videoInfo.formats.length} formats</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Format Selector */}
            <div className="glow-card" style={{ padding: 24, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', marginBottom: 16 }}>
                SELECT FORMAT & QUALITY
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {videoInfo.formats.map(fmt => (
                  <button key={fmt.format_id} onClick={() => setSelectedFormat(fmt)} style={{
                    background: selectedFormat?.format_id === fmt.format_id ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedFormat?.format_id === fmt.format_id ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 12, padding: '12px 16px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 150ms ease',
                    display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: selectedFormat?.format_id === fmt.format_id ? '#00d4ff' : '#fff' }}>
                      {fmt.label}
                    </span>
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {fmt.resolution !== 'best' && fmt.resolution !== 'audio only' ? fmt.resolution : ''}
                      {fmt.filesize ? ` · ${formatBytes(fmt.filesize)}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Download or Paywall Button */}
            <div style={{ display: 'flex', gap: 12 }}>
              {user && !user.canDownload ? (
                <button className="gradient-btn" style={{ flex: 1, padding: '18px 32px', fontSize: 16 }} onClick={() => setShowPaywall(true)}>
                  🔒 Subscribe to Download — $10/month
                </button>
              ) : (
                <button
                  className="gradient-btn"
                  style={{ flex: 1, padding: '18px 32px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  onClick={handleDownload}
                  disabled={!selectedFormat || isDownloading}
                >
                  {isDownloading ? (
                    <><span className="animate-spin-slow">⟳</span>{downloadStatus || 'Preparing...'}</>
                  ) : (
                    <>⬇ Download {selectedFormat?.label ?? ''}</>
                  )}
                </button>
              )}
              <button className="pill-btn-secondary" style={{ padding: '18px 24px', fontSize: 14 }} onClick={handleReset}>
                ✕ Clear
              </button>
            </div>

            {/* Progress bar */}
            {isDownloading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a0a0a0', marginBottom: 8 }}>
                  <span>{downloadProgress === 0 ? '⏳ Server is processing, please wait…' : downloadStatus}</span>
                  {downloadProgress > 0 && <span style={{ color: '#00d4ff', fontWeight: 600 }}>{downloadProgress}%</span>}
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                  <div className="progress-bar" style={{ height: '100%', width: `${downloadProgress || 2}%`, transition: 'width 300ms ease' }} />
                </div>
              </div>
            )}
            {downloadStatus && !isDownloading && (
              <p style={{ textAlign: 'center', color: '#00ff88', fontSize: 14, marginTop: 12 }}>{downloadStatus}</p>
            )}
          </section>
        )}

        {/* Pricing section (shown when idle) */}
        {step === 'idle' && (
          <section style={{ paddingBottom: 60 }}>
            <h2 style={{ textAlign: 'center', fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: '#fff', marginBottom: 32 }}>
              Simple <span className="gradient-text">Pricing</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 48 }}>
              {[
                { title: 'Free', price: '$0', period: '', color: '#666', desc: '3 downloads total', features: ['1080p · 720p · 480p', 'Audio extraction', '1000+ supported sites'], cta: 'Sign up free', onClick: () => setAuthModal('register'), primary: false },
                { title: 'Pro', price: '$10', period: '/month', color: '#00d4ff', desc: 'Unlimited downloads', features: ['All qualities', 'Audio extraction', 'Priority support'], cta: '⚡ Subscribe now', onClick: handleSubscribe, primary: true },
              ].map(plan => (
                <div key={plan.title} className="glow-card" style={{ padding: 28, position: 'relative', border: plan.primary ? '1px solid rgba(0,212,255,0.4)' : undefined }}>
                  {plan.primary && (
                    <div style={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                      color: '#050505', fontSize: 11, fontWeight: 700,
                      padding: '3px 14px', borderRadius: 100, letterSpacing: '0.5px', whiteSpace: 'nowrap',
                    }}>BEST VALUE</div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: plan.color, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{plan.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span className={plan.primary ? 'gradient-text' : ''} style={{ fontSize: 36, fontWeight: 700, color: plan.primary ? undefined : '#fff' }}>{plan.price}</span>
                      <span style={{ fontSize: 14, color: '#666' }}>{plan.period}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{plan.desc}</div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ fontSize: 14, color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#00ff88' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={plan.primary ? 'gradient-btn' : 'pill-btn-secondary'}
                    style={{ width: '100%', padding: '12px', fontSize: 14 }}
                    onClick={plan.onClick}
                    disabled={stripeLoading && plan.primary}
                  >
                    {stripeLoading && plan.primary ? 'Redirecting...' : plan.cta}
                  </button>
                </div>
              ))}
            </div>

            {/* Promo code redemption */}
            <div style={{ textAlign: 'center' }}>
              {!showPromoInput ? (
                <button
                  style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { setShowPromoInput(true); setPromoMsg(null); }}
                >
                  🎁 Have a promo code?
                </button>
              ) : (
                <div style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  background: '#0d0d18', border: '1px solid rgba(167,139,250,0.3)',
                  borderRadius: 16, padding: '20px 28px', minWidth: 320,
                }}>
                  <p style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600, margin: 0 }}>🎁 Enter your promo code</p>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input
                      className="url-input"
                      style={{ flex: 1, padding: '10px 14px', fontSize: 14, borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      placeholder="e.g. FRIEND30"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === 'Enter') handlePromoRedeem(); }}
                      autoFocus
                    />
                    <button
                      className="gradient-btn"
                      style={{ padding: '10px 20px', fontSize: 14, flexShrink: 0 }}
                      onClick={handlePromoRedeem}
                      disabled={promoLoading}
                    >
                      {promoLoading ? '…' : 'Apply'}
                    </button>
                  </div>
                  {promoMsg && (
                    <p style={{
                      fontSize: 13, margin: 0,
                      color: promoMsg.ok ? '#00ff88' : '#fca5a5',
                    }}>
                      {promoMsg.text}
                    </p>
                  )}
                  <button
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer' }}
                    onClick={() => { setShowPromoInput(false); setPromoMsg(null); setPromoCode(''); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Supported Platforms */}
        {step === 'idle' && (
          <section style={{ paddingBottom: 80 }}>
            <h2 style={{ textAlign: 'center', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#666', marginBottom: 24 }}>
              Supported Platforms
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {SUPPORTED_PLATFORMS.map(p => (
                <div key={p.name} className="glow-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, background: `${p.color}20`,
                    border: `1px solid ${p.color}40`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, color: p.color, fontWeight: 700, flexShrink: 0,
                  }}>{p.icon}</span>
                  <span style={{ fontSize: 14, color: '#a0a0a0', fontWeight: 500 }}>{p.name}</span>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20, fontFamily: 'monospace' }}>
              + 1000 more sites powered by yt-dlp
            </p>
          </section>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px 24px', textAlign: 'center', color: '#555', fontSize: 13 }}>
        <p style={{ marginBottom: 12 }}>VidSnap — Powered by yt-dlp · For personal use only · Respect content creators&apos; rights</p>
        <p>
          <a href="/terms" style={{ color: '#374151', marginRight: 20, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ color: '#374151', marginRight: 20, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/refunds" style={{ color: '#374151', textDecoration: 'none' }}>Refund Policy</a>
        </p>
      </footer>
    </div>
  );
}
