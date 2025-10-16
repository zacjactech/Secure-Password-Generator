Secure Password Vault is a privacy-first web app to generate strong passwords and store them securely in a personal encrypted vault.

## Crypto Summary

Client-side encryption uses the Web Crypto API.
- Key derivation: PBKDF2 with SHA-256, 200,000 iterations. Salt stored per user.
- Encryption: AES-GCM with 256-bit key and 96-bit IV.
- The master key never leaves the browser memory; the server only stores ciphertext and IV.

If the user forgets their master password, vault data is unrecoverable by design.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Environment

Create a `.env.local` file:

```
MONGODB_URI=
JWT_SECRET=
BCRYPT_ROUNDS=12
```

### Quickstart

1. `pnpm install`
2. Set `.env.local` values (MongoDB Atlas URI, a random `JWT_SECRET`).
3. `pnpm dev`
4. Visit `/signup` then `/vault` to create, search, copy, edit, and delete items.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

- Password generator with adjustable length and character options; copy with auto-clear (~12s).
- Email/password authentication with bcrypt hashing; session via HttpOnly cookie.
- Client-side encryption for all vault data (AES-GCM); server stores only encrypted blobs.
- Vault items: title, username, password, URL, notes, tags.
- Basic search/filter on plaintext title; optional import/export of encrypted JSON.
- Minimal Tailwind UI with dark mode toggle.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
