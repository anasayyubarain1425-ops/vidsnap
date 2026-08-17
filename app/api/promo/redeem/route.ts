import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { users, promoCodes, promoRedemptions } from '@/db/schemas/users';
import { getSession } from '@/lib/session';

// POST /api/promo/redeem  { code: string }
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Please sign in before redeeming a code.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { code?: string };
  const rawCode = (body.code ?? '').trim().toUpperCase();
  if (!rawCode) {
    return NextResponse.json({ error: 'Please enter a promo code.' }, { status: 400 });
  }

  const now = new Date();

  // Load promo code
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, rawCode))
    .limit(1);

  if (!promo || !promo.active) {
    return NextResponse.json({ error: 'Invalid or expired promo code.' }, { status: 400 });
  }
  if (promo.expiresAt && promo.expiresAt < now) {
    return NextResponse.json({ error: 'This promo code has expired.' }, { status: 400 });
  }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return NextResponse.json({ error: 'This promo code has reached its usage limit.' }, { status: 400 });
  }

  // Check if this user already redeemed this specific code
  const [existing] = await db
    .select({ id: promoRedemptions.id })
    .from(promoRedemptions)
    .where(
      and(
        eq(promoRedemptions.userId, session.userId),
        eq(promoRedemptions.codeId, promo.id),
      ),
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: 'You have already redeemed this code.' }, { status: 400 });
  }

  // Load current user promo expiry — allow stacking (extend if already on promo)
  const [user] = await db
    .select({ promoExpiresAt: users.promoExpiresAt })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const baseDate =
    user?.promoExpiresAt && user.promoExpiresAt > now ? user.promoExpiresAt : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + promo.durationDays);

  // Apply atomically
  await Promise.all([
    db.update(users).set({
      promoCodeId: promo.id,
      promoExpiresAt: newExpiry,
      updatedAt: now,
    }).where(eq(users.id, session.userId)),

    db.insert(promoRedemptions).values({
      id: randomUUID(),
      userId: session.userId,
      codeId: promo.id,
      redeemedAt: now,
      expiresAt: newExpiry,
    }),

    db.update(promoCodes).set({
      usedCount: promo.usedCount + 1,
    }).where(eq(promoCodes.id, promo.id)),
  ]);

  return NextResponse.json({
    ok: true,
    message: `🎉 Code applied! You have free Pro access for ${promo.durationDays} days.`,
    expiresAt: newExpiry.toISOString(),
    durationDays: promo.durationDays,
  });
}
