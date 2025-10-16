"use client";
import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

type CryptoContextValue = {
  encryptionSalt: string | null;
  key: CryptoKey | null;
  setSaltAndKey: (salt: string, key: CryptoKey) => void;
  clear: () => void;
  needsReauth: boolean;
};

const CryptoContext = createContext<CryptoContextValue | undefined>(undefined);

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [encryptionSalt, setSalt] = useState<string | null>(null);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Load salt from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSalt = sessionStorage.getItem('encryptionSalt');
      if (storedSalt && !encryptionSalt) {
        setSalt(storedSalt);
        setNeedsReauth(true); // User needs to re-enter password to derive key
      }
    }
  }, [encryptionSalt]);

  const value = useMemo(
    () => ({
      encryptionSalt,
      key,
      needsReauth,
      setSaltAndKey: (salt: string, k: CryptoKey) => {
        setSalt(salt);
        setKey(k);
        setNeedsReauth(false);
        // Store salt in sessionStorage for persistence across page refreshes
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('encryptionSalt', salt);
        }
      },
      clear: () => {
        setSalt(null);
        setKey(null);
        setNeedsReauth(false);
        // Clear salt from sessionStorage
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('encryptionSalt');
        }
      },
    }),
    [encryptionSalt, key, needsReauth]
  );
  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCrypto() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCrypto must be used within CryptoProvider');
  return ctx;
}