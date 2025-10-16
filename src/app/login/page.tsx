"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deriveKey } from "@/lib/crypto";
import { useCrypto } from "@/context/CryptoContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setSaltAndKey } = useCrypto();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totp: needsTotp ? (totp || undefined) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.requireTotp) {
          setNeedsTotp(true);
          setError("Two-factor required. Enter the 6-digit code from your authenticator app.");
        } else {
          setError(data.error || "Login failed");
        }
        return;
      }
      const key = await deriveKey(password, data.encryptionSalt);
      setSaltAndKey(data.encryptionSalt, key);
      router.push("/vault");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-md w-full">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your vault.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">Master password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {needsTotp && (
              <div className="grid gap-1">
                <Label htmlFor="totp">TOTP code</Label>
                <Input id="totp" type="text" inputMode="numeric" pattern="\\d{6}" placeholder="123456" value={totp} onChange={(e) => setTotp(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Open your authenticator app and enter the current 6-digit code.</p>
              </div>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href="/signup">Need an account? Sign up</Link>
          </Button>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}