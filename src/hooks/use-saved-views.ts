"use client";

import { useState, useCallback, useEffect } from "react";

export type SavedView = {
  id: string;
  name: string;
  filters: Record<string, string | string[] | boolean | null>;
};

export function useSavedViews(pageKey: string) {
  const storageKey = `vernont_saved_views_${pageKey}`;

  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setViews(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const persist = useCallback(
    (updated: SavedView[]) => {
      setViews(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    },
    [storageKey]
  );

  const saveView = useCallback(
    (name: string, filters: Record<string, string | string[] | boolean | null>) => {
      const view: SavedView = {
        id: Date.now().toString(36),
        name,
        filters,
      };
      persist([...views, view]);
      return view;
    },
    [views, persist]
  );

  const deleteView = useCallback(
    (id: string) => {
      persist(views.filter((v) => v.id !== id));
      if (activeViewId === id) setActiveViewId(null);
    },
    [views, activeViewId, persist]
  );

  const applyView = useCallback(
    (id: string) => {
      setActiveViewId(id);
      return views.find((v) => v.id === id)?.filters ?? null;
    },
    [views]
  );

  const clearActiveView = useCallback(() => {
    setActiveViewId(null);
  }, []);

  return {
    views,
    activeViewId,
    saveView,
    deleteView,
    applyView,
    clearActiveView,
  };
}
