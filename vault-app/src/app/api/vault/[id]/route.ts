import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const ciphertext = String(body?.ciphertext || '');
  const iv = String(body?.iv || '');
  const title = body?.title ? String(body.title) : undefined;
  const tags: string[] | undefined = Array.isArray(body?.tags) ? body.tags : undefined;
  if (!ciphertext || !iv) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const db = await getDb();
  const { vaultItems } = getCollections(db);
  await vaultItems.updateOne(
    { _id: new ObjectId(id), userId: session.userId },
    { $set: { ciphertext, iv, title, tags, updatedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const { vaultItems } = getCollections(db);
  await vaultItems.deleteOne({ _id: new ObjectId(id), userId: session.userId });
  return NextResponse.json({ ok: true });
}