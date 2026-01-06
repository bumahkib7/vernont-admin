"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type ShortcutConfig,
  formatShortcut,
  isMac,
  SHORTCUTS,
} from "@/hooks/use-keyboard-shortcut";

// ============================================================================
// Types
// ============================================================================

interface RegisteredShortcut {
  id: string;
  config: ShortcutConfig;
  callback: () => void;
  scope: string;
  enabled: boolean;
}

interface ShortcutGroup {
  name: string;
  shortcuts: { config: ShortcutConfig; description: string }[];
}

interface KeyboardShortcutsContextValue {
  registerShortcut: (
    id: string,
    config: ShortcutConfig,
    callback: () => void,
    scope?: string
  ) => void;
  unregisterShortcut: (id: string) => void;
  enableShortcut: (id: string) => void;
  disableShortcut: (id: string) => void;
  showHelp: () => void;
  hideHelp: () => void;
  isHelpOpen: boolean;
  getShortcutsByScope: (scope: string) => RegisteredShortcut[];
}

// ============================================================================
// Context
// ============================================================================

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error(
      "useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider"
    );
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Map<string, RegisteredShortcut>>(new Map());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const shortcutsRef = useRef<Map<string, RegisteredShortcut>>(shortcuts);

  // Keep ref in sync
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const registerShortcut = useCallback(
    (
      id: string,
      config: ShortcutConfig,
      callback: () => void,
      scope: string = "global"
    ) => {
      setShortcuts((prev) => {
        const next = new Map(prev);
        next.set(id, { id, config, callback, scope, enabled: true });
        return next;
      });
    },
    []
  );

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const enableShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const shortcut = prev.get(id);
      if (!shortcut) return prev;
      const next = new Map(prev);
      next.set(id, { ...shortcut, enabled: true });
      return next;
    });
  }, []);

  const disableShortcut = useCallback((id: string) => {
    setShortcuts((prev) => {
      const shortcut = prev.get(id);
      if (!shortcut) return prev;
      const next = new Map(prev);
      next.set(id, { ...shortcut, enabled: false });
      return next;
    });
  }, []);

  const showHelp = useCallback(() => setIsHelpOpen(true), []);
  const hideHelp = useCallback(() => setIsHelpOpen(false), []);

  const getShortcutsByScope = useCallback(
    (scope: string) => {
      return Array.from(shortcuts.values()).filter((s) => s.scope === scope);
    },
    [shortcuts]
  );

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for help shortcut (Cmd+Shift+?)
      if (
        (isMac() ? event.metaKey : event.ctrlKey) &&
        event.shiftKey &&
        event.key === "?"
      ) {
        event.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // Process registered shortcuts
      const currentShortcuts = shortcutsRef.current;
      for (const shortcut of currentShortcuts.values()) {
        if (!shortcut.enabled) continue;

        const { config, callback } = shortcut;

        // Check modifier keys
        const wantsMeta = config.meta || config.ctrl;
        const hasMeta = isMac() ? event.metaKey : event.ctrlKey;
        const wantsShift = config.shift ?? false;
        const wantsAlt = config.alt ?? false;

        const metaMatch = wantsMeta ? hasMeta : !hasMeta;
        const shiftMatch = wantsShift ? event.shiftKey : !event.shiftKey;
        const altMatch = wantsAlt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === config.key.toLowerCase();

        if (keyMatch && metaMatch && shiftMatch && altMatch) {
          // Check if we're in an input field
          const target = event.target as HTMLElement;
          const isInput =
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable;

          if (isInput && !config.enableInInputs) {
            continue;
          }

          if (config.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }

          callback();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value: KeyboardShortcutsContextValue = {
    registerShortcut,
    unregisterShortcut,
    enableShortcut,
    disableShortcut,
    showHelp,
    hideHelp,
    isHelpOpen,
    getShortcutsByScope,
  };

  // Group shortcuts by scope for display
  const shortcutGroups = React.useMemo(() => {
    const groups = new Map<string, RegisteredShortcut[]>();
    shortcuts.forEach((shortcut) => {
      const existing = groups.get(shortcut.scope) || [];
      groups.set(shortcut.scope, [...existing, shortcut]);
    });
    return groups;
  }, [shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}

      {/* Shortcuts Help Dialog */}
      <ShortcutsHelpDialog
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        shortcutGroups={shortcutGroups}
      />
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================================================
// Help Dialog Component
// ============================================================================

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcutGroups: Map<string, RegisteredShortcut[]>;
}

function ShortcutsHelpDialog({
  open,
  onOpenChange,
  shortcutGroups,
}: ShortcutsHelpDialogProps) {
  // Default shortcuts that are always available
  const globalShortcuts: ShortcutGroup = {
    name: "Global",
    shortcuts: [
      { config: SHORTCUTS.HELP, description: "Show keyboard shortcuts" },
      { config: SHORTCUTS.SEARCH, description: "Open search" },
      { config: SHORTCUTS.CLOSE, description: "Close dialog / Cancel" },
    ],
  };

  const scopeLabels: Record<string, string> = {
    global: "Global",
    pricing: "Pricing Workbench",
    "pricing-dialog": "Pricing Rule Editor",
    products: "Products",
    orders: "Orders",
    editor: "Editor",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Keyboard Shortcuts
            <Badge variant="secondary" className="font-mono text-xs">
              {formatShortcut(SHORTCUTS.HELP)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and perform actions quickly
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
          <div className="space-y-6 py-2">
            {/* Global shortcuts */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {globalShortcuts.name}
              </h4>
              <div className="space-y-2">
                {globalShortcuts.shortcuts.map((shortcut, index) => (
                  <ShortcutRow
                    key={index}
                    shortcut={shortcut.config}
                    description={shortcut.description}
                  />
                ))}
              </div>
            </div>

            {/* Registered shortcuts by scope */}
            {Array.from(shortcutGroups.entries()).map(([scope, shortcuts]) => {
              if (shortcuts.length === 0) return null;
              const filteredShortcuts = shortcuts.filter(
                (s) => s.config.description
              );
              if (filteredShortcuts.length === 0) return null;

              return (
                <div key={scope} className="space-y-3">
                  <Separator />
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {scopeLabels[scope] || scope}
                  </h4>
                  <div className="space-y-2">
                    {filteredShortcuts.map((shortcut) => (
                      <ShortcutRow
                        key={shortcut.id}
                        shortcut={shortcut.config}
                        description={shortcut.config.description || ""}
                        disabled={!shortcut.enabled}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Tips */}
            <div className="space-y-3">
              <Separator />
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tips
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>
                  • Press <kbd className="kbd">{isMac() ? "⌘" : "Ctrl"}</kbd> +{" "}
                  <kbd className="kbd">K</kbd> anywhere to search
                </li>
                <li>
                  • Press <kbd className="kbd">Esc</kbd> to close dialogs
                </li>
                <li>
                  • Shortcuts are disabled when typing in input fields
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Shortcut Row Component
// ============================================================================

interface ShortcutRowProps {
  shortcut: ShortcutConfig;
  description: string;
  disabled?: boolean;
}

function ShortcutRow({ shortcut, description, disabled }: ShortcutRowProps) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="text-sm">{description}</span>
      <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded border shadow-sm">
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
}

// ============================================================================
// useRegisterShortcut Hook
// ============================================================================

/**
 * Stable config comparison - converts config to a string key for dependency tracking
 */
function getConfigKey(config: ShortcutConfig | null): string {
  if (!config) return "";
  return `${config.key}-${config.ctrl ?? false}-${config.meta ?? false}-${config.shift ?? false}-${config.alt ?? false}`;
}

/**
 * Hook to register a shortcut with the global context
 * Automatically cleans up on unmount
 */
export function useRegisterShortcut(
  id: string,
  config: ShortcutConfig | null,
  callback: () => void,
  scope: string = "global"
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const callbackRef = useRef(callback);
  const configRef = useRef(config);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Keep config ref updated
  useEffect(() => {
    configRef.current = config;
  });

  // Use a stable key for the config to avoid infinite loops
  const configKey = getConfigKey(config);

  useEffect(() => {
    const currentConfig = configRef.current;
    if (!currentConfig) return;

    registerShortcut(id, currentConfig, () => callbackRef.current(), scope);
    return () => unregisterShortcut(id);
  }, [id, configKey, scope, registerShortcut, unregisterShortcut]);
}

/**
 * Hook to register multiple shortcuts at once
 * Uses stable IDs to track which shortcuts need registration
 */
export function useRegisterShortcuts(
  shortcuts: { id: string; config: ShortcutConfig; callback: () => void }[],
  scope: string = "global"
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const shortcutsRef = useRef(shortcuts);

  // Keep ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  });

  // Create a stable key from shortcut IDs
  const shortcutIds = shortcuts.map(s => s.id).join(",");

  useEffect(() => {
    const currentShortcuts = shortcutsRef.current;
    currentShortcuts.forEach(({ id, config, callback }) => {
      registerShortcut(id, config, callback, scope);
    });

    return () => {
      currentShortcuts.forEach(({ id }) => {
        unregisterShortcut(id);
      });
    };
  }, [shortcutIds, scope, registerShortcut, unregisterShortcut]);
}
