"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type FormProps = {
  initial?: {
    title?: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    tags?: string[];
  };
  onSubmit: (val: {
    title?: string;
    username?: string;
    password?: string;
    url?: string;
    notes?: string;
    tags?: string[];
  }) => Promise<void> | void;
  onCancel?: () => void;
};

export default function VaultItemForm({ initial, onSubmit, onCancel }: FormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState(initial?.password || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [tags, setTags] = useState((initial?.tags || []).join(", "));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    await onSubmit({ title: title || undefined, username: username || undefined, password: password || undefined, url: url || undefined, notes: notes || undefined, tags: t.length ? t : undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-1">
        <Label htmlFor="vault-title">Title</Label>
        <Input id="vault-title" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="vault-username">Username</Label>
        <Input id="vault-username" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="vault-password">Password</Label>
        <Input id="vault-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="vault-url">URL</Label>
        <Input id="vault-url" placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="vault-notes">Notes</Label>
        <Textarea id="vault-notes" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="vault-tags">Tags</Label>
        <Input id="vault-tags" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}