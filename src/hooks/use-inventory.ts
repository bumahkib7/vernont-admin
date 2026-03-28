"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getInventoryLevels,
  getInventoryLevel,
  getInventoryStockLocations,
  getInventoryStockLocation,
  getInventoryMovements,
  getInventoryLevelMovements,
  getMovementTypes,
  adjustInventory,
  backfillInventory,
  createInventoryStockLocation,
  deleteInventoryStockLocation,
  type InventoryLevelsResponse,
  type InventoryStockLocationsResponse,
  type InventoryMovementsResponse,
  type AdjustInventoryRequest,
  type CreateInventoryStockLocationRequest,
  type InventoryLevel,
  type InventoryStockLocation,
  type MovementTypeInfo,
} from "@/lib/api";
import { toast } from "sonner";

// =============================================================================
// Query Keys
// =============================================================================

export const inventoryKeys = {
  all: ["inventory"] as const,
  levels: (params?: { limit?: number; offset?: number; locationId?: string }) =>
    ["inventory", "levels", params ?? {}] as const,
  level: (id: string) => ["inventory", "levels", id] as const,
  locations: (params?: { limit?: number; offset?: number }) =>
    ["inventory", "locations", params ?? {}] as const,
  location: (id: string) => ["inventory", "locations", id] as const,
  movements: (params?: {
    offset?: number;
    limit?: number;
    locationId?: string;
    inventoryItemId?: string;
    inventoryLevelId?: string;
    sku?: string;
    movementType?: string;
  }) => ["inventory", "movements", params ?? {}] as const,
  levelMovements: (levelId: string, params?: { offset?: number; limit?: number }) =>
    ["inventory", "movements", "level", levelId, params ?? {}] as const,
  movementTypes: () => ["inventory", "movement-types"] as const,
};

// =============================================================================
// Inventory Levels
// =============================================================================

export function useInventoryLevels(params?: {
  limit?: number;
  offset?: number;
  locationId?: string;
}) {
  return useQuery<InventoryLevelsResponse>({
    queryKey: inventoryKeys.levels(params),
    queryFn: () => getInventoryLevels(params),
    staleTime: 30000,
  });
}

export function useInventoryLevel(id: string, enabled = true) {
  return useQuery<{ inventory_level: InventoryLevel }>({
    queryKey: inventoryKeys.level(id),
    queryFn: () => getInventoryLevel(id),
    enabled: !!id && enabled,
  });
}

// =============================================================================
// Stock Locations
// =============================================================================

export function useInventoryStockLocations(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery<InventoryStockLocationsResponse>({
    queryKey: inventoryKeys.locations(params),
    queryFn: () => getInventoryStockLocations(params),
    staleTime: 60000,
  });
}

export function useInventoryStockLocation(id: string, enabled = true) {
  return useQuery<{ stock_location: InventoryStockLocation }>({
    queryKey: inventoryKeys.location(id),
    queryFn: () => getInventoryStockLocation(id),
    enabled: !!id && enabled,
  });
}

// =============================================================================
// Inventory Movements
// =============================================================================

export function useInventoryMovements(
  params?: {
    offset?: number;
    limit?: number;
    locationId?: string;
    inventoryItemId?: string;
    inventoryLevelId?: string;
    sku?: string;
    movementType?: string;
  },
  enabled = true
) {
  return useQuery<InventoryMovementsResponse>({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => getInventoryMovements(params),
    enabled,
    staleTime: 15000,
  });
}

export function useInventoryLevelMovements(
  levelId: string,
  params?: { offset?: number; limit?: number }
) {
  return useQuery<InventoryMovementsResponse>({
    queryKey: inventoryKeys.levelMovements(levelId, params),
    queryFn: () => getInventoryLevelMovements(levelId, params),
    enabled: !!levelId,
  });
}

export function useMovementTypes() {
  return useQuery<{ movement_types: MovementTypeInfo[] }>({
    queryKey: inventoryKeys.movementTypes(),
    queryFn: getMovementTypes,
    staleTime: 300000, // 5 minutes — these rarely change
  });
}

// =============================================================================
// Mutations
// =============================================================================

export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdjustInventoryRequest) => adjustInventory(data),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "levels"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "movements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to adjust inventory");
    },
  });
}

export function useBackfillInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: backfillInventory,
    onSuccess: (result) => {
      if (result.backfilled > 0) {
        toast.success(
          `Created inventory for ${result.backfilled} variant${result.backfilled !== 1 ? "s" : ""}`
        );
      } else {
        toast.info("All variants already have inventory records");
      }
      queryClient.invalidateQueries({ queryKey: ["inventory", "levels"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to backfill inventory");
    },
  });
}

export function useCreateStockLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryStockLocationRequest) =>
      createInventoryStockLocation(data),
    onSuccess: (result) => {
      toast.success(`${result.stock_location.name} has been created successfully`);
      queryClient.invalidateQueries({ queryKey: ["inventory", "locations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create location");
    },
  });
}

export function useDeleteStockLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInventoryStockLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "locations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete location");
    },
  });
}
