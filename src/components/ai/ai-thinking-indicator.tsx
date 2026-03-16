"use client";

import { cn } from "@/lib/utils";

const THINKING_PHRASES = [
  "Analyzing your request",
  "Thinking through this",
  "Processing",
  "Working on it",
];

export function AgentThinkingIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 px-3.5 py-2.5",
        className
      )}
    >
      <div className="flex items-center gap-1">
        <div className="agent-thinking-dot agent-thinking-dot-1" />
        <div className="agent-thinking-dot agent-thinking-dot-2" />
        <div className="agent-thinking-dot agent-thinking-dot-3" />
      </div>
      <span className="text-xs text-muted-foreground agent-shimmer-text">
        Reasoning...
      </span>
    </div>
  );
}
