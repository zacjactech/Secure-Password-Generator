import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = await getDb();
  const { users } = getCollections(db);
  const user = await users.findOne({ _id: new ObjectId(session.userId) });
  const enabled = Boolean(user?.twoFAEnabled && user?.totpSecret);
  return NextResponse.json({ enabled });
}