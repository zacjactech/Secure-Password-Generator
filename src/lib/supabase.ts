import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url) {
    throw new Error('Supabase environment not configured: set SUPABASE_URL');
  }
  if (!key) {
    throw new Error('Supabase environment not configured: set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
  }
  client = createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: 'public' },
  });
  return client;
}

export type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  encryptionSalt: string;
  twoFAEnabled?: boolean;
  totpSecret?: string | null;
  createdAt?: string | null;
};

export type VaultItemRow = {
  id: string;
  userId: string;
  ciphertext: string;
  iv: string;
  title?: string | null;
  tags?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};