import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { users } from '@/db/schemas/users';
import { eq } from 'drizzle-orm';
import { FREE_DOWNLOAD_LIMIT } from '@/lib/session';
import { hasActivePromo, hasUnlimitedAccess } from '@/lib/promo';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ user: null });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      downloadCount: users.downloadCount,
      subscriptionStatus: users.subscriptionStatus,
      promoExpiresAt: users.promoExpiresAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    session.destroy();
    return NextResponse.json({ user: null });
  }

  const unlimited = hasUnlimitedAccess(user);
  const onPromo = hasActivePromo(user);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      downloadCount: user.downloadCount,
      subscriptionStatus: user.subscriptionStatus,
      promoExpiresAt: user.promoExpiresAt ?? null,
      onPromo,
      canDownload: unlimited || user.downloadCount < FREE_DOWNLOAD_LIMIT,
      downloadsLeft: unlimited ? null : Math.max(0, FREE_DOWNLOAD_LIMIT - user.downloadCount),
    },
  });
}
