import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy – VideoGrabTool',
  description: 'VideoGrabTool Refund Policy',
};

export default function RefundsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#060612', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #1e2030', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: 20, letterSpacing: "-0.5px" }}>
          VideoGrabTool
        </Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>← Back to home</Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Refund Policy
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Last updated: August 2025</p>

        <Section title="Our Commitment">
          <p>We want you to be satisfied with VideoGrabTool. If you're not happy with your subscription for any reason, we're here to help.</p>
        </Section>

        <Section title="30-Day Money-Back Guarantee">
          <p>If you subscribed to VideoGrabTool Pro and are not satisfied, you may request a full refund within <strong style={{ color: '#00ff88' }}>30 days</strong> of your initial purchase. No questions asked.</p>
          <p style={{ marginTop: 10 }}>To request a refund, contact us with the email address associated with your account within 30 days of the charge. We will process the refund within 5–10 business days back to your original payment method.</p>
        </Section>

        <Section title="Subscription Renewals">
          <p>Monthly subscription renewals are eligible for a refund if requested within <strong style={{ color: '#00ff88' }}>7 days</strong> of the renewal charge date. After 7 days, renewal charges are non-refundable.</p>
          <p style={{ marginTop: 10 }}>We recommend cancelling your subscription before the renewal date if you no longer wish to be charged. You can cancel at any time from your Account settings page — cancellation takes effect at the end of the current billing period, and you retain access until then.</p>
        </Section>

        <Section title="How to Cancel">
          <ol style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Log in to your VideoGrabTool account.</li>
            <li>Go to <strong style={{ color: '#e2e8f0' }}>Account → Subscription</strong>.</li>
            <li>Click <strong style={{ color: '#e2e8f0' }}>Cancel Subscription</strong>.</li>
          </ol>
          <p style={{ marginTop: 10 }}>Alternatively, you can manage your subscription directly through Paddle's customer portal using the billing email you used to subscribe.</p>
        </Section>

        <Section title="Non-Refundable Items">
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Free tier usage — the free plan has no charge and is therefore not eligible for a refund.</li>
            <li>Accounts that have been suspended or terminated due to violations of our Terms of Service.</li>
            <li>Charges older than 30 days (initial purchase) or 7 days (renewals), except where required by applicable law.</li>
          </ul>
        </Section>

        <Section title="Contact Us">
          <p>To request a refund or if you have any questions about billing, please contact us using the email address associated with your VideoGrabTool account. We aim to respond within 1 business day.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 24 }}>Terms of Service</Link>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 24 }}>Privacy Policy</Link>
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
