import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'session';

export async function hashPassword(password: string) {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(payload: { userId: string; email: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

export function setSessionCookie(res: NextResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, maxAge: 0, path: '/' });
}

export function getSession(req: NextRequest): { userId: string; email: string } | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}