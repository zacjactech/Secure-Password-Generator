import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const { vaultItems } = getCollections(db);
  const items = await vaultItems.find({ userId: session.userId }).toArray();
  return NextResponse.json({ export: { items } });
}