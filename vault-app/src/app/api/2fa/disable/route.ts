import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const { users } = getCollections(db);
  await users.updateOne(
    { _id: new ObjectId(session.userId) },
    { $set: { twoFAEnabled: false }, $unset: { totpSecret: '' } }
  );
  return NextResponse.json({ ok: true });
}