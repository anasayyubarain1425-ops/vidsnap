/**
 * Checks whether a user currently has active promo access.
 * Returns true if promoExpiresAt is set and in the future.
 */
export function hasActivePromo(user: {
  promoExpiresAt: Date | null | undefined;
  subscriptionStatus: string;
}): boolean {
  if (user.subscriptionStatus === 'active') return false; // paid sub takes precedence
  if (!user.promoExpiresAt) return false;
  return new Date(user.promoExpiresAt) > new Date();
}

/**
 * Returns true if the user can download unlimited videos (paid OR active promo).
 */
export function hasUnlimitedAccess(user: {
  subscriptionStatus: string;
  promoExpiresAt: Date | null | undefined;
}): boolean {
  return user.subscriptionStatus === 'active' || hasActivePromo(user);
}
