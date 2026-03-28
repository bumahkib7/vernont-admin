"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStores,
  getStore,
  createStore,
  updateStore,
  deleteStore,
  getStoreSettings,
  initializeStoreSettings,
  updateStoreBusinessInfo,
  updateStoreLocalization,
  updateStoreFeatures,
  updateStorePolicies,
  updateStoreCheckoutSettings,
  updateStoreShippingSettings,
  updateStoreSeoSettings,
  updateStoreThemeSettings,
  updateAllStoreSettings,
  type StoresResponse,
  type StoreResponse,
  type StoreSettingsResponse,
  type CreateStoreRequest,
  type UpdateStoreRequest,
  type UpdateBusinessInfoRequest,
  type UpdateLocalizationRequest,
  type UpdateFeaturesRequest,
  type UpdatePoliciesRequest,
  type UpdateCheckoutSettingsRequest,
  type UpdateShippingSettingsRequest,
  type UpdateSeoSettingsRequest,
  type UpdateThemeSettingsRequest,
  type UpdateAllSettingsRequest,
} from "@/lib/api";

// ============================================================================
// Query Keys
// ============================================================================

export const settingsKeys = {
  all: ["settings"] as const,
  stores: () => [...settingsKeys.all, "stores"] as const,
  storesList: (params?: { limit?: number; offset?: number; q?: string }) =>
    [...settingsKeys.stores(), "list", params] as const,
  storeDetail: (id: string) => [...settingsKeys.stores(), "detail", id] as const,
  storeSettings: (storeId: string) =>
    [...settingsKeys.all, "store-settings", storeId] as const,
};

// ============================================================================
// Store Queries
// ============================================================================

/**
 * Fetch all stores.
 */
export function useStores(params?: { limit?: number; offset?: number; q?: string }) {
  return useQuery<StoresResponse>({
    queryKey: settingsKeys.storesList(params),
    queryFn: () => getStores(params),
    staleTime: 60_000,
  });
}

/**
 * Fetch a single store by ID.
 */
export function useStore(storeId: string, enabled = true) {
  return useQuery<StoreResponse>({
    queryKey: settingsKeys.storeDetail(storeId),
    queryFn: () => getStore(storeId),
    enabled: enabled && !!storeId,
    staleTime: 60_000,
  });
}

/**
 * Fetch store settings for a given store.
 * Automatically initializes settings if they don't exist yet (404).
 */
export function useStoreSettings(storeId: string, enabled = true) {
  return useQuery<StoreSettingsResponse>({
    queryKey: settingsKeys.storeSettings(storeId),
    queryFn: async () => {
      try {
        return await getStoreSettings(storeId);
      } catch {
        // Settings don't exist yet — initialize them
        return await initializeStoreSettings(storeId);
      }
    },
    enabled: enabled && !!storeId,
    staleTime: 30_000,
  });
}

// ============================================================================
// Store Mutations
// ============================================================================

/**
 * Create a new store.
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStoreRequest) => createStore(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stores() });
    },
  });
}

/**
 * Update a store.
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: string; data: UpdateStoreRequest }) =>
      updateStore(storeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stores() });
      queryClient.invalidateQueries({
        queryKey: settingsKeys.storeDetail(variables.storeId),
      });
    },
  });
}

/**
 * Delete a store.
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (storeId: string) => deleteStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.stores() });
    },
  });
}

// ============================================================================
// Store Settings Mutations
// ============================================================================

/** Helper — invalidates the store-settings query for a given store. */
function useSettingsMutation<TData, TVariables extends { storeId: string }>(
  mutationFn: (vars: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: settingsKeys.storeSettings(variables.storeId),
      });
    },
  });
}

/**
 * Update business info section.
 */
export function useUpdateBusinessInfo() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateBusinessInfoRequest }) =>
      updateStoreBusinessInfo(storeId, data),
  );
}

/**
 * Update localization section.
 */
export function useUpdateLocalization() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateLocalizationRequest }) =>
      updateStoreLocalization(storeId, data),
  );
}

/**
 * Update features section.
 */
export function useUpdateFeatures() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateFeaturesRequest }) =>
      updateStoreFeatures(storeId, data),
  );
}

/**
 * Update policies section.
 */
export function useUpdatePolicies() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdatePoliciesRequest }) =>
      updateStorePolicies(storeId, data),
  );
}

/**
 * Update checkout settings section.
 */
export function useUpdateCheckoutSettings() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateCheckoutSettingsRequest }) =>
      updateStoreCheckoutSettings(storeId, data),
  );
}

/**
 * Update shipping settings section.
 */
export function useUpdateShippingSettings() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateShippingSettingsRequest }) =>
      updateStoreShippingSettings(storeId, data),
  );
}

/**
 * Update SEO settings section.
 */
export function useUpdateSeoSettings() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateSeoSettingsRequest }) =>
      updateStoreSeoSettings(storeId, data),
  );
}

/**
 * Update theme settings section.
 */
export function useUpdateThemeSettings() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateThemeSettingsRequest }) =>
      updateStoreThemeSettings(storeId, data),
  );
}

/**
 * Bulk update all settings.
 */
export function useUpdateAllSettings() {
  return useSettingsMutation(
    ({ storeId, data }: { storeId: string; data: UpdateAllSettingsRequest }) =>
      updateAllStoreSettings(storeId, data),
  );
}
