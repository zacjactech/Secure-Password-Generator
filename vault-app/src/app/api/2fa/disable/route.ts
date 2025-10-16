import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { error } = await supabase
    .from('users')
    .update({ twoFAEnabled: false, totpSecret: null })
    .eq('id', session.userId);
  if (error) return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  return NextResponse.json({ ok: true });
}