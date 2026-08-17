import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq, sql } from 'drizzle-orm';

// GET /api/stripe/verify-session?session_id=cs_xxx
// Called after Stripe redirects back with ?subscribed=1&session_id=...
// Verifies payment server-side and activates subscription — no webhook needed.
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id') ?? '';
  if (!sessionId.startsWith('cs_')) {
    return NextResponse.json({ error: 'Invalid session id.' }, { status: 400 });
  }

  const authSession = await getSession();
  if (!authSession.userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured.' }, { status: 503 });
  }

  // Retrieve the checkout session from Stripe to verify it's paid
  const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  if (
    checkout.payment_status !== 'paid' ||
    checkout.mode !== 'subscription' ||
    checkout.metadata?.userId !== authSession.userId
  ) {
    return NextResponse.json({ error: 'Payment not verified.' }, { status: 400 });
  }

  const subId = typeof checkout.subscription === 'string'
    ? checkout.subscription
    : checkout.subscription?.id ?? null;

  // Activate subscription in DB
  await db.update(users)
    .set({
      subscriptionStatus: 'active',
      subscriptionId: subId,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, authSession.userId));

  return NextResponse.json({ ok: true, subscriptionId: subId });
}
