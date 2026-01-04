"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalProvider, useModal } from "@/lib/context/modal-context";

type ModalProps = {
  isOpen: boolean;
  close: () => void;
  size?: "small" | "medium" | "large";
  children: React.ReactNode;
  "data-testid"?: string;
};

/**
 * Modal component with compound pattern (Modal.Title, Modal.Body, Modal.Footer)
 * Based on Medusa's modal implementation
 */
function Modal({
  isOpen,
  close,
  size = "medium",
  children,
  "data-testid": dataTestId,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[75] bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          data-testid={dataTestId}
          className={cn(
            "fixed left-[50%] top-[50%] z-[75] translate-x-[-50%] translate-y-[-50%]",
            "flex flex-col justify-start w-full transform p-5 text-left",
            "bg-background shadow-xl border rounded-lg max-h-[85vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-200",
            {
              "max-w-md": size === "small",
              "max-w-xl": size === "medium",
              "max-w-3xl": size === "large",
            }
          )}
        >
          <ModalProvider close={close}>{children}</ModalProvider>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  const { close } = useModal();

  return (
    <DialogPrimitive.Title
      className={cn("flex items-center justify-between", className)}
    >
      <div className="text-large-semi font-semibold">{children}</div>
      <button
        onClick={close}
        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        data-testid="close-modal-button"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </DialogPrimitive.Title>
  );
}

function Description({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "flex text-small-regular text-muted-foreground items-center pt-2 pb-4",
        className
      )}
    >
      {children}
    </DialogPrimitive.Description>
  );
}

function Body({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-4", className)}>
      {children}
    </div>
  );
}

function Footer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-x-4 pt-4 border-t",
        className
      )}
    >
      {children}
    </div>
  );
}

Modal.Title = Title;
Modal.Description = Description;
Modal.Body = Body;
Modal.Footer = Footer;

export { Modal, useModal };
