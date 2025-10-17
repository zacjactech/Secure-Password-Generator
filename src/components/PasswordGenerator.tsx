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
  const [copied, setCopied] = useState(false);

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
      if (!password) {
        alert('No password generated to copy');
        return;
      }
      
      console.log('Attempting to copy password:', password);
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(password);
          console.log('Password copied to clipboard using modern API');
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
          
          // Auto-clear clipboard after 12 seconds
          setTimeout(async () => {
            try {
              if (navigator.clipboard && document.hasFocus()) {
                await navigator.clipboard.writeText("");
              } else {
                console.log('Document not focused, skipping clipboard clear');
              }
            } catch (clearError) {
              console.warn('Failed to clear clipboard:', clearError);
            }
          }, 12000);
          
          return; // Success, exit function
        } catch (clipboardError) {
          console.warn('Modern clipboard API failed, trying fallback:', clipboardError);
        }
      }
      
      // Fallback method using document.execCommand
      console.log('Trying fallback clipboard method');
      try {
        const textArea = document.createElement('textarea');
        textArea.value = password;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('Fallback clipboard copy successful');
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
          
          // Auto-clear clipboard after 12 seconds (only if modern API available)
          if (navigator.clipboard) {
            setTimeout(async () => {
              try {
                if (navigator.clipboard && document.hasFocus()) {
                  await navigator.clipboard.writeText("");
                } else {
                  console.log('Document not focused, skipping clipboard clear');
                }
              } catch (clearError) {
                console.warn('Failed to clear clipboard:', clearError);
              }
            }, 12000);
          }
        } else {
          console.error('Fallback clipboard copy failed');
          alert('Failed to copy to clipboard. Please check your browser permissions or try a different browser.');
        }
      } catch (fallbackError) {
        console.error('Fallback clipboard method failed:', fallbackError);
        alert('Clipboard functionality is not available. Please check your browser permissions or try a different browser.');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      alert(`Failed to copy password: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your browser permissions.`);
    }
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
          <Button onClick={copy} variant="secondary">
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between text-sm">
            <span>Length: {length}</span>
            <input 
              id="password-length" 
              name="password-length" 
              type="range" 
              min={8} 
              max={64} 
              value={length} 
              onChange={(e) => setLength(Number(e.target.value))} 
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              id="include-lowercase" 
              name="include-lowercase" 
              type="checkbox" 
              checked={includeLower} 
              onChange={(e) => setIncludeLower(e.target.checked)} 
            /> 
            Lowercase
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              id="include-uppercase" 
              name="include-uppercase" 
              type="checkbox" 
              checked={includeUpper} 
              onChange={(e) => setIncludeUpper(e.target.checked)} 
            /> 
            Uppercase
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              id="include-numbers" 
              name="include-numbers" 
              type="checkbox" 
              checked={includeNumbers} 
              onChange={(e) => setIncludeNumbers(e.target.checked)} 
            /> 
            Numbers
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              id="include-symbols" 
              name="include-symbols" 
              type="checkbox" 
              checked={includeSymbols} 
              onChange={(e) => setIncludeSymbols(e.target.checked)} 
            /> 
            Symbols
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input 
              id="exclude-lookalikes" 
              name="exclude-lookalikes" 
              type="checkbox" 
              checked={excludeLookalikes} 
              onChange={(e) => setExcludeLookalikes(e.target.checked)} 
            /> 
            Exclude look-alikes
          </label>
        </div>
      </CardContent>
    </Card>
  );
}