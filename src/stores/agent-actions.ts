"use client";

import { create } from "zustand";
import { toast } from "sonner";

interface PendingFormData {
  formId: string;
  data: Record<string, unknown>;
}

interface PendingConfirmation {
  id: string;
  title: string;
  description: string;
  confirmLabel?: string;
}

interface AgentActionsState {
  pendingNavigation: { path: string } | null;
  pendingFormData: PendingFormData | null;
  pendingModal: { modalId: string; data?: Record<string, unknown> } | null;
  pendingConfirmation: PendingConfirmation | null;
  currentPage: string;
  currentEntityId: string | null;
  currentEntityType: string | null;

  dispatchAction: (action: string, payload: Record<string, unknown>) => void;
  setPageContext: (page: string, entityId?: string, entityType?: string) => void;
  getPageContext: () => { currentPage: string; currentEntityId: string | null; currentEntityType: string | null };
  consumeFormData: (formId: string) => Record<string, unknown> | null;
  consumeModal: (modalId: string) => Record<string, unknown> | null;
  consumeNavigation: () => { path: string } | null;
  clearConfirmation: () => void;
}

export const useAgentActionsStore = create<AgentActionsState>((set, get) => ({
  pendingNavigation: null,
  pendingFormData: null,
  pendingModal: null,
  pendingConfirmation: null,
  currentPage: "dashboard",
  currentEntityId: null,
  currentEntityType: null,

  dispatchAction: (action, payload) => {
    switch (action) {
      case "navigate_to_page": {
        const page = (payload.page as string) || "dashboard";
        const entityId = payload.entity_id as string | undefined;
        const path = entityId ? `/${page}/${entityId}` : `/${page}`;
        set({ pendingNavigation: { path } });
        break;
      }
      case "open_create_product_form": {
        // Set form data first, then navigation + modal trigger.
        // Navigation is consumed by useAgentNavigation after route change,
        // and modal/formData persist until the target page component mounts.
        set({
          pendingFormData: { formId: "add-product", data: payload },
          pendingModal: { modalId: "add-product", data: payload },
          pendingNavigation: { path: "/products" },
        });
        break;
      }
      case "open_create_discount_form": {
        set({
          pendingFormData: { formId: "discount-dialog", data: payload },
          pendingModal: { modalId: "discount-dialog", data: payload },
          pendingNavigation: { path: "/discounts" },
        });
        break;
      }
      case "show_notification": {
        const message = (payload.message as string) || "";
        const type = (payload.type as string) || "info";
        if (type === "success") toast.success(message);
        else if (type === "warning") toast.warning(message);
        else toast.info(message);
        break;
      }
      case "request_confirmation": {
        set({
          pendingConfirmation: {
            id: `confirm-${Date.now()}`,
            title: (payload.title as string) || "Confirm Action",
            description: (payload.description as string) || "",
            confirmLabel: payload.confirm_label as string | undefined,
          },
        });
        break;
      }
      default: {
        console.warn(`[agent-actions] Unknown action type: "${action}"`, payload);
        break;
      }
    }
  },

  setPageContext: (page, entityId, entityType) => {
    set({
      currentPage: page,
      currentEntityId: entityId || null,
      currentEntityType: entityType || null,
    });
  },

  getPageContext: () => {
    const state = get();
    return {
      currentPage: state.currentPage,
      currentEntityId: state.currentEntityId,
      currentEntityType: state.currentEntityType,
    };
  },

  consumeFormData: (formId) => {
    const state = get();
    if (state.pendingFormData?.formId === formId) {
      const data = state.pendingFormData.data;
      set({ pendingFormData: null });
      return data;
    }
    return null;
  },

  consumeModal: (modalId) => {
    const state = get();
    if (state.pendingModal?.modalId === modalId) {
      const data = state.pendingModal.data || null;
      set({ pendingModal: null });
      return data;
    }
    return null;
  },

  consumeNavigation: () => {
    const state = get();
    if (state.pendingNavigation) {
      const nav = state.pendingNavigation;
      // Only clear navigation — preserve pendingModal and pendingFormData
      // so the target page can consume them after mount
      set({ pendingNavigation: null });
      return nav;
    }
    return null;
  },

  clearConfirmation: () => {
    set({ pendingConfirmation: null });
  },
}));
