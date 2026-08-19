import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer – VideoGrabTool',
  description: 'Read VideoGrabTool\u2019s disclaimer about video downloading, copyright, and responsible use.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ color: '#9ca3af', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}

export default function DisclaimerPage() {
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
          Disclaimer
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Last updated: August 2026</p>

        <Section title="General Information">
          <p>VideoGrabTool is an online tool that helps users download publicly available videos for personal use. We do not host, store, upload, or distribute any video content. All videos are fetched directly from the original platforms at the user&apos;s request.</p>
        </Section>

        <Section title="Copyright & Intellectual Property">
          <p>All trademarks, service marks, logos, and content displayed belong to their respective owners. VideoGrabTool does not claim ownership of any video content accessed through our service.</p>
          <p style={{ marginTop: 12 }}>VideoGrabTool does not bypass DRM (Digital Rights Management), access private or paywalled content, or circumvent technical protection measures.</p>
        </Section>

        <Section title="User Responsibility">
          <p>Users are solely responsible for ensuring they have the legal right to download and use any content obtained through VideoGrabTool. Downloading copyrighted content without the permission of the rights holder may violate applicable laws, including copyright law and the terms of service of the source platform.</p>
          <p style={{ marginTop: 12 }}>By using our service, you agree to use it only for lawful purposes and to respect the rights of content creators.</p>
        </Section>

        <Section title="No Warranty">
          <p>The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, whether express or implied, including but not limited to the availability of certain videos or the ability to download content from every website.</p>
          <p style={{ marginTop: 12 }}>Not every video on every platform can be downloaded — some platforms use DRM, authentication, or other technical protections. VideoGrabTool makes no guarantees regarding the downloadability of any specific video.</p>
        </Section>

        <Section title="External Links">
          <p>Our service may reference or link to third-party websites or platforms. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites.</p>
        </Section>

        <Section title="Limitation of Liability">
          <p>To the maximum extent permitted by law, VideoGrabTool shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, related to your use of the service.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 20 }}>Terms</Link>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 20 }}>Privacy</Link>
        <Link href="/cookies" style={{ color: '#374151', marginRight: 20 }}>Cookie Policy</Link>
        <Link href="/contact" style={{ color: '#374151' }}>Contact</Link>
      </footer>
    </div>
  );
}
