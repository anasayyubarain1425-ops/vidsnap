import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { getSession } from '@/lib/session';

// PATCH /api/account — update email or password
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    action?: string;
    currentPassword?: string;
    newPassword?: string;
    newEmail?: string;
  };

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  // ── Change password ──────────────────────────────────────────────────────
  if (body.action === 'change_password') {
    if (!body.currentPassword || !body.newPassword) {
      return NextResponse.json({ error: 'currentPassword and newPassword are required.' }, { status: 400 });
    }
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
    return NextResponse.json({ ok: true });
  }

  // ── Change email ─────────────────────────────────────────────────────────
  if (body.action === 'change_email') {
    const newEmail = (body.newEmail ?? '').trim().toLowerCase();
    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }
    if (!body.currentPassword) {
      return NextResponse.json({ error: 'Current password is required to change email.' }, { status: 400 });
    }
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

    // Check if the new email is already taken
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    }

    await db.update(users).set({ email: newEmail, updatedAt: new Date() }).where(eq(users.id, user.id));
    // Update session email
    session.email = newEmail;
    await session.save();
    return NextResponse.json({ ok: true, email: newEmail });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

// DELETE /api/account — permanently delete the account
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { currentPassword?: string };
  if (!body.currentPassword) {
    return NextResponse.json({ error: 'Password is required to delete your account.' }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 });

  // Cascade deletes download_history and password_resets via FK
  await db.delete(users).where(and(eq(users.id, user.id)));
  session.destroy();
  return NextResponse.json({ ok: true });
}
