import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabase();
  const secret = authenticator.generateSecret();
  const label = `${session.email}`;
  const issuer = 'Secure Password Vault';
  const otpauth = authenticator.keyuri(label, issuer, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  const { error } = await supabase
    .from('users')
    .update({ totpSecret: secret, twoFAEnabled: false })
    .eq('id', session.userId);
  if (error) return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  return NextResponse.json({ secret, otpauth, qr: qrDataUrl });
}