import { pgTable, text, timestamp, integer, boolean, bigint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  status: text('status').notNull().default('active'),
  downloadCount: integer('download_count').notNull().default(0),
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionStatus: text('subscription_status').notNull().default('free'),
  subscriptionId: text('subscription_id'),
  // Promo access
  promoCodeId: text('promo_code_id'),          // which code granted access
  promoExpiresAt: timestamp('promo_expires_at'), // null = not on promo
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const passwordResets = pgTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const downloadHistory = pgTable('download_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  title: text('title').notNull().default(''),
  thumbnail: text('thumbnail'),
  platform: text('platform').notNull().default(''),
  formatLabel: text('format_label').notNull().default(''),
  formatId: text('format_id').notNull().default(''),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }),
  durationSeconds: integer('duration_seconds'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export const rateLimitLog = pgTable('rate_limit_log', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  endpoint: text('endpoint').notNull(),
  windowStart: timestamp('window_start').notNull(),
  count: integer('count').notNull().default(1),
});

/**
 * promo_codes — admin-created access codes.
 *
 * durationDays: how many days of free Pro access the code grants each user
 * maxUses: null = unlimited redemptions; otherwise capped
 * usedCount: incremented on each redemption
 * expiresAt: code itself stops working after this date (null = never)
 * active: admin can disable without deleting
 */
export const promoCodes = pgTable('promo_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),          // e.g. "FRIEND2024"
  description: text('description').notNull().default(''),
  durationDays: integer('duration_days').notNull().default(30),
  maxUses: integer('max_uses'),                   // null = unlimited
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at'),             // null = never expires
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

/**
 * promo_redemptions — one row per (user, code) pair; prevents re-use.
 */
export const promoRedemptions = pgTable('promo_redemptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeId: text('code_id').notNull().references(() => promoCodes.id, { onDelete: 'cascade' }),
  redeemedAt: timestamp('redeemed_at').notNull().default(sql`now()`),
  expiresAt: timestamp('expires_at').notNull(),   // copy of grant expiry at redemption time
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DownloadHistoryRow = typeof downloadHistory.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;


