import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – VidSnap',
  description: 'VidSnap Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#060612', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #1e2030', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
          VidSnap
        </Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>← Back to home</Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Last updated: August 2025</p>

        <Section title="1. Introduction">
          <p>VidSnap ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following information when you use VidSnap:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li><strong style={{ color: '#e2e8f0' }}>Account data:</strong> your email address and a hashed (bcrypt) version of your password.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Download history:</strong> a log of URLs you have downloaded, including timestamps and video titles, used to display your history and enforce download quotas.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Payment data:</strong> subscription status and Paddle customer ID. We do not store credit card numbers — all payment processing is handled by Paddle.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Usage data:</strong> IP address (used for rate limiting only, not stored long-term), browser type, and basic request logs.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use collected data to:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Provide and maintain the Service, including enforcing download quotas.</li>
            <li>Manage your subscription and process payments via Paddle.</li>
            <li>Send password reset emails when requested.</li>
            <li>Prevent abuse, fraud, and violations of our Terms of Service.</li>
            <li>Improve the Service based on aggregate, anonymised usage patterns.</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p>We do not sell your personal data. We share data only with:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li><strong style={{ color: '#e2e8f0' }}>Paddle:</strong> our payment processor, which handles subscription billing. Paddle's privacy policy applies to data they collect during checkout.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Infrastructure providers:</strong> hosting and database services necessary to operate VidSnap, bound by data processing agreements.</li>
            <li><strong style={{ color: '#e2e8f0' }}>Law enforcement:</strong> only when required by applicable law or to protect our legal rights.</li>
          </ul>
        </Section>

        <Section title="5. Cookies and Session Data">
          <p>VidSnap uses a single HttpOnly session cookie to keep you logged in. This cookie does not track you across other websites and expires when your session ends or you log out. We do not use advertising or third-party tracking cookies.</p>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your account and download history for as long as your account is active. You may delete your account at any time from the Account page, which permanently removes all associated data from our systems.</p>
        </Section>

        <Section title="7. Security">
          <p>We use industry-standard security measures including password hashing (bcrypt), encrypted connections (HTTPS/TLS), and HttpOnly cookies. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>VidSnap is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>
        </Section>

        <Section title="9. Your Rights">
          <p>You have the right to access, correct, or delete your personal data. You can manage most of this directly from your Account settings page. For additional requests, contact us via your registered email address.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date.</p>
        </Section>

        <Section title="11. Contact">
          <p>If you have any questions about this Privacy Policy, please contact us via the email address used to register your account.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 24 }}>Terms of Service</Link>
        <Link href="/refunds" style={{ color: '#374151', marginRight: 24 }}>Refund Policy</Link>
        <Link href="/" style={{ color: '#374151' }}>Home</Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ color: '#9ca3af', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}
