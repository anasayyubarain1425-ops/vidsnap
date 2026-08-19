import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq, sql } from 'drizzle-orm';

// POST /api/lemonsqueezy/webhook
// Handles Lemon Squeezy subscription events.
export async function POST(req: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-signature') ?? '';

  // Verify HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const digest = hmac.digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let payload: {
    meta: { event_name: string; custom_data?: { user_id?: string } };
    data: {
      id: string;
      attributes: {
        status: string;
        user_email?: string;
        first_subscription_item?: { subscription_id: number };
        subscription_id?: number;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const eventName = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;
  const subscriptionId = String(
    payload.data.attributes.first_subscription_item?.subscription_id ??
    payload.data.attributes.subscription_id ??
    payload.data.id
  );

  try {
    switch (eventName) {
      // Subscription created / activated
      case 'subscription_created':
      case 'order_created': {
        if (userId) {
          await db.update(users)
            .set({ subscriptionStatus: 'active', subscriptionId, updatedAt: sql`now()` })
            .where(eq(users.id, userId));
        } else if (payload.data.attributes.user_email) {
          await db.update(users)
            .set({ subscriptionStatus: 'active', subscriptionId, updatedAt: sql`now()` })
            .where(eq(users.email, payload.data.attributes.user_email));
        }
        break;
      }

      // Subscription updated / renewed
      case 'subscription_updated': {
        const status = payload.data.attributes.status === 'active' ? 'active' : 'canceled';
        await db.update(users)
          .set({ subscriptionStatus: status, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, subscriptionId));
        break;
      }

      // Subscription cancelled
      case 'subscription_cancelled':
      case 'subscription_expired': {
        await db.update(users)
          .set({ subscriptionStatus: 'canceled', subscriptionId: null, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, subscriptionId));
        break;
      }

      // Payment failed
      case 'subscription_payment_failed': {
        await db.update(users)
          .set({ subscriptionStatus: 'past_due', updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, subscriptionId));
        break;
      }
    }
  } catch (err) {
    console.error('[ls-webhook]', eventName, err);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
