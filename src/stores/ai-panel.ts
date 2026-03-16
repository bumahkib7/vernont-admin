"use client";

import { create } from "zustand";

interface AiPanelState {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useAiPanelStore = create<AiPanelState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
