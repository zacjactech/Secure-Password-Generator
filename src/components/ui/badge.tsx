import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

const variants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border bg-background",
  destructive: "bg-destructive text-destructive-foreground",
};

export const Badge = ({ className, variant = "secondary", ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[calc(var(--radius)/1.75)] px-2 py-0.5 text-xs",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};