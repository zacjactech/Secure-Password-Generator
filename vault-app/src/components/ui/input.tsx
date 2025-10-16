import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm outline-none placeholder:text-muted-foreground",
          "focus:ring-1 focus:ring-ring",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";