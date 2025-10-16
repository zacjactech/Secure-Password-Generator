import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!client) {
    client = new MongoClient(uri);
  }
  if (!db) {
    await client.connect();
    db = client.db('vault_app');
  }
  return db;
}

export function getCollections(d: Db) {
  const users = d.collection('users');
  const vaultItems = d.collection('vault_items');
  return { users, vaultItems };
}