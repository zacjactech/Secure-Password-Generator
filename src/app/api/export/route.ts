import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, VaultItemRow } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { PostgrestError } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { data: items, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('userId', session.userId) as { data: VaultItemRow[]; error: PostgrestError | null };
  if (error) return NextResponse.json({ error: 'Failed to export items' }, { status: 500 });
  return NextResponse.json({ export: { items: items || [] } });
}