import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function validateUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('Invalid URL: only http/https URLs are supported');
  }
  new URL(trimmed);
  return trimmed;
}

function validateFormatId(formatId: string): string {
  // Block only shell-dangerous characters
  if (/[;&$`\r\n\0]/.test(formatId)) {
    throw new Error('Invalid format ID');
  }
  if (!formatId || formatId.length > 500) {
    throw new Error('Invalid format ID');
  }
  return formatId;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { url?: unknown; format_id?: unknown };

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let safeUrl: string;
    try {
      safeUrl = validateUrl(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const rawFormatId = typeof body.format_id === 'string' ? body.format_id : 'bestvideo+bestaudio/best';
    let safeFormatId: string;
    try {
      safeFormatId = validateFormatId(rawFormatId);
    } catch {
      return NextResponse.json({ error: 'Invalid format ID' }, { status: 400 });
    }

    // Use execFile with argument arrays — no shell interpolation, no injection risk
    const { stdout, stderr } = await execFileAsync(
      'yt-dlp',
      ['--get-url', '--no-playlist', '--no-warnings',
       '--extractor-args', 'youtube:player_client=android',
       '-f', safeFormatId, safeUrl],
      { timeout: 30000 }
    );

    if (stderr && !stdout) {
      return NextResponse.json(
        { error: 'Could not get download URL. Format may not be available.' },
        { status: 422 }
      );
    }

    const urls = stdout.trim().split('\n').filter(Boolean);
    const downloadUrl = urls[0];

    if (!downloadUrl || !downloadUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Could not obtain a download URL for this format.' },
        { status: 422 }
      );
    }

    // Also get filename
    const { stdout: nameOut } = await execFileAsync(
      'yt-dlp',
      ['--get-filename', '--no-playlist', '--no-warnings',
       '--extractor-args', 'youtube:player_client=android',
       '-f', safeFormatId, safeUrl],
      { timeout: 15000 }
    );
    const filename = nameOut.trim().split('\n')[0] || 'video.mp4';

    return NextResponse.json({ download_url: downloadUrl, filename });
  } catch (err) {
    console.error('[download]', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('timeout')) {
      return NextResponse.json({ error: 'Request timed out.' }, { status: 504 });
    }
    return NextResponse.json(
      { error: 'Failed to get download link. Please try again.' },
      { status: 500 }
    );
  }
}
