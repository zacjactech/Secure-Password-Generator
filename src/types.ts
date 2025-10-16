export type UserDoc = {
  _id: string;
  email: string;
  passwordHash: string;
  encryptionSalt: string; // base64
  twoFAEnabled?: boolean;
  totpSecret?: string; // base32
  createdAt: Date;
};

export type VaultItemEncrypted = {
  _id?: string;
  userId: string;
  ciphertext: string;
  iv: string;
  title?: string; // optional plaintext title
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
};

export type VaultItemPlain = {
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
};