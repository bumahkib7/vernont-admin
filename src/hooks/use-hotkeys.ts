"use client";

import { useEffect, useRef, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export type HotkeyModifiers = {
  meta?: boolean;   // Cmd on Mac, Ctrl on Windows/Linux
  shift?: boolean;
  alt?: boolean;
};

export type HotkeyBinding = {
  /** Single key: "n", modifier combo: "meta+k", chord: "g o" */
  keys: string;
  /** Callback when hotkey fires */
  handler: () => void;
  /** Description for help dialog */
  description?: string;
  /** Group label for help dialog */
  group?: string;
  /** If true, fires even when typing in inputs */
  enableInInputs?: boolean;
  /** If false, don't prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether this hotkey is enabled */
  enabled?: boolean;
};

type ParsedKey = {
  key: string;
  meta: boolean;
  shift: boolean;
  alt: boolean;
};

// ============================================================================
// Utilities
// ============================================================================

function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform);
}

function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function parseKeyCombo(combo: string): ParsedKey {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  return {
    key: parts[parts.length - 1],
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("opt"),
  };
}

function eventMatchesParsedKey(event: KeyboardEvent, parsed: ParsedKey): boolean {
  const eventKey = event.key.toLowerCase();
  const mac = isMacPlatform();

  // Check modifier: meta means Cmd on Mac, Ctrl elsewhere
  const hasMeta = mac ? event.metaKey : event.ctrlKey;
  const metaMatch = parsed.meta ? hasMeta : !hasMeta;

  // For shift: special case for "?" which is shift+/ on most keyboards
  let shiftMatch: boolean;
  if (parsed.key === "?" && eventKey === "?") {
    // The "?" key inherently requires shift, so we don't enforce shiftKey matching
    shiftMatch = true;
  } else {
    shiftMatch = parsed.shift ? event.shiftKey : !event.shiftKey;
  }

  const altMatch = parsed.alt ? event.altKey : !event.altKey;

  // For "/" key, also match when eventKey is "/"
  const keyMatch = eventKey === parsed.key;

  return keyMatch && metaMatch && shiftMatch && altMatch;
}

// ============================================================================
// Chord state (module-level singleton)
// ============================================================================

let chordPrefix: string | null = null;
let chordTimer: ReturnType<typeof setTimeout> | null = null;
const CHORD_TIMEOUT = 800; // ms to wait for second key in a chord

function resetChord() {
  chordPrefix = null;
  if (chordTimer) {
    clearTimeout(chordTimer);
    chordTimer = null;
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Register hotkeys with support for:
 * - Single keys: "n", "f", "?"
 * - Modifier combos: "meta+k", "meta+enter", "shift+?"
 * - Chords (vim-style): "g o", "g p", "g d"
 *
 * Keys syntax:
 * - Space-separated = chord ("g o" means press G, then O)
 * - Plus-separated = simultaneous ("meta+k" means Cmd+K)
 * - Single char = just that key ("n")
 */
export function useHotkeys(bindings: HotkeyBinding[]) {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const current = bindingsRef.current;

      for (const binding of current) {
        if (binding.enabled === false) continue;

        const inInput = isInputElement(event.target);
        if (inInput && !binding.enableInInputs) {
          // Exception: modifier combos should still work in inputs
          // (e.g., Cmd+Enter to save, Cmd+K to open palette)
          const parts = binding.keys.split(" ");
          const lastPart = parts[parts.length - 1];
          const parsed = parseKeyCombo(lastPart);
          if (!parsed.meta && !parsed.alt) {
            continue;
          }
        }

        const parts = binding.keys.split(" ");

        if (parts.length === 2) {
          // Chord: "g o"
          const [prefix, suffix] = parts;
          const prefixParsed = parseKeyCombo(prefix);
          const suffixParsed = parseKeyCombo(suffix);

          if (chordPrefix === prefix) {
            // We're in the second phase of a chord
            if (eventMatchesParsedKey(event, suffixParsed)) {
              if (binding.preventDefault !== false) {
                event.preventDefault();
                event.stopPropagation();
              }
              resetChord();
              binding.handler();
              return;
            }
          } else if (!chordPrefix && eventMatchesParsedKey(event, prefixParsed)) {
            // First key of a potential chord — don't fire yet,
            // just set up the chord prefix. We'll handle this below.
            // Continue checking other bindings first.
          }
        } else if (parts.length === 1) {
          // Single key or modifier combo
          const parsed = parseKeyCombo(parts[0]);

          // If we're in a chord sequence, don't fire single-key shortcuts
          // (except modifiers which can't be confused with chord suffixes)
          if (chordPrefix && !parsed.meta && !parsed.alt) {
            continue;
          }

          if (eventMatchesParsedKey(event, parsed)) {
            if (binding.preventDefault !== false) {
              event.preventDefault();
              event.stopPropagation();
            }
            resetChord();
            binding.handler();
            return;
          }
        }
      }

      // After checking all bindings for chord completions,
      // check if this key starts a new chord
      if (!chordPrefix && !isInputElement(event.target)) {
        const eventKey = event.key.toLowerCase();
        // Check if any binding uses this as a chord prefix
        const startsChord = current.some((b) => {
          if (b.enabled === false) return false;
          const parts = b.keys.split(" ");
          if (parts.length !== 2) return false;
          const prefixParsed = parseKeyCombo(parts[0]);
          return eventMatchesParsedKey(event, prefixParsed);
        });

        if (startsChord) {
          // Find the prefix string
          for (const b of current) {
            if (b.enabled === false) continue;
            const parts = b.keys.split(" ");
            if (parts.length !== 2) continue;
            const prefixParsed = parseKeyCombo(parts[0]);
            if (eventMatchesParsedKey(event, prefixParsed)) {
              chordPrefix = parts[0];
              break;
            }
          }

          if (chordTimer) clearTimeout(chordTimer);
          chordTimer = setTimeout(resetChord, CHORD_TIMEOUT);
          // Don't preventDefault here — "g" alone shouldn't be captured
          return;
        }
      }

      // If we reach here and we're in a chord but no binding matched, reset
      if (chordPrefix) {
        resetChord();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * Convenience: register a single hotkey
 */
export function useHotkey(
  keys: string,
  handler: () => void,
  options?: Omit<HotkeyBinding, "keys" | "handler">
) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  const stableBinding = useRef<HotkeyBinding[]>([]);

  // Update the binding ref without creating new arrays every render
  stableBinding.current = [
    {
      keys,
      handler: () => handlerRef.current(),
      ...options,
    },
  ];

  useHotkeys(stableBinding.current);
}

// ============================================================================
// Display helpers
// ============================================================================

export function formatKeysForDisplay(keys: string): string[][] {
  const parts = keys.split(" ");
  return parts.map((part) => {
    const segments = part.split("+").map((s) => s.trim());
    return segments.map((seg) => {
      const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
      switch (seg.toLowerCase()) {
        case "meta":
        case "cmd":
        case "ctrl":
          return mac ? "\u2318" : "Ctrl";
        case "shift":
          return mac ? "\u21E7" : "Shift";
        case "alt":
        case "opt":
          return mac ? "\u2325" : "Alt";
        case "enter":
          return "\u21B5";
        case "escape":
        case "esc":
          return "Esc";
        case "arrowup":
          return "\u2191";
        case "arrowdown":
          return "\u2193";
        case "arrowleft":
          return "\u2190";
        case "arrowright":
          return "\u2192";
        case "backspace":
          return "\u232B";
        case " ":
          return "Space";
        default:
          return seg.toUpperCase();
      }
    });
  });
}
