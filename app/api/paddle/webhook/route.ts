import { NextRequest, NextResponse } from 'next/server';
import { getPaddle } from '@/lib/paddle';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq, sql } from 'drizzle-orm';
import { EventName } from '@paddle/paddle-node-sdk';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const paddle = getPaddle();
  if (!paddle) {
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }

  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not set.' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('paddle-signature') ?? '';

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.eventType) {

      // Subscription activated (first payment succeeded)
      case EventName.SubscriptionActivated: {
        const sub = event.data as { id: string; customData?: { userId?: string } };
        const userId = sub.customData?.userId;
        if (userId) {
          await db.update(users)
            .set({ subscriptionStatus: 'active', subscriptionId: sub.id, updatedAt: sql`now()` })
            .where(eq(users.id, userId));
        }
        break;
      }

      // Subscription updated (e.g. renewal, plan change)
      case EventName.SubscriptionUpdated: {
        const sub = event.data as { id: string; status: string };
        const status = sub.status === 'active' ? 'active' : 'canceled';
        await db.update(users)
          .set({ subscriptionStatus: status, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, sub.id));
        break;
      }

      // Subscription canceled
      case EventName.SubscriptionCanceled: {
        const sub = event.data as { id: string };
        await db.update(users)
          .set({ subscriptionStatus: 'canceled', subscriptionId: null, updatedAt: sql`now()` })
          .where(eq(users.subscriptionId, sub.id));
        break;
      }

      // Transaction completed (payment confirmed) — belt-and-suspenders activation
      case EventName.TransactionCompleted: {
        const tx = event.data as {
          subscriptionId?: string;
          customData?: { userId?: string };
        };
        const userId = tx.customData?.userId;
        if (userId && tx.subscriptionId) {
          await db.update(users)
            .set({ subscriptionStatus: 'active', subscriptionId: tx.subscriptionId, updatedAt: sql`now()` })
            .where(eq(users.id, userId));
        }
        break;
      }
    }
  } catch (err) {
    console.error('[paddle-webhook]', event.eventType, err);
    return NextResponse.json({ error: 'Handler error.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
