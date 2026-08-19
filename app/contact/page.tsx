import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us – VideoGrabTool',
  description: 'Get in touch with the VideoGrabTool team. We are here to help with any questions, issues, or feedback.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ color: '#9ca3af', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}

export default function ContactPage() {
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
          Contact Us
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>We typically respond within 1 business day</p>

        <Section title="General Support">
          <p>For general questions, technical issues, or feedback about VideoGrabTool, please reach out to us using the email address you used to create your account. Include as much detail as possible about your issue, including:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>The video URL you were trying to download</li>
            <li>The error message you received (if any)</li>
            <li>Your browser and operating system</li>
          </ul>
        </Section>

        <Section title="Billing & Subscriptions">
          <p>For billing questions, refund requests, or subscription management, please contact us with your account email. For urgent billing matters, you can also manage your subscription directly through our payment provider&apos;s customer portal.</p>
          <p style={{ marginTop: 10 }}>Refund requests are handled according to our <Link href="/refunds" style={{ color: '#00d4ff' }}>Refund Policy</Link>.</p>
        </Section>

        <Section title="Copyright & DMCA">
          <p>VideoGrabTool does not host or store any video content. If you believe content accessible through our service infringes your copyright, please note that you should contact the original platform (YouTube, TikTok, etc.) directly to have the content removed at the source.</p>
          <p style={{ marginTop: 10 }}>For any other copyright concerns related specifically to VideoGrabTool, please contact us via your registered email with the subject line &quot;Copyright Concern&quot;.</p>
        </Section>

        <Section title="Business Inquiries">
          <p>For partnership, advertising, or other business inquiries, please contact us via email with the subject line &quot;Business Inquiry&quot;.</p>
        </Section>

        <Section title="Response Time">
          <p>We aim to respond to all inquiries within <strong style={{ color: '#00ff88' }}>1 business day</strong>. During high-volume periods, it may take up to 3 business days. We appreciate your patience.</p>
        </Section>

        {/* Contact Card */}
        <div style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 16, padding: 28, textAlign: 'center', marginTop: 8 }}>
          <p style={{ color: '#9ca3af', marginBottom: 8 }}>Send us an email using your registered account email</p>
          <p style={{ color: '#00d4ff', fontWeight: 600, fontSize: 18 }}>support@videograbtool.com</p>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>Response time: within 1 business day</p>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 20 }}>Terms</Link>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 20 }}>Privacy</Link>
        <Link href="/about" style={{ color: '#374151', marginRight: 20 }}>About</Link>
        <Link href="/" style={{ color: '#374151' }}>Home</Link>
      </footer>
    </div>
  );
}
