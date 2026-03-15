"use client";

import { useState, useCallback, useMemo } from "react";

export function useTableSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    toggle,
    toggleAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    hasSelection: selectedIds.size > 0,
  };
}
