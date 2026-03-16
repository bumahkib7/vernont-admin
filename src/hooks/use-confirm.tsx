"use client";

import { useState, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

/**
 * Hook that replaces window.confirm with a styled AlertDialog.
 *
 * Usage:
 *   const [ConfirmDialog, confirm] = useConfirm();
 *   // ...
 *   const ok = await confirm({ description: "Delete this item?" });
 *   if (!ok) return;
 *   // Render <ConfirmDialog /> somewhere in JSX (once, at the bottom)
 */
export function useConfirm(): [React.FC, (opts: ConfirmOptions) => Promise<boolean>] {
  const [state, setState] = useState<(ConfirmOptions & { open: boolean }) | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...opts, open: true });
    });
  }, []);

  const handleResult = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  }, []);

  const ConfirmDialog: React.FC = useCallback(
    () => (
      <AlertDialog
        open={!!state?.open}
        onOpenChange={(open) => {
          if (!open) handleResult(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.title ?? "Are you sure?"}</AlertDialogTitle>
            <AlertDialogDescription>{state?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleResult(false)}>
              {state?.cancelLabel ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResult(true)}
              className={
                state?.variant === "destructive"
                  ? buttonVariants({ variant: "destructive" })
                  : undefined
              }
            >
              {state?.confirmLabel ?? "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [state, handleResult],
  );

  return [ConfirmDialog, confirm];
}
