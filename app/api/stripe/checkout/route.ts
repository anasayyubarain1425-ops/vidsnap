import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getStripe, STRIPE_PRICE_ID } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq } from 'drizzle-orm';

export async function POST() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payment service not configured yet. Please add STRIPE_SECRET_KEY.' }, { status: 503 });
  }

  if (!STRIPE_PRICE_ID) {
    return NextResponse.json({ error: 'Subscription price not configured yet. Please add STRIPE_PRICE_ID.' }, { status: 503 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, stripeCustomerId: users.stripeCustomerId })
    .from(users).where(eq(users.id, session.userId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
  }

  // Reuse or create Stripe customer
  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId: user.id } });
    customerId = customer.id;
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:13000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${origin}/?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?canceled=1`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
