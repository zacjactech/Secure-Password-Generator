import { NextRequest, NextResponse } from 'next/server';
import { getDb, getCollections } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const { users } = getCollections(db);
  const secret = authenticator.generateSecret();
  const label = `${session.email}`;
  const issuer = 'Secure Password Vault';
  const otpauth = authenticator.keyuri(label, issuer, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);

  await users.updateOne({ _id: new ObjectId(session.userId) }, { $set: { totpSecret: secret, twoFAEnabled: false } });
  return NextResponse.json({ secret, otpauth, qr: qrDataUrl });
}