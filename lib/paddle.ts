import { Paddle, Environment } from '@paddle/paddle-node-sdk';

let _paddle: Paddle | null = null;

export function getPaddle(): Paddle | null {
  const key = process.env.PADDLE_API_KEY;
  if (!key) return null;
  if (!_paddle) {
    _paddle = new Paddle(key, {
      environment: process.env.PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox,
    });
  }
  return _paddle;
}

export const PADDLE_PRICE_ID = process.env.PADDLE_PRICE_ID ?? '';
export const MONTHLY_PRICE_DISPLAY = '$10/month';
