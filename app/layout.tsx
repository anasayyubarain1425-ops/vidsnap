import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { AgentationGuard } from '@/components/AgentationGuard';
import { HappySeedsWatermark } from '@/components/HappySeedsWatermark';
import './globals.css';
import jsonMetadata from '../metadata.json';

export const metadata: Metadata = jsonMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === 'production' && (
          <Script
            async
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
        {/* Paddle.js — loads only when client token is configured */}
        {process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN && (
          <>
            <Script src="https://cdn.paddle.com/paddle/v2/paddle.js" strategy="afterInteractive" />
            <Script id="paddle-init" strategy="afterInteractive">{`
              window.__paddleReady = function() {
                if (window.Paddle) {
                  Paddle.Setup({
                    token: '${process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN}',
                    pwCustomer: {},
                    eventCallback: function(data) {
                      if (data.name === 'checkout.completed') {
                        window.location.href = '/?subscribed=1';
                      }
                    }
                  });
                }
              };
              if (document.readyState === 'complete') window.__paddleReady();
              else window.addEventListener('load', window.__paddleReady);
            `}</Script>
          </>
        )}
      </head>
      <body className="antialiased">
        {children}
        <HappySeedsWatermark />
        <AgentationGuard />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
