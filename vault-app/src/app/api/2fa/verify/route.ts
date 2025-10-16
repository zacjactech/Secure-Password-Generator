import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const token = String(body?.token || '');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const db = await getDb();
  const { users } = getCollections(db);
  const user = await users.findOne({ _id: new ObjectId(session.userId) });
  const secret = user?.totpSecret;
  if (!secret) return NextResponse.json({ error: '2FA not setup' }, { status: 400 });

  const valid = authenticator.verify({ token, secret });
  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 401 });

  await users.updateOne({ _id: new ObjectId(session.userId) }, { $set: { twoFAEnabled: true } });
  return NextResponse.json({ ok: true });
}