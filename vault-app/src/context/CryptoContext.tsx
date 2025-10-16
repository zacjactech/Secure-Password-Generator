"use client";
import React, { createContext, useContext, useMemo, useState } from 'react';

type CryptoContextValue = {
  encryptionSalt: string | null;
  key: CryptoKey | null;
  setSaltAndKey: (salt: string, key: CryptoKey) => void;
  clear: () => void;
};

const CryptoContext = createContext<CryptoContextValue | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [encryptionSalt, setSalt] = useState<string | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const value = useMemo(
    () => ({
      encryptionSalt,
      key,
      setSaltAndKey: (salt: string, k: CryptoKey) => {
        setSalt(salt);
        setKey(k);
      },
      clear: () => {
        setSalt(null);
        setKey(null);
      },
    }),
    [encryptionSalt, key]
  );
  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCrypto must be used within CryptoProvider');
  return ctx;
}