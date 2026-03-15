"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ShortcutEntry = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: ShortcutEntry[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["\u2318", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialog / deselect" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "O"], description: "Go to Orders" },
      { keys: ["G", "P"], description: "Go to Products" },
      { keys: ["G", "C"], description: "Go to Customers" },
      { keys: ["G", "I"], description: "Go to Inventory" },
      { keys: ["G", "S"], description: "Go to Settings" },
    ],
  },
  {
    title: "Quick Actions",
    shortcuts: [
      { keys: ["N", "O"], description: "New Order" },
      { keys: ["N", "P"], description: "New Product" },
      { keys: ["N", "C"], description: "New Customer" },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="contents">
                          {i > 0 && (
                            <span className="text-xs text-muted-foreground mx-0.5">
                              +
                            </span>
                          )}
                          <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
