"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (selectedCount > 0) {
      // Small delay so the CSS transition triggers
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    } else {
      setVisible(false);
    }
  }, [selectedCount]);

  if (selectedCount === 0 && !visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-in-out",
        visible && selectedCount > 0
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
        className
      )}
      onTransitionEnd={() => {
        if (selectedCount === 0) setVisible(false);
      }}
    >
      <div className="flex items-center gap-3 rounded-lg border bg-zinc-900 px-4 py-2.5 shadow-lg dark:bg-zinc-800">
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
        </span>

        <div className="h-4 w-px bg-zinc-600" />

        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant ?? "default"}
              className={cn(
                "gap-1.5 text-xs",
                action.variant === "outline" &&
                  "border-zinc-600 text-white hover:bg-zinc-700 hover:text-white",
                action.variant === "destructive" &&
                  "bg-red-600 hover:bg-red-700",
                !action.variant || action.variant === "default"
                  ? "bg-white text-zinc-900 hover:bg-zinc-100"
                  : ""
              )}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>

        <button
          onClick={onClearSelection}
          className="ml-1 rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
