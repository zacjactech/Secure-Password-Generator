import { NextResponse } from 'next/server';
import { getSupabase, UserRow } from '@/lib/supabase';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { randomUUID, randomBytes } from 'crypto';

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
    let supabase;
    try {
      supabase = getSupabase();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Supabase not configured';
      return NextResponse.json({ error: message }, { status: 500 });
    }
    const { data: existing, error: existingErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle<UserRow>();
    if (existingErr) {
      console.error('Signup check error:', existingErr);
      if (existingErr.code === 'PGRST205') {
          return NextResponse.json({ error: "Supabase schema missing: apply 'supabase/schema.sql'" }, { status: 500 });
      }
     
      if (existingErr.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
      }
    }
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const encryptionSalt = randomBytes(16).toString('base64');

    const now = new Date();
    const userId = randomUUID();
    const { data: inserted, error } = await supabase
      .from('users')
      .insert({ id: userId, email, passwordHash, encryptionSalt, createdAt: now.toISOString() })
      .select('id, encryptionSalt')
      .single();
    if (error || !inserted) {
      if (error) console.error('Signup insert error:', error);
      return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
    }
    const token = createSessionToken({ userId, email });
    const res = NextResponse.json({ ok: true, encryptionSalt });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    console.error('Signup unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Signup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}