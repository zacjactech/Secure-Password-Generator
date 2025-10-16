import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const { vaultItems } = getCollections(db);
  const items = await vaultItems
    .find({ userId: session.userId })
    .sort({ updatedAt: -1 })
    .toArray();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const ciphertext = String(body?.ciphertext || '');
  const iv = String(body?.iv || '');
  const title = body?.title ? String(body.title) : undefined;
  const tags: string[] | undefined = Array.isArray(body?.tags) ? body.tags : undefined;
  if (!ciphertext || !iv) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const now = new Date();
  const db = await getDb();
  const { vaultItems } = getCollections(db);
  const doc = {
    userId: session.userId,
    ciphertext,
    iv,
    title,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  const result = await vaultItems.insertOne(doc);
  return NextResponse.json({ ok: true, id: String(result.insertedId) });
}