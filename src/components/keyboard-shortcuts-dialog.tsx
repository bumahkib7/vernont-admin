"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatKeysForDisplay } from "@/hooks/use-hotkeys";

// ============================================================================
// Types
// ============================================================================

type ShortcutEntry = {
  keys: string;
  description: string;
};

type ShortcutSection = {
  title: string;
  shortcuts: ShortcutEntry[];
};

// ============================================================================
// Static shortcut definitions
// ============================================================================

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      { keys: "meta+k", description: "Open command palette" },
      { keys: "?", description: "Show keyboard shortcuts" },
      { keys: "escape", description: "Close dialog / cancel" },
      { keys: "meta+j", description: "Open AI agent" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: "g d", description: "Go to Dashboard" },
      { keys: "g o", description: "Go to Orders" },
      { keys: "g p", description: "Go to Products" },
      { keys: "g c", description: "Go to Customers" },
      { keys: "g i", description: "Go to Inventory" },
      { keys: "g s", description: "Go to Settings" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: "n", description: "New item (context-aware)" },
      { keys: "f", description: "Toggle filters" },
      { keys: "e", description: "Edit (on detail pages)" },
      { keys: "meta+enter", description: "Save changes" },
    ],
  },
  {
    title: "List Navigation",
    shortcuts: [
      { keys: "j", description: "Move down in list" },
      { keys: "k", description: "Move up in list" },
      { keys: "enter", description: "Open selected item" },
    ],
  },
];

// ============================================================================
// Kbd component
// ============================================================================

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium shadow-sm">
      {children}
    </kbd>
  );
}

// ============================================================================
// ShortcutRow component
// ============================================================================

function ShortcutRow({ entry }: { entry: ShortcutEntry }) {
  const keyParts = formatKeysForDisplay(entry.keys);

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{entry.description}</span>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        {keyParts.map((combo, comboIndex) => (
          <span key={comboIndex} className="inline-flex items-center gap-0.5">
            {comboIndex > 0 && (
              <span className="text-xs text-muted-foreground mx-1">then</span>
            )}
            {combo.map((key, keyIndex) => (
              <span key={keyIndex} className="inline-flex items-center">
                {keyIndex > 0 && combo.length > 1 && (
                  <span className="text-[10px] text-muted-foreground mx-0.5">+</span>
                )}
                <Kbd>{key}</Kbd>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Dialog component
// ============================================================================

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Navigate and take actions faster with keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-6 pb-6 space-y-5">
            {SHORTCUT_SECTIONS.map((section, sectionIndex) => (
              <div key={section.title}>
                {sectionIndex > 0 && <Separator className="mb-4" />}
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h4>
                <div className="space-y-0.5">
                  {section.shortcuts.map((shortcut) => (
                    <ShortcutRow key={shortcut.keys} entry={shortcut} />
                  ))}
                </div>
              </div>
            ))}

            {/* Tips footer */}
            <div>
              <Separator className="mb-4" />
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>Shortcuts are disabled while typing in input fields.</p>
                <p>
                  Chord shortcuts (like <Kbd>G</Kbd>{" "}
                  <span className="text-muted-foreground">then</span>{" "}
                  <Kbd>O</Kbd>) require pressing the keys in sequence within 800ms.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
