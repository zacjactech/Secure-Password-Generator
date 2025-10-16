"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import React from "react";

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ children, delayDuration = 200 }: { children: React.ReactNode; delayDuration?: number }) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>{children}</TooltipPrimitive.Root>
  );
}

export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, children, side = "top" }: { className?: string; children: React.ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TooltipPrimitive.Content side={side} className={cn("z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md border", className)}>
      {children}
    </TooltipPrimitive.Content>
  );
}