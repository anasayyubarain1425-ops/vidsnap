import {
  lemonSqueezySetup,
  createCheckout,
} from '@lemonsqueezy/lemonsqueezy.js';

export function setupLS() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) return false;
  lemonSqueezySetup({ apiKey });
  return true;
}

export const LS_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID ?? '';
export const LS_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID ?? '';

export { createCheckout };
