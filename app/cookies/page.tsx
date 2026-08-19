import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy – VideoGrabTool',
  description: 'Learn how VideoGrabTool uses cookies and similar technologies, and how you can control them.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ color: '#9ca3af', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}

export default function CookiePolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#060612', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <nav style={{ borderBottom: '1px solid #1e2030', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: 20 }}>
          VideoGrabTool
        </Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>← Back to home</Link>
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Cookie Policy
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Last updated: August 2026</p>

        <Section title="What Are Cookies?">
          <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, keep you logged in, and understand how the site is used so it can be improved.</p>
        </Section>

        <Section title="How We Use Cookies">
          <p>VideoGrabTool uses cookies for the following purposes:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li><strong style={{ color: '#e2e8f0' }}>Essential cookies</strong> — Required for login and to keep you signed in securely.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Authentication cookies</strong> — Store your login session so you do not have to log in again on every page.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Analytics cookies</strong> — Help us understand which pages are visited so we can improve the service.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Advertising cookies</strong> — If and when we run ads (for example Google AdSense), these help serve relevant ads and measure their performance.</li>
          </ul>
        </Section>

        <Section title="Third-Party Cookies">
          <p>When you interact with third-party services we may use, such as analytics providers or advertising networks like Google AdSense, those services may set their own cookies. These cookies are governed by the third party&apos;s own privacy policies.</p>
        </Section>

        <Section title="Managing Cookies">
          <p>You can control or delete cookies through your browser settings. Most browsers let you:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>See what cookies are set and delete individual ones</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies from a specific site</li>
            <li>Clear all cookies when you close your browser</li>
          </ul>
          <p style={{ marginTop: 12 }}>Please note: if you disable essential cookies, some features — such as logging in — may not work correctly.</p>
        </Section>

        <Section title="Contact">
          <p>If you have any questions about this Cookie Policy, please contact us at <span style={{ color: '#00d4ff' }}>support@videograbtool.com</span>.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 20 }}>Terms</Link>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 20 }}>Privacy</Link>
        <Link href="/about" style={{ color: '#374151', marginRight: 20 }}>About</Link>
        <Link href="/contact" style={{ color: '#374151' }}>Contact</Link>
      </footer>
    </div>
  );
}
