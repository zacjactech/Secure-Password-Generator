"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SearchBar({ onChange }: { onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => onChange(query), 200);
    return () => clearTimeout(id);
  }, [query, onChange]);

  return (
    <div className="space-y-1">
      <Label htmlFor="vault-search">Search</Label>
      <Input
        id="vault-search"
        placeholder="Search by title, username, tag..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}