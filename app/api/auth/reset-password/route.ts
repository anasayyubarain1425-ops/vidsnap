import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schemas/users';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, password } = body as { token?: string; password?: string };

  if (!token || typeof token !== 'string' || token.length < 10) {
    return NextResponse.json({ error: 'Invalid or missing reset token.' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const [resetRow] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        eq(passwordResets.used, false),
        gt(passwordResets.expiresAt, now),
      ),
    )
    .limit(1);

  if (!resetRow) {
    return NextResponse.json({ error: 'Reset link is invalid or has expired.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Update password and mark token used in a parallel pair
  await Promise.all([
    db.update(users).set({ passwordHash, updatedAt: now }).where(eq(users.id, resetRow.userId)),
    db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, resetRow.id)),
  ]);

  return NextResponse.json({ ok: true });
}
