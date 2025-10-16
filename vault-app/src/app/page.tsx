"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, ArrowRight, KeyRound, CheckCircle2, Menu, X } from "lucide-react";
import DarkModeToggle from "@/components/DarkModeToggle";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Secure Password Vault</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              <DarkModeToggle />
              <Button variant="outline" asChild><Link href="/login">Login</Link></Button>
              <Button asChild><Link href="/signup">Sign Up</Link></Button>
            </div>
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center rounded-md border border-border bg-background p-2 text-sm"
              aria-label="Open menu"
              aria-controls="landing-mobile-menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>
      <nav
        id="landing-mobile-menu"
        className={`${open ? 'block' : 'hidden'} sm:hidden border-b`}
        aria-label="Mobile navigation"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3">
          <DarkModeToggle />
          <Button variant="outline" asChild><Link href="/login">Login</Link></Button>
          <Button asChild><Link href="/signup">Sign Up</Link></Button>
        </div>
      </nav>
      <main className="flex-1">
        <section className="py-16 bg-gradient-to-b from-primary/5 to-transparent transition-colors">
          <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-5">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Own your security with client-side encryption</h1>
              <p className="text-lg text-muted-foreground">Store and manage passwords in an encrypted vault. Your data is encrypted before it leaves your browser.</p>
              <div className="flex gap-3">
                <Button size="lg" asChild>
                  <a href="/signup">
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                No tracking. No ads. Your vault, your rules.
              </div>
            </div>
            <Card className="transition-colors">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Client-side encryption</div>
                    <p className="text-sm text-muted-foreground">AES-GCM with a key derived from your master password.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Optional 2FA</div>
                    <p className="text-sm text-muted-foreground">Protect logins with time-based one-time codes.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Your data, your control</div>
                    <p className="text-sm text-muted-foreground">Import/export encrypted JSON for backups and migrations.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Secure Password Vault
        </div>
      </footer>
    </div>
  );
}
