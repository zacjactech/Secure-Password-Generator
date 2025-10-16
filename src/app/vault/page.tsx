"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import PasswordGenerator from "@/components/PasswordGenerator";
import SearchBar from "@/components/SearchBar";
import VaultItemForm from "@/components/VaultItemForm";
import ReauthModal from "@/components/ReauthModal";
import { useCrypto } from "@/context/CryptoContext";
import { CryptoUtils } from "@/lib/crypto";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy as CopyIcon, Check as CheckIcon, Trash2, Settings as SettingsIcon, Upload, Download, Shield, Eye, EyeOff, ExternalLink, Files } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type EncryptedItem = {
  _id: string;
  ciphertext: string;
  iv: string;
  title?: string;
  tags?: string[];
};

type PlainItem = {
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
};

export default function VaultPage() {
  const { key, needsReauth } = useCrypto();
  const [items, setItems] = useState<EncryptedItem[]>([]);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [encryptTitles, setEncryptTitles] = useState<boolean>(false);
  const [decodedTitles, setDecodedTitles] = useState<Record<string, string | undefined>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState<boolean | null>(null);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewPasswordId, setViewPasswordId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [confirmDisable2FA, setConfirmDisable2FA] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vault');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setItems(data.items);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Load preference for encrypting titles from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vault.encryptTitles");
      if (raw) setEncryptTitles(raw === "true");
    } catch {}
  }, []);

  // Persist preference
  useEffect(() => {
    try { localStorage.setItem("vault.encryptTitles", String(encryptTitles)); } catch {}
  }, [encryptTitles]);

  // Decrypt titles when preference is enabled
  useEffect(() => {
    (async () => {
      if (!encryptTitles || !key || items.length === 0) {
        setDecodedTitles({});
        return;
      }
      try {
        const entries = await Promise.all(items.map(async (it) => {
          try {
            const plain = await CryptoUtils.decryptItem(it.ciphertext, it.iv, key);
            const titleValue = (plain as Record<string, unknown>).title;
            const title = typeof titleValue === 'string' ? titleValue : undefined;
            return [it._id, title] as const;
          } catch {
            return [it._id, undefined] as const;
          }
        }));
        setDecodedTitles(Object.fromEntries(entries));
      } catch {
        setDecodedTitles({});
      }
    })();
  }, [encryptTitles, key, items]);

  // Load 2FA status when settings dialog opens
  useEffect(() => {
    (async () => {
      if (!settingsOpen) return;
      setTwoFAError(null);
      try {
        const res = await fetch('/api/2fa/status');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load 2FA status');
        setTwoFAEnabled(Boolean(data.enabled));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setTwoFAError(message);
      setTwoFAEnabled(null);
    }
    })();
  }, [settingsOpen]);

  const start2FASetup = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    setQr(null);
    setTotpCode("");
    try {
      const res = await fetch('/api/2fa/setup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start setup');
      setQr(String(data.qr));
      setTwoFAEnabled(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const verify2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const res = await fetch('/api/2fa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: totpCode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify');
      setTwoFAEnabled(true);
      setQr(null);
      setTotpCode("");
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const disable2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const res = await fetch('/api/2fa/disable', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable');
      setTwoFAEnabled(false);
      setQr(null);
      setTotpCode("");
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setTwoFAError(message);
    } finally {
      setTwoFALoading(false);
    }
  };

  const open2FASettings = () => {
    setSettingsOpen(true);
  };

  // Remove unused placeholder decrypted memo

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((it) => {
      const t = encryptTitles ? (decodedTitles[it._id] || '') : (it.title || '');
      return t.toLowerCase().includes(q);
    });
  }, [items, query, encryptTitles, decodedTitles]);

  const addItem = async (plain: PlainItem) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    const { ciphertext, iv } = await CryptoUtils.encryptItem(plain, key);
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext, iv, title: encryptTitles ? undefined : plain.title, tags: plain.tags }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Failed to save');
    setAddOpen(false);
    await load();
  };

  const editItem = async (id: string, plain: PlainItem) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    const { ciphertext, iv } = await CryptoUtils.encryptItem(plain, key);
    const res = await fetch(`/api/vault/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciphertext, iv, title: encryptTitles ? undefined : plain.title, tags: plain.tags }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Failed to update');
    await load();
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Failed to delete');
    await load();
  };

  const copyFieldToClipboard = async (ciphertext: string, iv: string, field: string, itemId: string) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    try {
      const plain = await CryptoUtils.decryptItem(ciphertext, iv, key);
      const fieldValue = (plain as Record<string, unknown>)[field];
      const value = typeof fieldValue === 'string' ? fieldValue : '';
      
      if (!value) {
        alert(`No ${field} found for this item`);
        return;
      }
      
      await navigator.clipboard.writeText(value);
      setCopiedId(itemId);
      setCopiedField(field);
      setTimeout(() => {
        setCopiedId(null);
        setCopiedField(null);
      }, 1500);
      
      // Auto-clear clipboard after 12 seconds for sensitive data
      if (field === 'password') {
        setTimeout(async () => { 
          try { 
            await navigator.clipboard.writeText(''); 
          } catch {} 
        }, 12000);
      }
    } catch {
      alert('Failed to decrypt');
    }
  };

  const togglePasswordVisibility = async (ciphertext: string, iv: string, itemId: string) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    
    if (revealedPasswords[itemId]) {
      // Hide password
      setRevealedPasswords(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    } else {
      // Reveal password
      try {
        const plain = await CryptoUtils.decryptItem(ciphertext, iv, key);
        const pwdValue = (plain as Record<string, unknown>).password;
        const pwd = typeof pwdValue === 'string' ? pwdValue : '';
        
        if (!pwd) {
          alert('No password found for this item');
          return;
        }
        
        setRevealedPasswords(prev => ({ ...prev, [itemId]: pwd }));
        
        // Auto-hide password after 30 seconds
        setTimeout(() => {
          setRevealedPasswords(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
          });
        }, 30000);
      } catch {
        alert('Failed to decrypt');
      }
    }
  };

  const duplicateItem = async (ciphertext: string, iv: string, title?: string, tags?: string[]) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    try {
      const plain = await CryptoUtils.decryptItem(ciphertext, iv, key);
      const duplicatedItem = {
        ...plain,
        title: title ? `${title} (Copy)` : 'Untitled (Copy)'
      };
      
      const { ciphertext: newCiphertext, iv: newIv } = await CryptoUtils.encryptItem(duplicatedItem, key);
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ciphertext: newCiphertext, 
          iv: newIv, 
          title: encryptTitles ? undefined : duplicatedItem.title, 
          tags 
        }),
      });
      const data = await res.json();
      if (!res.ok) return alert(data.error || 'Failed to duplicate');
      await load();
    } catch {
      alert('Failed to decrypt original item');
    }
  };

  const openUrl = async (ciphertext: string, iv: string) => {
    if (!key) return alert('No encryption key in memory. Please login again.');
    try {
      const plain = await CryptoUtils.decryptItem(ciphertext, iv, key);
      const urlValue = (plain as Record<string, unknown>).url;
      const url = typeof urlValue === 'string' ? urlValue : '';
      
      if (!url) {
        alert('No URL found for this item');
        return;
      }
      
      // Add protocol if missing
      const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Failed to decrypt');
    }
  };

  return (
    <div className="space-y-4">
      <PasswordGenerator />
      <div className="flex items-center justify-between gap-3">
        <SearchBar onChange={setQuery} />
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Switch id="encrypt-titles" checked={encryptTitles} onCheckedChange={setEncryptTitles} />
            <Label htmlFor="encrypt-titles" className="text-sm">Encrypt titles</Label>
          </div>
          <Button variant="outline" onClick={open2FASettings}>
            <Shield className="h-4 w-4 mr-1" />
            2FA
          </Button>
          <Dialog open={importExportOpen} onOpenChange={setImportExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Import / Export
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import / Export</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">Export your vault</div>
                  <p className="text-sm text-muted-foreground">Exports an encrypted JSON of your items. Keep it safe.</p>
                  <Button variant="outline" onClick={async () => {
                    const res = await fetch('/api/export', { method: 'POST' });
                    const data = await res.json();
                    const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'vault-export.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}>
                    <Download className="h-4 w-4 mr-1" />
                    Export JSON
                  </Button>
                </div>
                <div>
                  <div className="font-medium">Import from file</div>
                  <p className="text-sm text-muted-foreground">Select a vault export file to import. Existing items remain.</p>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" />
                      Choose file
                      <input 
                        id="vault-import-file" 
                        name="vault-import-file" 
                        type="file" 
                        accept="application/json" 
                        className="hidden" 
                        onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        try {
                          const json = JSON.parse(text);
                          const items: EncryptedItem[] = json.items || [];
                          for (const it of items) {
                            await fetch('/api/vault', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ciphertext: it.ciphertext, iv: it.iv, title: it.title, tags: it.tags })
                            });
                          }
                          await load();
                          setImportExportOpen(false);
                        } catch {
                          alert('Invalid import file');
                        }
                      }} />
                    </label>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <SettingsIcon className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch id="encrypt-titles-2" checked={encryptTitles} onCheckedChange={setEncryptTitles} />
                  <Label htmlFor="encrypt-titles-2" className="text-sm">Encrypt titles</Label>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication (TOTP)</div>
                      <div className="text-sm text-muted-foreground">Protect login with a 6-digit code from an authenticator app.</div>
                      <ul className="text-sm text-muted-foreground list-disc ml-4 mt-1">
                        <li>Use Google Authenticator, Authy, or 1Password.</li>
                        <li>Scan the QR and enter the current code to enable.</li>
                        <li>Keep recovery options handy in case you lose access.</li>
                      </ul>
                    </div>
                    {twoFAEnabled ? (
                      <Badge variant="outline">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  {twoFAError && <p className="text-destructive text-sm">{twoFAError}</p>}
                  {twoFAEnabled ? (
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="destructive" onClick={() => setConfirmDisable2FA(true)} disabled={twoFALoading}>Disable 2FA</Button>
                          </TooltipTrigger>
                          <TooltipContent>Turn off 2FA for this account</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Dialog open={confirmDisable2FA} onOpenChange={setConfirmDisable2FA}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground">You will no longer be asked for a 6-digit code when logging in.</p>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setConfirmDisable2FA(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={async () => { await disable2FA(); setConfirmDisable2FA(false); }}>Disable</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!qr ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button onClick={start2FASetup} disabled={twoFALoading}>Enable 2FA</Button>
                            </TooltipTrigger>
                            <TooltipContent>Generate a QR to link your authenticator</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm">Scan this QR in your authenticator app, then enter the 6-digit code.</div>
                          {qr && (
                            <Image
                              src={qr}
                              alt="TOTP QR"
                              width={160}
                              height={160}
                              className="border rounded"
                            />
                          )}
                          <div className="text-xs text-muted-foreground">If scanning fails, use the secret shown on screen to add manually.</div>
                          <div className="grid gap-1">
                            <Label htmlFor="totp-verify">TOTP code</Label>
                            <Input id="totp-verify" type="text" inputMode="numeric" pattern="\\d{6}" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="123456" />
                          </div>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button onClick={verify2FA} disabled={twoFALoading || !totpCode}>Verify & Enable</Button>
                                </TooltipTrigger>
                                <TooltipContent>Confirm setup using your current code</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button variant="outline" onClick={() => { setQr(null); setTotpCode(""); }}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={async () => {
            const res = await fetch('/api/export', { method: 'POST' });
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vault-export.json';
            a.click();
            URL.revokeObjectURL(url);
          }}>Export</Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              Import
              <input 
                id="vault-export-import-file" 
                name="vault-export-import-file" 
                type="file" 
                accept="application/json" 
                className="hidden" 
                onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const json = JSON.parse(text);
                const items: EncryptedItem[] = json.items || [];
                for (const it of items) {
                  await fetch('/api/vault', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ciphertext: it.ciphertext, iv: it.iv, title: it.title, tags: it.tags })
                  });
                }
                await load();
              } catch {
                alert('Invalid import file');
              }
            }} />
            </label>
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Vault Item</DialogTitle>
              </DialogHeader>
              <VaultItemForm onSubmit={addItem} onCancel={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error && <p className="text-red-600">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((it) => (
            <li key={it._id}>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold">{it.title || 'Untitled'}</div>
                      {/* If titles are encrypted, show decrypted title if available */}
                      {encryptTitles && (
                        <div className="text-sm text-muted-foreground">
                          {decodedTitles[it._id] || (it.title ? `(unencrypted: ${it.title})` : 'Untitled')}
                        </div>
                      )}
                      {it.tags && it.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {it.tags.map((tag) => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {revealedPasswords[it._id] && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                          <div className="text-xs text-muted-foreground mb-1">Password:</div>
                          <div className="break-all">{revealedPasswords[it._id]}</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" aria-label="Actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Item actions</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem title="Copy password to clipboard" onSelect={async () => {
                            await copyFieldToClipboard(it.ciphertext, it.iv, 'password', it._id);
                          }}>
                            {copiedId === it._id && copiedField === 'password' ? <CheckIcon className="h-4 w-4 mr-2 text-green-600" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                            {copiedId === it._id && copiedField === 'password' ? 'Copied!' : 'Copy Password'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem title="Copy username to clipboard" onSelect={async () => {
                            await copyFieldToClipboard(it.ciphertext, it.iv, 'username', it._id);
                          }}>
                            {copiedId === it._id && copiedField === 'username' ? <CheckIcon className="h-4 w-4 mr-2 text-green-600" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                            {copiedId === it._id && copiedField === 'username' ? 'Copied!' : 'Copy Username'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem title="Copy URL to clipboard" onSelect={async () => {
                            await copyFieldToClipboard(it.ciphertext, it.iv, 'url', it._id);
                          }}>
                            {copiedId === it._id && copiedField === 'url' ? <CheckIcon className="h-4 w-4 mr-2 text-green-600" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                            {copiedId === it._id && copiedField === 'url' ? 'Copied!' : 'Copy URL'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem title="Copy notes to clipboard" onSelect={async () => {
                            await copyFieldToClipboard(it.ciphertext, it.iv, 'notes', it._id);
                          }}>
                            {copiedId === it._id && copiedField === 'notes' ? <CheckIcon className="h-4 w-4 mr-2 text-green-600" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                            {copiedId === it._id && copiedField === 'notes' ? 'Copied!' : 'Copy Notes'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem title="Show/hide password" onSelect={async () => {
                            await togglePasswordVisibility(it.ciphertext, it.iv, it._id);
                          }}>
                            {revealedPasswords[it._id] ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                            {revealedPasswords[it._id] ? 'Hide Password' : 'View Password'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem title="Open URL in new tab" onSelect={async () => {
                            await openUrl(it.ciphertext, it.iv);
                          }}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open URL
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem title="Create a copy of this item" onSelect={async () => {
                            await duplicateItem(it.ciphertext, it.iv, it.title, it.tags);
                          }}>
                            <Files className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onSelect={() => setEditId(it._id)}>
                            Edit
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem title="Delete this item" onSelect={() => setConfirmDeleteId(it._id)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Dialog open={editId === it._id} onOpenChange={(open) => setEditId(open ? it._id : null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Vault Item</DialogTitle>
                      </DialogHeader>
                      <InlineEdit id={it._id} ciphertext={it.ciphertext} iv={it.iv} title={it.title} tags={it.tags} onSave={editItem} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={confirmDeleteId === it._id} onOpenChange={(open) => setConfirmDeleteId(open ? it._id : null)}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete this item?</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground">This action cannot be undone. The item will be permanently removed.</p>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={async () => { if (confirmDeleteId) { await deleteItem(confirmDeleteId); setConfirmDeleteId(null);} }}>Delete</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
      
      {/* Re-authentication modal when encryption key is lost */}
      <ReauthModal isOpen={needsReauth} onClose={() => {}} />
    </div>
  );
}

function InlineEdit({ id, ciphertext, iv, title, tags, onSave }: { id: string; ciphertext: string; iv: string; title?: string; tags?: string[]; onSave: (id: string, plain: PlainItem) => void }) {
  const { key } = useCrypto();
  const [initial, setInitial] = useState<PlainItem | undefined>(undefined);
  useEffect(() => {
    (async () => {
      if (!key) return;
      try {
        const plain = await CryptoUtils.decryptItem(ciphertext, iv, key);
        setInitial({ title, tags, ...plain } as PlainItem);
      } catch {
        setInitial({ title, tags });
      }
    })();
  }, [ciphertext, iv, key, title, tags]);
  if (!initial) return <p>Decrypting...</p>;
  return <VaultItemForm initial={initial} onSubmit={(p) => onSave(id, p)} />;
}