import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schemas/users';

// No email service — we return the reset link directly for the client to display
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }

  // Always respond with success to avoid user enumeration
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    // Leak no info about whether the account exists
    return NextResponse.json({ ok: true });
  }

  // Invalidate any existing unused tokens for this user
  await db
    .update(passwordResets)
    .set({ used: true })
    .where(eq(passwordResets.userId, user.id));

  // Generate a cryptographically random 32-byte token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const resetId = randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResets).values({
    id: resetId,
    userId: user.id,
    tokenHash,
    expiresAt,
    used: false,
  });

  // Return token to client — user copies the link (no email service)
  return NextResponse.json({ ok: true, token: rawToken });
}
