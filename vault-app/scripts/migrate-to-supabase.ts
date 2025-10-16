/*
  One-off migration script: MongoDB -> Supabase
  Usage:
    - Set env: MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    - Run: pnpm tsx vault-app/scripts/migrate-to-supabase.ts
    - Optional dry run: set DRY_RUN=1 to print what would be migrated without writing
*/
import { MongoClient } from 'mongodb';
import { getSupabase } from '../src/lib/supabase';

type MongoUser = {
  _id: any;
  email: string;
  passwordHash: string;
  encryptionSalt: string;
  twoFAEnabled?: boolean;
  totpSecret?: string;
  createdAt?: Date;
};

type MongoItem = {
  _id: any;
  userId: string;
  ciphertext: string;
  iv: string;
  title?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  const dryRun = Boolean(process.env.DRY_RUN);

  const mongo = new MongoClient(uri);
  await mongo.connect();
  const db = mongo.db('vault_app');
  const usersCol = db.collection<MongoUser>('users');
  const itemsCol = db.collection<MongoItem>('vault_items');

  const supabase = getSupabase();

  console.log('Fetching MongoDB users...');
  const users = await usersCol.find({}).toArray();
  console.log(`Found ${users.length} users.`);

  // Map old user _id (string) -> new UUID
  const idMap = new Map<string, string>();

  for (const u of users) {
    const oldId = String(u._id);
    const newId = crypto.randomUUID();
    idMap.set(oldId, newId);
    if (dryRun) {
      console.log(`[DRY] User ${u.email}: ${oldId} -> ${newId}`);
      continue;
    }
    const { error } = await supabase
      .from('users')
      .insert({
        id: newId,
        email: u.email,
        passwordHash: u.passwordHash,
        encryptionSalt: u.encryptionSalt,
        twoFAEnabled: Boolean(u.twoFAEnabled),
        totpSecret: u.totpSecret ?? null,
        createdAt: (u.createdAt || new Date()).toISOString(),
      });
    if (error) throw new Error(`Failed to insert user ${u.email}: ${error.message}`);
  }

  console.log('Fetching MongoDB vault items...');
  const items = await itemsCol.find({}).toArray();
  console.log(`Found ${items.length} items.`);

  for (const it of items) {
    const oldUserId = String(it.userId);
    const newUserId = idMap.get(oldUserId);
    if (!newUserId) throw new Error(`Missing userId mapping for item ${String(it._id)} (${oldUserId})`);
    const newItemId = crypto.randomUUID();
    if (dryRun) {
      console.log(`[DRY] Item ${String(it._id)} -> ${newItemId} (user ${oldUserId} -> ${newUserId})`);
      continue;
    }
    const { error } = await supabase
      .from('vault_items')
      .insert({
        id: newItemId,
        userId: newUserId,
        ciphertext: it.ciphertext,
        iv: it.iv,
        title: it.title ?? null,
        tags: it.tags ?? null,
        createdAt: (it.createdAt || new Date()).toISOString(),
        updatedAt: (it.updatedAt || new Date()).toISOString(),
      });
    if (error) throw new Error(`Failed to insert item ${String(it._id)}: ${error.message}`);
  }

  console.log('Migration completed successfully.');
  await mongo.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});