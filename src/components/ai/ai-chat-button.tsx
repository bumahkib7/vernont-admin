"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";

export function AiChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setOpen(true)}
        title="AI Assistant"
      >
        <Sparkles className="h-5 w-5" />
      </Button>
      <AiChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
