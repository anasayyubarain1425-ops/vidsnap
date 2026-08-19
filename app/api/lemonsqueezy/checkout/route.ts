import { NextResponse } from 'next/server';
import { setupLS, createCheckout, LS_STORE_ID, LS_VARIANT_ID } from '@/lib/lemonsqueezy';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq } from 'drizzle-orm';

// POST /api/lemonsqueezy/checkout
// Creates a Lemon Squeezy checkout URL and redirects user to it.
export async function POST() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  }

  const configured = setupLS();
  if (!configured || !LS_STORE_ID || !LS_VARIANT_ID) {
    return NextResponse.json({ error: 'Payment service not configured yet.' }, { status: 503 });
  }

  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users).where(eq(users.id, session.userId)).limit(1);

  if (!user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'https://videograbtool.com';

  const { data, error } = await createCheckout(LS_STORE_ID, LS_VARIANT_ID, {
    checkoutOptions: {
      embed: false,
      media: true,
      logo: true,
    },
    checkoutData: {
      email: user.email,
      custom: { user_id: user.id },
    },
    productOptions: {
      enabledVariants: [parseInt(LS_VARIANT_ID)],
      redirectUrl: `${origin}/?subscribed=1`,
      receiptButtonText: 'Go to VideoGrabTool',
      receiptThankYouNote: 'Thank you! Your subscription is now active.',
    },
  });

  if (error || !data?.data?.attributes?.url) {
    console.error('[ls-checkout]', error);
    return NextResponse.json({ error: 'Failed to create checkout.' }, { status: 500 });
  }

  return NextResponse.json({ url: data.data.attributes.url });
}
