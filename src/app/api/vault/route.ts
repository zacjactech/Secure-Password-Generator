import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, VaultItemRow } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { PostgrestError } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { data: items, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('userId', session.userId)
    .order('updatedAt', { ascending: false }) as { data: VaultItemRow[]; error: PostgrestError | null };
  if (error) {
    console.error('Supabase error fetching vault items:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
  // Map database id to _id to match frontend expectations
  const mappedItems = (items || []).map(item => ({
    ...item,
    _id: item.id,
    id: undefined // Remove the original id field to avoid confusion
  }));
  
  return NextResponse.json({ items: mappedItems });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const ciphertext = String(body?.ciphertext || '');
  const iv = String(body?.iv || '');
  const title = body?.title ? String(body.title) : undefined;
  const tags: string[] | undefined = Array.isArray(body?.tags) ? body.tags : undefined;
  if (!ciphertext || !iv) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const supabase = getSupabase();
  const now = new Date();
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from('vault_items')
    .insert({
      id,
      userId: session.userId,
      ciphertext,
      iv,
      title: title ?? null,
      tags: tags ?? null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  if (error) return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}