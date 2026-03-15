"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function useAutoSaveDraft<T>(
  key: string,
  data: T,
  options?: { interval?: number; enabled?: boolean }
) {
  const { interval = 30000, enabled = true } = options ?? {};
  const storageKey = `vernont_draft_${key}`;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setHasDraft(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Auto-save on interval
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(dataRef.current));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch {
        // storage full, ignore
      }
    }, interval);

    return () => clearInterval(timer);
  }, [storageKey, interval, enabled]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore
    }
    return null;
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
  }, [storageKey]);

  const saveDraftNow = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(dataRef.current));
      setLastSaved(new Date());
      setHasDraft(true);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    lastSaved,
    hasDraft,
    restoreDraft,
    clearDraft,
    saveDraftNow,
  };
}
