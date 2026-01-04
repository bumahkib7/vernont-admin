"use client";

import React, { createContext, useContext } from "react";

type ModalContextType = {
  close: () => void;
};

const ModalContext = createContext<ModalContextType | null>(null);

type ModalProviderProps = {
  close: () => void;
  children: React.ReactNode;
};

export function ModalProvider({ close, children }: ModalProviderProps) {
  return (
    <ModalContext.Provider value={{ close }}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
