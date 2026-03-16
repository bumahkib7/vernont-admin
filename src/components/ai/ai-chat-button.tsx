"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { cn } from "@/lib/utils";

export function AiChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="AI Agent"
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center",
          "rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
          "bg-gradient-to-br from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500",
          "text-white hover:scale-105 active:scale-95",
          "agent-fab-glow"
        )}
      >
        <Sparkles className="h-5 w-5" />
      </button>
      <AiChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
