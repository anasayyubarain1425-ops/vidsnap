import { NextResponse } from 'next/server';
import { getPaddle, PADDLE_PRICE_ID } from '@/lib/paddle';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq } from 'drizzle-orm';

// POST /api/paddle/checkout
// Returns a Paddle transaction ID which Paddle.js uses to open the overlay checkout.
export async function POST() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const paddle = getPaddle();
  if (!paddle) {
    return NextResponse.json({ error: 'Payment service not configured yet.' }, { status: 503 });
  }
  if (!PADDLE_PRICE_ID) {
    return NextResponse.json({ error: 'Subscription price not configured yet.' }, { status: 503 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users).where(eq(users.id, session.userId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:13000';

  // Create a Paddle transaction — returns a transaction ID for client-side checkout
  const transaction = await paddle.transactions.create({
    items: [{ priceId: PADDLE_PRICE_ID, quantity: 1 }],
    customData: { userId: user.id },
    checkout: {
      url: `${origin}/?subscribed=1`,
    },
  });

  return NextResponse.json({ transactionId: transaction.id });
}
