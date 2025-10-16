"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import DarkModeToggle from "@/components/DarkModeToggle";
import HeaderActions from "@/components/HeaderActions";
import { Menu, X, Shield } from "lucide-react";

export default function AppHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/") {
    return null;
  }

  return (
    <>
      <header className="border-b transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <Link href="/" className="font-semibold">Secure Password Vault</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <HeaderActions />
              <DarkModeToggle />
            </div>
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-sm"
              aria-label="Open menu"
              aria-controls="app-mobile-menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <nav
        id="app-mobile-menu"
        className={`${open ? 'block' : 'hidden'} sm:hidden border-b`}
        aria-label="Mobile navigation"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3">
          <HeaderActions />
          <DarkModeToggle />
        </div>
      </nav>
    </>
  );
}