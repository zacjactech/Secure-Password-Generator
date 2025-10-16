import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const ciphertext = String(body?.ciphertext || '');
  const iv = String(body?.iv || '');
  const title = body?.title ? String(body.title) : undefined;
  const tags: string[] | undefined = Array.isArray(body?.tags) ? body.tags : undefined;
  if (!ciphertext || !iv) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase
    .from('vault_items')
    .update({
      ciphertext,
      iv,
      title: title ?? null,
      tags: tags ?? null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('userId', session.userId);
  if (error) return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = getSupabase();
  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', id)
    .eq('userId', session.userId);
  if (error) return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  return NextResponse.json({ ok: true });
}