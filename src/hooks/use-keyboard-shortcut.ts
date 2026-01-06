"use client";

import { useEffect, useCallback, useRef } from "react";

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  enableInInputs?: boolean;
  description?: string;
}

export interface ShortcutHandler {
  config: ShortcutConfig;
  callback: () => void;
}

/**
 * Normalize key for comparison (handles case sensitivity)
 */
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

/**
 * Check if the current platform is Mac
 */
export function isMac(): boolean {
  if (typeof window === "undefined") return false;
  return navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

/**
 * Get the modifier key label for the current platform
 */
export function getModifierLabel(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/**
 * Format a shortcut for display
 */
export function formatShortcut(config: ShortcutConfig): string {
  const parts: string[] = [];

  if (config.ctrl || config.meta) {
    parts.push(isMac() ? "⌘" : "Ctrl");
  }
  if (config.shift) {
    parts.push(isMac() ? "⇧" : "Shift");
  }
  if (config.alt) {
    parts.push(isMac() ? "⌥" : "Alt");
  }

  // Format special keys
  let keyDisplay = config.key.toUpperCase();
  if (config.key === "Escape") keyDisplay = "Esc";
  if (config.key === "Enter") keyDisplay = "↵";
  if (config.key === "ArrowUp") keyDisplay = "↑";
  if (config.key === "ArrowDown") keyDisplay = "↓";
  if (config.key === "ArrowLeft") keyDisplay = "←";
  if (config.key === "ArrowRight") keyDisplay = "→";
  if (config.key === "/") keyDisplay = "/";
  if (config.key === "?") keyDisplay = "?";

  parts.push(keyDisplay);

  return parts.join(isMac() ? "" : "+");
}

/**
 * Check if event matches shortcut config
 */
function matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
  const key = normalizeKey(event.key);
  const configKey = normalizeKey(config.key);

  // On Mac, use metaKey for Cmd. On Windows/Linux, use ctrlKey
  const modifierMatch = isMac()
    ? (config.meta || config.ctrl) ? event.metaKey : !event.metaKey
    : (config.meta || config.ctrl) ? event.ctrlKey : !event.ctrlKey;

  const shiftMatch = config.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = config.alt ? event.altKey : !event.altKey;

  return key === configKey && modifierMatch && shiftMatch && altMatch;
}

/**
 * Check if the event target is an input element
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return true;
  }

  // Check for contenteditable
  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/**
 * Hook for registering a single keyboard shortcut
 */
export function useKeyboardShortcut(
  config: ShortcutConfig | null,
  callback: () => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    if (!config) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if in input and not enabled for inputs
      if (!config.enableInInputs && isInputElement(event.target)) {
        return;
      }

      if (matchesShortcut(event, config)) {
        if (config.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        callbackRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config]);
}

/**
 * Hook for registering multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const { config, callback } of shortcutsRef.current) {
        // Skip if in input and not enabled for inputs
        if (!config.enableInInputs && isInputElement(event.target)) {
          continue;
        }

        if (matchesShortcut(event, config)) {
          if (config.preventDefault !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          callback();
          return; // Only trigger first matching shortcut
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Common shortcut configs for reuse
 */
export const SHORTCUTS = {
  SAVE: { key: "s", meta: true, description: "Save changes" },
  NEW: { key: "n", meta: true, description: "Create new" },
  SEARCH: { key: "k", meta: true, description: "Search" },
  CLOSE: { key: "Escape", description: "Close / Cancel" },
  SUBMIT: { key: "Enter", meta: true, description: "Submit form" },
  UNDO: { key: "z", meta: true, description: "Undo" },
  REDO: { key: "z", meta: true, shift: true, description: "Redo" },
  HELP: { key: "?", meta: true, shift: true, description: "Show shortcuts" },
  SELECT_ALL: { key: "a", meta: true, description: "Select all" },
  REFRESH: { key: "r", meta: true, shift: true, description: "Refresh" },
  DELETE: { key: "Backspace", meta: true, description: "Delete selected" },
  NEXT: { key: "ArrowDown", alt: true, description: "Next item" },
  PREV: { key: "ArrowUp", alt: true, description: "Previous item" },
} as const satisfies Record<string, ShortcutConfig>;
