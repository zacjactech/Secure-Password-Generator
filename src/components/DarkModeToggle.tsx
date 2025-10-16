"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export default function DarkModeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored ? stored === "dark" : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = (checked: boolean) => {
    setDark(checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
    document.documentElement.classList.toggle("dark", checked);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Dark mode</span>
      <Switch checked={dark} onCheckedChange={toggle} aria-label="Toggle dark mode" />
    </div>
  );
}