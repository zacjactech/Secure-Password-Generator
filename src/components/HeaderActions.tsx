"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { useCrypto } from "@/context/CryptoContext";
import { Button } from "@/components/ui/button";

export default function HeaderActions() {
  const router = useRouter();
  const { clear } = useCrypto();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clear();
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href="/vault">Vault</Link>
      </Button>
      <Button variant="outline" size="sm" onClick={logout} disabled={loading}>
        {loading ? '...' : 'Logout'}
      </Button>
    </div>
  );
}