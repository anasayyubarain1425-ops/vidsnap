import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { createReadStream, statSync, unlinkSync, existsSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getSession, FREE_DOWNLOAD_LIMIT } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { hasUnlimitedAccess } from '@/lib/promo';
import { db } from '@/db';
import { users, downloadHistory } from '@/db/schemas/users';
import { eq, sql } from 'drizzle-orm';

const execFileAsync = promisify(execFile);

function validateUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('Invalid URL');
  }
  new URL(trimmed);
  return trimmed;
}

function validateFormatId(formatId: string): string {
  // Allow all characters used in yt-dlp format selectors and real format IDs
  // including spaces, parens, @, |, +, /, -, ., comma, [, ], =, ~, ^, *, !, <, >
  // Only block shell-dangerous characters: ;, &, $, `, \n, \r, null bytes
  if (/[;&$`\r\n\0]/.test(formatId)) {
    throw new Error('Invalid format ID');
  }
  // Must not be empty and must have reasonable length
  if (!formatId || formatId.length > 500) {
    throw new Error('Invalid format ID');
  }
  return formatId;
}

function safeFilename(raw: string): string {
  return raw.replace(/[/\\:*?"<>|]/g, '_').trim() || 'video.mp4';
}

const MIME: Record<string, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl      = searchParams.get('url') ?? '';
  const rawFormat   = searchParams.get('format_id') ?? 'best[ext=mp4]/best';
  const rawFilename = searchParams.get('filename') ?? 'video.mp4';
  const rawTitle    = searchParams.get('title') ?? '';
  const rawThumb    = searchParams.get('thumbnail') ?? '';
  const rawPlatform = searchParams.get('platform') ?? '';
  const rawDuration = searchParams.get('duration') ?? '';
  const rawLabel    = searchParams.get('format_label') ?? '';

  let safeUrl: string;
  try { safeUrl = validateUrl(rawUrl); }
  catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

  let safeFormat: string;
  try { safeFormat = validateFormatId(rawFormat); }
  catch { return NextResponse.json({ error: 'Invalid format' }, { status: 400 }); }

  // ── Auth & quota enforcement ──────────────────────────────────────────────
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Please sign in to download videos.', code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  // Rate limit: 20 stream calls per minute per user
  const rl = rateLimit(`stream:${session.userId}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many download requests. Please wait a moment.', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      downloadCount: users.downloadCount,
      subscriptionStatus: users.subscriptionStatus,
      promoExpiresAt: users.promoExpiresAt,
    })
    .from(users).where(eq(users.id, session.userId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'Account not found.', code: 'UNAUTHENTICATED' }, { status: 401 });
  }

  const unlimited = hasUnlimitedAccess(user);
  const isFreeAndExhausted = !unlimited && user.downloadCount >= FREE_DOWNLOAD_LIMIT;

  if (isFreeAndExhausted) {
    return NextResponse.json({ error: 'Free download limit reached. Subscribe for unlimited downloads.', code: 'QUOTA_EXCEEDED' }, { status: 402 });
  }

  // ── Quality restriction for free users (max 720p) ─────────────────────────
  if (!unlimited) {
    // Check if the requested format is above 720p
    const heightMatch = rawLabel.match(/(\d+)p/);
    const requestedHeight = heightMatch ? parseInt(heightMatch[1], 10) : 0;
    if (requestedHeight > 720) {
      return NextResponse.json({
        error: 'Quality above 720p is available for Pro subscribers only. Please subscribe or select 720p or lower.',
        code: 'QUALITY_RESTRICTED'
      }, { status: 402 });
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const filename = safeFilename(rawFilename);

  // Use a base path without extension — yt-dlp will add the real extension
  const uid      = randomUUID();
  const tmpBase  = join(tmpdir(), `videograbtool-${uid}`);
  // Output template: base.%(ext)s  → yt-dlp writes e.g. videograbtool-<uid>.mp4
  const outTemplate = `${tmpBase}.%(ext)s`;

  try {
    await execFileAsync(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-warnings',
        '--no-part',
        '--no-mtime',
        '--extractor-args', 'youtube:player_client=tv_embedded',
        '-f', safeFormat,
        '-o', outTemplate,
        safeUrl,
      ],
      { timeout: 300_000 }
    );

    // Find the actual file yt-dlp created (it chooses the extension)
    const tmpDir = tmpdir();
    const files  = readdirSync(tmpDir).filter(f => f.startsWith(`videograbtool-${uid}`));
    const tmpFile = files.length > 0 ? join(tmpDir, files[0]) : null;

    if (!tmpFile || !existsSync(tmpFile)) {
      return NextResponse.json({ error: 'Download failed — output file not found.' }, { status: 500 });
    }

    // Increment download counter only for free-tier users (no promo, no paid sub)
    if (!unlimited) {
      await db.update(users)
        .set({ downloadCount: sql`${users.downloadCount} + 1`, updatedAt: sql`now()` })
        .where(eq(users.id, user.id));
    }

    // Record to download history (fire-and-forget; never block the response)
    const { size } = statSync(tmpFile);
    const ext       = tmpFile.split('.').pop() ?? 'mp4';
    const mime      = MIME[ext] ?? 'application/octet-stream';

    // Replace the extension in the user-facing filename with the real ext
    const baseName  = filename.replace(/\.[^.]+$/, '');
    const finalName = `${baseName}.${ext}`;

    // Record download to history (non-blocking)
    db.insert(downloadHistory).values({
      id: randomUUID(),
      userId: user.id,
      url: safeUrl,
      title: rawTitle.slice(0, 500) || baseName,
      thumbnail: rawThumb.slice(0, 1000) || null,
      platform: rawPlatform.slice(0, 100) || 'Unknown',
      formatLabel: rawLabel.slice(0, 100) || safeFormat,
      formatId: safeFormat.slice(0, 100),
      fileSizeBytes: size,
      durationSeconds: rawDuration ? parseInt(rawDuration, 10) || null : null,
    }).catch(() => { /* never block the download */ });

    // Stream the temp file to the browser
    const nodeStream = createReadStream(tmpFile);

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer | string) => {
          const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
          controller.enqueue(new Uint8Array(buf));
        });
        nodeStream.on('end', () => {
          controller.close();
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
          try { unlinkSync(tmpFile); } catch { /* ignore */ }
        });
      },
      cancel() {
        nodeStream.destroy();
        try { unlinkSync(tmpFile); } catch { /* ignore */ }
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(size),
        'Content-Disposition': `attachment; filename="${finalName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    // Clean up any partial files
    try {
      const tmpDir = tmpdir();
      readdirSync(tmpDir)
        .filter(f => f.startsWith(`videograbtool-${uid}`))
        .forEach(f => { try { unlinkSync(join(tmpDir, f)); } catch { /* ignore */ } });
    } catch { /* ignore */ }

    console.error('[stream]', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('timeout')) {
      return NextResponse.json({ error: 'Download timed out. Try a shorter video or lower quality.' }, { status: 504 });
    }
    if (msg.includes('403')) {
      return NextResponse.json({ error: 'Access denied by the video provider. Try a different quality.' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Failed to download video. Try selecting a different quality.' }, { status: 500 });
  }
}
