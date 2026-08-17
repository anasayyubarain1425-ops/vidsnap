import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.metadata?.userId) {
          await db.update(users)
            .set({
              subscriptionStatus: 'active',
              subscriptionId: session.subscription as string,
              updatedAt: sql`now()`,
            })
            .where(eq(users.id, session.metadata.userId));
        }
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === 'active' ? 'active' : 'canceled';
        await db.update(users)
          .set({ subscriptionStatus: status, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, sub.id));
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await db.update(users)
          .set({ subscriptionStatus: 'canceled', subscriptionId: null, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, sub.id));
        break;
      }
    }
  } catch (err) {
    console.error('[webhook]', event.type, err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
