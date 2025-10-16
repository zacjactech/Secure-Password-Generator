import { NextResponse } from 'next/server';
import { getSupabase, UserRow } from '@/lib/supabase';
import { verifyPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { authenticator } from 'otplib';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const totp = body?.totp ? String(body.totp) : undefined;
    
    console.log(`Login attempt for email: ${email}`);
    
    if (!email || !password) {
      console.log('Login failed: Missing credentials');
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    const supabase = getSupabase();
    console.log('Attempting to query users table...');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle<UserRow>();
    if (error) {
      console.log('Database error:', error);
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      console.log(`Login attempt failed: Invalid password for email: ${email}`);
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

    const token = createSessionToken({ userId: String(user.id), email });
    const res = NextResponse.json({ ok: true, encryptionSalt: user.encryptionSalt });
    setSessionCookie(res, token);
    return res;
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}