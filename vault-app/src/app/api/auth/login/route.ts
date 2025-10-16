import { NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { authenticator } from 'otplib';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const totp = body?.totp ? String(body.totp) : undefined;
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const db = await getDb();
    const { users } = getCollections(db);
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // If 2FA enabled, require and verify TOTP code
    if (user.twoFAEnabled && user.totpSecret) {
      if (!totp) {
        return NextResponse.json({ error: 'TOTP required', requireTotp: true }, { status: 401 });
      }
      const ok = authenticator.verify({ token: totp, secret: user.totpSecret });
      if (!ok) {
        return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 401 });
      }
    }

    const token = createSessionToken({ userId: String(user._id), email });
    const res = NextResponse.json({ ok: true, encryptionSalt: user.encryptionSalt });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}