/**
 * URL safety checks for SSRF (Server-Side Request Forgery) protection.
 *
 * yt-dlp fetches whatever URL the user submits. Without safeguards, a user
 * could point the server at internal infrastructure (localhost, cloud metadata
 * endpoints like 169.254.169.254, private network ranges) and exfiltrate data.
 *
 * These helpers reject obviously-internal targets before any request is made.
 */

import { createHash } from 'crypto';
import { isIP } from 'net';

const ALLOWED_SCHEMES = new Set(['http:', 'https:']);

// Hostnames that resolve to private/internal services and must never be fetched.
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  'metadata.google.internal',
  'metadata.google.com',
  '169.254.169.254', // AWS/GCP/Azure metadata endpoint
  'metadata.azure.internal',
  '169.254.170.2',   // AWS ECS credential endpoint
  'metadata',
]);

/**
 * Returns true when the given host is safe to fetch via yt-dlp.
 * Throws an Error with a user-friendly message when it is not.
 */
export function assertSafeHost(host: string): void {
  if (!host) {
    throw new Error('Invalid URL');
  }

  const lowered = host.toLowerCase();

  // Direct IP check
  if (isIP(host) !== 0) {
    if (isPrivateIp(host)) {
      throw new Error('This URL points to an internal/private address and cannot be processed.');
    }
    return;
  }

  // Hostname check
  if (BLOCKED_HOSTNAMES.has(lowered)) {
    throw new Error('This URL points to an internal service and cannot be processed.');
  }

  // Subdomain-based internal hosts (e.g. a.b.localhost, metadata.google.internal.com)
  for (const blocked of BLOCKED_HOSTNAMES) {
    if (lowered === blocked || lowered.endsWith(`.${blocked}`)) {
      throw new Error('This URL points to an internal service and cannot be processed.');
    }
  }
}

/**
 * Validates the full URL: scheme + host safety.
 * Returns the normalized URL, or throws.
 */
export function validatePublicUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new Error('Only http/https URLs are supported.');
  }

  assertSafeHost(parsed.hostname);

  // Block URLs that would read local files or use dangerous schemes
  if (trimmed.startsWith('file:')) {
    throw new Error('file URLs are not supported.');
  }

  return trimmed;
}

/**
 * Checks if an IPv4/IPv6 literal is a private/reserved address that yt-dlp
 * should never be pointed at (SSRF risk).
 */
function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    const [a, b] = parts;
    // 10.0.0.0/8
    if (a === 10) return true;
    // 127.0.0.0/8 loopback
    if (a === 127) return true;
    // 169.254.0.0/16 link-local (cloud metadata)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
    // 100.64.0.0/10 CGNAT
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    // ::1 loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // :: link-local / unspecified, fc00::/7 unique local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true; // link-local
    if (lower === '::') return true;
    return false;
  }

  return true; // unparseable → treat as unsafe
}

/**
 * FNV-1a hash helper (kept for future cache-key usage).
 */
export function simpleHash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 12);
}
