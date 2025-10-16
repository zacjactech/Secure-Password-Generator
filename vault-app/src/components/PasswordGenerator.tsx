"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LOOK_ALIKES = /[O0Il]/g;

function randomChars(length: number, charset: string) {
  const result: string[] = [];
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result.push(charset[bytes[i] % charset.length]);
  }
  return result.join("");
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeLookalikes, setExcludeLookalikes] = useState(true);
  const [password, setPassword] = useState("");

  const charset = useMemo(() => {
    let chars = "";
    if (includeLower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (includeUpper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) chars += "0123456789";
    if (includeSymbols) chars += "!@#$%^&*()-_=+[]{};:,.<>/?";
    if (!chars) chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    if (excludeLookalikes) chars = chars.replace(LOOK_ALIKES, "");
    return chars;
  }, [includeLower, includeUpper, includeNumbers, includeSymbols, excludeLookalikes]);

  const generate = () => {
    setPassword(randomChars(length, charset));
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, charset]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText("");
        } catch {}
      }, 12000);
    } catch {}
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Generator</CardTitle>
          <Button variant="outline" size="sm" onClick={generate}>Regenerate</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input className="flex-1" value={password} readOnly />
          <Button onClick={copy} variant="secondary">Copy</Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between text-sm">
            <span>Length: {length}</span>
            <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeLower} onChange={(e) => setIncludeLower(e.target.checked)} /> Lowercase</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeUpper} onChange={(e) => setIncludeUpper(e.target.checked)} /> Uppercase</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} /> Numbers</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} /> Symbols</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={excludeLookalikes} onChange={(e) => setExcludeLookalikes(e.target.checked)} /> Exclude look-alikes</label>
        </div>
      </CardContent>
    </Card>
  );
}