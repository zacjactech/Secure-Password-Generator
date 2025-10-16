-- Supabase schema for Secure Password Vault
-- Run in Supabase SQL editor or via CLI

-- Enable pgcrypto for UUID generation if needed
-- create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  "passwordHash" text not null,
  "encryptionSalt" text not null,
  "twoFAEnabled" boolean not null default false,
  "totpSecret" text null,
  "createdAt" timestamptz not null default now()
);

create table if not exists vault_items (
  id uuid primary key default gen_random_uuid(),
  "userId" uuid not null references users(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  title text null,
  tags text[] null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_vault_items_user_updated on vault_items ("userId", "updatedAt" desc);

-- Optional: Row Level Security policies (if using Supabase Auth)
-- alter table users enable row level security;
-- alter table vault_items enable row level security;
-- -- Example policies would reference auth.uid, which we are not using currently.