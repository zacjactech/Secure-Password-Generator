import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, UserRow } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { authenticator } from 'otplib';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const token = String(body?.token || '');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('totpSecret')
    .eq('id', session.userId)
    .maybeSingle<UserRow>();
  if (error) return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 });
  const secret = user?.totpSecret || undefined;
  if (!secret) return NextResponse.json({ error: '2FA not setup' }, { status: 400 });

  const valid = authenticator.verify({ token, secret });
  if (!valid) return NextResponse.json({ error: 'Invalid code' }, { status: 401 });

  const { error: updateErr } = await supabase
    .from('users')
    .update({ twoFAEnabled: true })
    .eq('id', session.userId);
  if (updateErr) return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  return NextResponse.json({ ok: true });
}