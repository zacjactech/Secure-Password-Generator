import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, UserRow } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { data: user, error } = await supabase
    .from('users')
    .select('twoFAEnabled, totpSecret')
    .eq('id', session.userId)
    .maybeSingle<UserRow>();
  if (error) return NextResponse.json({ error: 'Failed to check 2FA status' }, { status: 500 });
  const enabled = Boolean(user?.twoFAEnabled && user?.totpSecret);
  return NextResponse.json({ enabled });
}