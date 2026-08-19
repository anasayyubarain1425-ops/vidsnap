import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – QuickSnap',
  description: 'QuickSnap Terms of Service',
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#060612', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ borderBottom: '1px solid #1e2030', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ textDecoration: 'none', background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>
          QuickSnap
        </Link>
        <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>← Back to home</Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(90deg,#00d4ff,#00ff88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Terms of Service
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Last updated: August 2025</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using QuickSnap ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>QuickSnap provides a web-based tool that allows users to download publicly available videos from supported platforms for personal, non-commercial use. The Service operates on a freemium model: registered users receive 3 free downloads; additional downloads require a paid subscription.</p>
        </Section>

        <Section title="3. User Accounts">
          <p>You must register with a valid email address and password to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must be at least 13 years of age to create an account.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree to use QuickSnap only for lawful purposes. You must not:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Download content that you do not have the right to access or download.</li>
            <li>Reproduce, distribute, or publicly display downloaded content in violation of the original content creator's rights or applicable copyright law.</li>
            <li>Use the Service for any automated, bulk, or commercial scraping purpose.</li>
            <li>Attempt to circumvent any rate limits, access controls, or technical measures.</li>
            <li>Use the Service to download content that is illegal, harmful, or infringes third-party rights.</li>
          </ul>
        </Section>

        <Section title="5. Intellectual Property">
          <p>QuickSnap does not host, store, or distribute video content. All videos are streamed directly from the original source. You acknowledge that downloaded content may be protected by copyright and that QuickSnap bears no responsibility for your use of such content.</p>
        </Section>

        <Section title="6. Subscriptions and Payments">
          <p>Paid subscriptions are processed securely through Paddle. By subscribing, you authorize recurring monthly charges of $10 USD. Subscriptions renew automatically unless cancelled before the next billing cycle. Promo codes, where applicable, may modify subscription terms as described at the time of redemption.</p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>The Service is provided "as is" without warranties of any kind, express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or that any particular video will be available for download at any given time, as availability depends on third-party platforms.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, QuickSnap and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service.</p>
        </Section>

        <Section title="9. Termination">
          <p>We reserve the right to suspend or terminate your account at any time if you violate these Terms. You may delete your account at any time from the Account settings page.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We may update these Terms at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.</p>
        </Section>

        <Section title="11. Contact">
          <p>For any questions regarding these Terms, please contact us via the email address used to register your account.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 24 }}>Privacy Policy</Link>
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
