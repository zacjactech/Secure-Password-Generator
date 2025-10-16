import { NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!isValidEmail(email) || password.length < 8) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const db = await getDb();
    const { users } = getCollections(db);

    const existing = await users.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const encryptionSaltBytes = crypto.getRandomValues(new Uint8Array(16));
    const encryptionSalt = Buffer.from(encryptionSaltBytes).toString('base64');

    const now = new Date();
    const result = await users.insertOne({
      email,
      passwordHash,
      encryptionSalt,
      createdAt: now,
    });

    const userId = String(result.insertedId);
    const token = createSessionToken({ userId, email });
    const res = NextResponse.json({ ok: true, encryptionSalt });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}