import type { NextConfig } from 'next';
import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load .env only if it exists (not present on Railway/CI — env vars injected directly)
if (existsSync('.env')) {
  dotenv.config({ path: '.env', override: true });
}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    PROJECT_ID: process.env.HAPPYSEEDS_PROJECT_ID ?? '',
    REACTUS_BASE_URL: process.env.REACTUS_BASE_URL ?? '',
  },
  serverExternalPackages: [],
  allowedDevOrigins: [
    '**.*.*',
  ],
};

export default nextConfig;
