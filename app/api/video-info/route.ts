import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { rateLimit } from '@/lib/rate-limit';
import { validatePublicUrl } from '@/lib/url-safety';

const execFileAsync = promisify(execFile);

export interface VideoFormat {
  format_id: string;
  ext: string;
  resolution: string;
  filesize: number | null;
  vcodec: string;
  acodec: string;
  tbr: number | null;
  label: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  platform: string;
  webpage_url: string;
  formats: VideoFormat[];
}

function validateUrl(url: string): string {
  return validatePublicUrl(url);
}

function buildFormats(rawFormats: Record<string, unknown>[]): VideoFormat[] {
  const seen = new Set<string>();
  const result: VideoFormat[] = [];

  // Sort by quality descending
  const sorted = [...rawFormats].sort((a, b) => {
    const ha = typeof a.height === 'number' ? a.height : 0;
    const hb = typeof b.height === 'number' ? b.height : 0;
    return hb - ha;
  });

  for (const f of sorted) {
    const vcodec = String(f.vcodec ?? 'none');
    const acodec = String(f.acodec ?? 'none');
    const ext = String(f.ext ?? 'mp4');
    const height = typeof f.height === 'number' ? f.height : null;
    const width = typeof f.width === 'number' ? f.width : null;
    const format_id = String(f.format_id ?? '');

    // Skip fragments / manifests / storyboards
    if (['mhtml', 'sb0', 'sb1', 'sb2', 'sb3'].includes(ext)) continue;

    let label = '';
    let resolution = '';
    let usedFormatId = format_id;

    if (vcodec !== 'none' && acodec !== 'none' && height) {
      // Single-container: has both video and audio
      resolution = width ? `${width}x${height}` : `${height}p`;
      label = `${height}p (${ext.toUpperCase()})`;
    } else if (vcodec !== 'none' && acodec === 'none' && height) {
      // Video-only: use yt-dlp to pick best audio automatically
      resolution = width ? `${width}x${height}` : `${height}p`;
      label = `${height}p (${ext.toUpperCase()})`;
      // Use format selector that merges best audio — yt-dlp handles this natively
      usedFormatId = `${format_id}+bestaudio/best[height<=${height}]`;
    } else if (vcodec === 'none' && acodec !== 'none') {
      resolution = 'audio only';
      label = `Audio only (${ext.toUpperCase()})`;
    } else {
      continue;
    }

    // De-duplicate by label
    if (seen.has(label)) continue;
    seen.add(label);

    result.push({
      format_id: usedFormatId,
      ext,
      resolution,
      filesize: typeof f.filesize === 'number' ? f.filesize : null,
      vcodec,
      acodec,
      tbr: typeof f.tbr === 'number' ? f.tbr : null,
      label,
    });
  }

  // "Best available" fallback
  result.unshift({
    format_id: 'bestvideo+bestaudio/best',
    ext: 'mp4',
    resolution: 'best',
    filesize: null,
    vcodec: 'best',
    acodec: 'best',
    tbr: null,
    label: 'Best available quality',
  });

  return result.slice(0, 12);
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 video-info lookups per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`video-info:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetInMs / 1000)) } }
    );
  }

  try {
    const body = await req.json() as { url?: unknown };
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let safeUrl: string;
    try {
      safeUrl = validatePublicUrl(body.url);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'Invalid URL' },
        { status: 400 }
      );
    }

    // Use execFile with argument array — no shell interpolation, no injection risk
    // tv_embedded gives all quality levels (144p→2160p) for YouTube
    const { stdout, stderr } = await execFileAsync(
      'yt-dlp',
      ['--dump-json', '--no-playlist', '--no-warnings',
       '--extractor-args', 'youtube:player_client=tv_embedded',
       safeUrl],
      { timeout: 30000 }
    );

    if (stderr && !stdout) {
      return NextResponse.json(
        { error: 'Could not fetch video info. Make sure the URL is valid and the video is public.' },
        { status: 422 }
      );
    }

    const raw = JSON.parse(stdout) as Record<string, unknown>;

    const rawFormats = Array.isArray(raw.formats) ? raw.formats as Record<string, unknown>[] : [];
    const formats = buildFormats(rawFormats);

    const info: VideoInfo = {
      title: String(raw.title ?? 'Unknown Title'),
      thumbnail: String(raw.thumbnail ?? (Array.isArray(raw.thumbnails) && raw.thumbnails.length > 0 ? (raw.thumbnails as Record<string, unknown>[])[0]?.url ?? '' : '') ?? ''),
      duration: typeof raw.duration === 'number' ? raw.duration : 0,
      uploader: String(raw.uploader ?? raw.channel ?? raw.creator ?? 'Unknown'),
      platform: String(raw.extractor_key ?? raw.extractor ?? 'Unknown'),
      webpage_url: String(raw.webpage_url ?? safeUrl),
      formats,
    };

    return NextResponse.json(info);
  } catch (err) {
    console.error('[video-info]', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('SyntaxError') || msg.includes('JSON')) {
      return NextResponse.json(
        { error: 'Could not parse video information. The URL may be unsupported.' },
        { status: 422 }
      );
    }
    if (msg.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch video info. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}
