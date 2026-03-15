"use client";

import { useEffect, useCallback, useState } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Browser beforeunload warning
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation) {
      window.location.href = pendingNavigation;
    }
    setShowDialog(false);
    setPendingNavigation(null);
  }, [pendingNavigation]);

  const cancelNavigation = useCallback(() => {
    setShowDialog(false);
    setPendingNavigation(null);
  }, []);

  const guardNavigation = useCallback(
    (href: string) => {
      if (isDirty) {
        setPendingNavigation(href);
        setShowDialog(true);
        return false;
      }
      return true;
    },
    [isDirty]
  );

  return {
    showDialog,
    confirmNavigation,
    cancelNavigation,
    guardNavigation,
  };
}
