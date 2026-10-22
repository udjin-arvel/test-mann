import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <label htmlFor={inputId} className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-xl border border-input bg-card px-4 text-base text-foreground transition-colors placeholder:text-muted-foreground/70",
            "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/15",
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Field.displayName = "Field";
