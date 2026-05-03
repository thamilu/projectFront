"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorFallbackProps {
  error: Error;
  reset: () => void;
  className?: string;
}

export default function ErrorFallback({ error, reset, className }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className={cn("min-h-[40vh] flex items-center justify-center p-4", className)}>
      <Card className="w-full max-w-2xl p-6">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred. You can retry or contact support if the issue persists.</p>

        <div className="flex gap-2 mb-4">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="ghost" onClick={() => (window.location.href = '/')}>Go home</Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <div><strong>Message:</strong> {error?.message}</div>
          {isDev && error?.stack && (
            <pre className="mt-3 overflow-auto text-xs bg-muted/5 p-3 rounded">{error.stack}</pre>
          )}
        </div>
      </Card>
    </div>
  );
}
