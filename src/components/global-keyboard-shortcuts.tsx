"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useHotkeys, type HotkeyBinding } from "@/hooks/use-hotkeys";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Renders the global keyboard shortcuts handler and the floating "?" button.
 * Place this inside the authenticated app shell.
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  const showHelp = useCallback(() => setHelpOpen(true), []);

  const bindings: HotkeyBinding[] = [
    // Help
    {
      keys: "?",
      handler: showHelp,
      description: "Show keyboard shortcuts",
      group: "General",
    },

    // Navigation chords
    {
      keys: "g d",
      handler: () => router.push("/"),
      description: "Go to Dashboard",
      group: "Navigation",
    },
    {
      keys: "g o",
      handler: () => router.push("/orders"),
      description: "Go to Orders",
      group: "Navigation",
    },
    {
      keys: "g p",
      handler: () => router.push("/products"),
      description: "Go to Products",
      group: "Navigation",
    },
    {
      keys: "g c",
      handler: () => router.push("/customers"),
      description: "Go to Customers",
      group: "Navigation",
    },
    {
      keys: "g i",
      handler: () => router.push("/inventory"),
      description: "Go to Inventory",
      group: "Navigation",
    },
    {
      keys: "g s",
      handler: () => router.push("/settings"),
      description: "Go to Settings",
      group: "Navigation",
    },
  ];

  useHotkeys(bindings);

  return (
    <>
      {/* Floating help button — positioned above the AI chat FAB */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={showHelp}
            className="fixed bottom-20 right-6 z-50 flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground hover:text-foreground"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          <p>Keyboard shortcuts <kbd className="ml-1 rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">?</kbd></p>
        </TooltipContent>
      </Tooltip>

      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
