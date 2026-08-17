import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
      timeout: 20000,
    });
  }
  return _stripe;
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? '';
export const MONTHLY_PRICE_CENTS = 1000; // $10
