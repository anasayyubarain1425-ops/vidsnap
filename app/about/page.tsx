import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About – VideoGrabTool',
  description: 'Learn about VideoGrabTool — a fast, reliable online video downloader supporting 1000+ websites including YouTube, TikTok, Instagram, and more.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>{title}</h2>
      <div style={{ color: '#9ca3af', lineHeight: 1.8, fontSize: 15 }}>{children}</div>
    </section>
  );
}

export default function AboutPage() {
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
          About VideoGrabTool
        </h1>
        <p style={{ color: '#6b7280', marginBottom: 40, fontSize: 14 }}>Fast, reliable, and easy-to-use video downloader</p>

        <Section title="What is VideoGrabTool?">
          <p>VideoGrabTool is an online video downloading service that allows users to save videos from over 1,000 websites and social media platforms for personal, offline viewing. Simply paste a video URL and download in your preferred quality — no software installation required.</p>
        </Section>

        <Section title="Supported Platforms">
          <p>VideoGrabTool supports a wide range of popular platforms, including:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 2 }}>
            <li><strong style={{ color: '#e2e8f0' }}>YouTube</strong> — Music videos, tutorials, vlogs, and more</li>
            <li><strong style={{ color: '#e2e8f0' }}>TikTok</strong> — Short-form videos</li>
            <li><strong style={{ color: '#e2e8f0' }}>Instagram</strong> — Reels, posts, and stories</li>
            <li><strong style={{ color: '#e2e8f0' }}>Facebook</strong> — Public videos and reels</li>
            <li><strong style={{ color: '#e2e8f0' }}>Twitter / X</strong> — Video tweets</li>
            <li><strong style={{ color: '#e2e8f0' }}>Vimeo</strong> — Professional and creative videos</li>
            <li><strong style={{ color: '#e2e8f0' }}>Dailymotion</strong> — News, entertainment, sports</li>
            <li><strong style={{ color: '#e2e8f0' }}>1,000+ more</strong> — Powered by yt-dlp</li>
          </ul>
          <p style={{ marginTop: 12 }}>Pro subscribers get access to an even wider range of 10,000+ supported websites. Note: not every video on every platform can be downloaded — some sites use DRM, authentication, or technical protections that prevent downloading.</p>
        </Section>

        <Section title="Quality Options">
          <p>Free users can download videos up to <strong style={{ color: '#00ff88' }}>720p</strong> quality. Pro subscribers can download at any available quality including <strong style={{ color: '#00d4ff' }}>1080p, 1440p, and 4K</strong>.</p>
        </Section>

        <Section title="Our Mission">
          <p>We believe in making the internet more accessible. VideoGrabTool is designed to help users save videos for offline viewing — for travel, areas with poor connectivity, or simply to keep a personal archive of content they have the right to save.</p>
        </Section>

        <Section title="Legal & Responsible Use">
          <p>VideoGrabTool is a tool — how you use it matters. We strongly encourage all users to:</p>
          <ul style={{ marginTop: 10, paddingLeft: 20, lineHeight: 1.9 }}>
            <li>Only download content you have the right to download</li>
            <li>Respect content creators&apos; intellectual property</li>
            <li>Use downloaded content for personal, non-commercial purposes only</li>
            <li>Review the terms of service of the platform you are downloading from</li>
          </ul>
          <p style={{ marginTop: 12 }}>VideoGrabTool does not host, store, or distribute any video content. All videos are sourced directly from the original platforms.</p>
        </Section>

        <Section title="Technology">
          <p>VideoGrabTool is powered by <strong style={{ color: '#e2e8f0' }}>yt-dlp</strong>, one of the most widely used and trusted open-source video downloading tools. Our service wraps this technology in a clean, user-friendly interface with secure authentication and subscription management.</p>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid #1e2030', padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>
        <Link href="/terms" style={{ color: '#374151', marginRight: 20 }}>Terms</Link>
        <Link href="/privacy" style={{ color: '#374151', marginRight: 20 }}>Privacy</Link>
        <Link href="/contact" style={{ color: '#374151', marginRight: 20 }}>Contact</Link>
        <Link href="/" style={{ color: '#374151' }}>Home</Link>
      </footer>
    </div>
  );
}
