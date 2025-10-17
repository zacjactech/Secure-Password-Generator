"use client";
import { useState } from "react";
import { deriveKey } from "@/lib/crypto";
import { useCrypto } from "@/context/CryptoContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ReauthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReauthModal({ isOpen, onClose }: ReauthModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { encryptionSalt, setSaltAndKey } = useCrypto();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptionSalt) {
      setError("No encryption salt available. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const key = await deriveKey(password, encryptionSalt);
      setSaltAndKey(encryptionSalt, key);
      setPassword("");
      onClose();
    } catch {
      setError("Failed to derive encryption key. Please check your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Only allow closing if user has successfully authenticated
        // or if they haven't entered anything yet
        if (!loading) {
          onClose();
        }
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Re-authentication Required</DialogTitle>
          <DialogDescription>
            Your encryption key has been cleared from memory. Please enter your master password to continue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="reauth-password">Master Password</Label>
            <Input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Enter your master password"
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Unlocking..." : "Unlock Vault"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}