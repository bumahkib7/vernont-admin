"use client";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAgentActionsStore } from "@/stores/agent-actions";

interface AiConfirmationCardProps {
  onConfirm: (message: string) => void;
}

export function AiConfirmationCard({ onConfirm }: AiConfirmationCardProps) {
  const confirmation = useAgentActionsStore((s) => s.pendingConfirmation);
  const clearConfirmation = useAgentActionsStore((s) => s.clearConfirmation);

  if (!confirmation) return null;

  const handleConfirm = () => {
    clearConfirmation();
    onConfirm("Yes, proceed");
  };

  const handleCancel = () => {
    clearConfirmation();
    onConfirm("No, cancel that");
  };

  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-2.5 agent-message-enter">
      <div className="flex items-start gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 mt-0.5">
          <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            {confirmation.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {confirmation.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-9">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleConfirm}
          className="h-7 text-xs"
        >
          {confirmation.confirmLabel || "Confirm"}
        </Button>
      </div>
    </div>
  );
}
