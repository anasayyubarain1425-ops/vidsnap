import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db } from '@/db';
import { promoCodes } from '@/db/schemas/users';
import { getSession } from '@/lib/session';

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? '';

function isAdmin(req: NextRequest): boolean {
  // Check both header and query param for flexibility (curl-friendly)
  const header = req.headers.get('x-admin-secret') ?? '';
  const query = req.nextUrl.searchParams.get('secret') ?? '';
  return ADMIN_SECRET.length > 0 && (header === ADMIN_SECRET || query === ADMIN_SECRET);
}

// Also allow session-based admin check via ADMIN_EMAIL env var
async function isAdminSession(): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  if (!adminEmail) return false;
  const session = await getSession();
  return session.email?.toLowerCase() === adminEmail.toLowerCase();
}

async function checkAdmin(req: NextRequest): Promise<boolean> {
  return isAdmin(req) || (await isAdminSession());
}

// GET /api/admin/codes — list all codes
export async function GET(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }
  const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  return NextResponse.json({ codes });
}

// POST /api/admin/codes — create a new code
export async function POST(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    code?: string;
    description?: string;
    durationDays?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
  };

  let code = (body.code ?? '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!code) {
    // Auto-generate a readable code
    code = randomUUID().split('-')[0].toUpperCase();
  }
  const durationDays = Math.max(1, Math.min(3650, Number(body.durationDays ?? 30)));
  const maxUses = body.maxUses != null ? Math.max(1, Number(body.maxUses)) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  // Check uniqueness
  const [existing] = await db.select({ id: promoCodes.id }).from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
  if (existing) {
    return NextResponse.json({ error: `Code "${code}" already exists.` }, { status: 409 });
  }

  const [row] = await db.insert(promoCodes).values({
    id: randomUUID(),
    code,
    description: (body.description ?? '').slice(0, 200),
    durationDays,
    maxUses,
    usedCount: 0,
    expiresAt,
    active: true,
  }).returning();

  return NextResponse.json({ ok: true, code: row });
}

// PATCH /api/admin/codes — toggle active / update a code
export async function PATCH(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as {
    id?: string;
    active?: boolean;
    description?: string;
    maxUses?: number | null;
    expiresAt?: string | null;
  };

  if (!body.id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

  const updates: Partial<typeof promoCodes.$inferInsert> = {};
  if (body.active !== undefined) updates.active = body.active;
  if (body.description !== undefined) updates.description = body.description.slice(0, 200);
  if ('maxUses' in body) updates.maxUses = body.maxUses != null ? Math.max(1, Number(body.maxUses)) : null;
  if ('expiresAt' in body) updates.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  await db.update(promoCodes).set(updates).where(eq(promoCodes.id, body.id));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/codes?id=<id>
export async function DELETE(req: NextRequest) {
  if (!(await checkAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
  return NextResponse.json({ ok: true });
}
