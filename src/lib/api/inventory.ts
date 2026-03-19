import { apiFetch } from "./client";

// =============================================================================
// Inventory API
// =============================================================================

export interface InventoryLevel {
  id: string;
  inventoryItemId: string;
  locationId: string;
  locationName?: string;
  sku?: string;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  incomingQuantity: number;
}

export interface InventoryLevelsResponse {
  inventory_levels: InventoryLevel[];
  count: number;
  offset: number;
  limit: number;
}

export interface InventoryStockLocation {
  id: string;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  countryCode?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  priority: number;
  fulfillmentEnabled: boolean;
  fullAddress: string;
  createdAt: string;
}

export interface InventoryStockLocationsResponse {
  stock_locations: InventoryStockLocation[];
  count: number;
  offset: number;
  limit: number;
}

export interface AdjustInventoryRequest {
  inventoryLevelId?: string;
  inventoryItemId?: string;
  locationId?: string;
  sku?: string;
  adjustment: number;
  reason: string;
  note?: string;
}

export interface AdjustInventoryResponse {
  inventoryLevelId: string;
  inventoryItemId: string;
  locationId: string;
  previousQuantity: number;
  adjustment: number;
  newQuantity: number;
  reason: string;
  note?: string;
  message: string;
}

export interface CreateInventoryStockLocationRequest {
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  countryCode?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  priority?: number;
  fulfillmentEnabled?: boolean;
}

// List inventory levels
export async function getInventoryLevels(params?: {
  limit?: number;
  offset?: number;
  locationId?: string;
}): Promise<InventoryLevelsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.locationId) searchParams.set("locationId", params.locationId);

  const query = searchParams.toString();
  return apiFetch<InventoryLevelsResponse>(`/admin/inventory/levels${query ? `?${query}` : ""}`);
}

// Get single inventory level
export async function getInventoryLevel(id: string): Promise<{ inventory_level: InventoryLevel }> {
  return apiFetch<{ inventory_level: InventoryLevel }>(`/admin/inventory/levels/${id}`);
}

// Adjust inventory
export async function adjustInventory(data: AdjustInventoryRequest): Promise<AdjustInventoryResponse> {
  return apiFetch<AdjustInventoryResponse>("/admin/inventory/levels/adjust", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Backfill inventory — creates missing inventory records for all product variants
export async function backfillInventory(): Promise<{ backfilled: number; skipped: number; details: Array<{ variantId: string; sku: string }> }> {
  return apiFetch("/admin/inventory/backfill", { method: "POST" });
}

// List inventory stock locations (for inventory management)
export async function getInventoryStockLocations(params?: {
  limit?: number;
  offset?: number;
}): Promise<InventoryStockLocationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<InventoryStockLocationsResponse>(`/admin/inventory/locations${query ? `?${query}` : ""}`);
}

// Get single inventory stock location
export async function getInventoryStockLocation(id: string): Promise<{ stock_location: InventoryStockLocation }> {
  return apiFetch<{ stock_location: InventoryStockLocation }>(`/admin/inventory/locations/${id}`);
}

// Create inventory stock location
export async function createInventoryStockLocation(
  data: CreateInventoryStockLocationRequest
): Promise<{ stock_location: InventoryStockLocation; message: string }> {
  return apiFetch<{ stock_location: InventoryStockLocation; message: string }>("/admin/inventory/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Delete inventory stock location
export async function deleteInventoryStockLocation(id: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/admin/inventory/locations/${id}`, {
    method: "DELETE",
  });
}

// Adjustment reason display helper
export function getAdjustmentReasonDisplay(reason: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    RESTOCK: { label: "Restock", color: "bg-green-500" },
    DAMAGED: { label: "Damaged", color: "bg-red-500" },
    LOST: { label: "Lost", color: "bg-red-500" },
    FOUND: { label: "Found", color: "bg-green-500" },
    CORRECTION: { label: "Correction", color: "bg-blue-500" },
    RETURN_RECEIVED: { label: "Return Received", color: "bg-purple-500" },
    TRANSFER_IN: { label: "Transfer In", color: "bg-green-500" },
    TRANSFER_OUT: { label: "Transfer Out", color: "bg-orange-500" },
    CYCLE_COUNT: { label: "Cycle Count", color: "bg-blue-500" },
    OTHER: { label: "Other", color: "bg-gray-500" },
  };
  return config[reason.toUpperCase()] || { label: reason, color: "bg-gray-400" };
}

// =============================================================================
// Inventory Movements (Stock History)
// =============================================================================

export interface InventoryMovement {
  id: string;
  eventId: string;
  inventoryItemId: string;
  inventoryLevelId?: string;
  locationId: string;
  locationName?: string;
  sku?: string;
  productTitle?: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  reason?: string;
  note?: string;
  referenceType?: string;
  referenceId?: string;
  performedBy?: string;
  occurredAt: string;
}

export type MovementType =
  | "STOCK_ADDED"
  | "STOCK_REMOVED"
  | "ADJUSTMENT"
  | "RESERVED"
  | "RELEASED"
  | "FULFILLED"
  | "RETURNED"
  | "TRANSFERRED_IN"
  | "TRANSFERRED_OUT"
  | "CYCLE_COUNT";

export interface InventoryMovementsResponse {
  movements: InventoryMovement[];
  count: number;
  offset: number;
  limit: number;
}

export interface MovementTypeInfo {
  value: string;
  label: string;
}

// Get inventory movements
export async function getInventoryMovements(params?: {
  offset?: number;
  limit?: number;
  locationId?: string;
  inventoryItemId?: string;
  inventoryLevelId?: string;
  sku?: string;
  movementType?: string;
}): Promise<InventoryMovementsResponse> {
  const query = new URLSearchParams();
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.locationId) query.set("locationId", params.locationId);
  if (params?.inventoryItemId) query.set("inventoryItemId", params.inventoryItemId);
  if (params?.inventoryLevelId) query.set("inventoryLevelId", params.inventoryLevelId);
  if (params?.sku) query.set("sku", params.sku);
  if (params?.movementType) query.set("movementType", params.movementType);
  return apiFetch<InventoryMovementsResponse>(`/admin/inventory/movements${query.toString() ? `?${query}` : ""}`);
}

// Get movements for a specific inventory level
export async function getInventoryLevelMovements(
  levelId: string,
  params?: { offset?: number; limit?: number }
): Promise<InventoryMovementsResponse> {
  const query = new URLSearchParams();
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  return apiFetch<InventoryMovementsResponse>(
    `/admin/inventory/levels/${levelId}/movements${query.toString() ? `?${query}` : ""}`
  );
}

// Get available movement types
export async function getMovementTypes(): Promise<{ movement_types: MovementTypeInfo[] }> {
  return apiFetch<{ movement_types: MovementTypeInfo[] }>("/admin/inventory/movements/types");
}

// Movement type display helper
export function getMovementTypeDisplay(type: MovementType): { label: string; color: string; icon: string } {
  const config: Record<MovementType, { label: string; color: string; icon: string }> = {
    STOCK_ADDED: { label: "Stock Added", color: "text-green-600 bg-green-100", icon: "+" },
    STOCK_REMOVED: { label: "Stock Removed", color: "text-red-600 bg-red-100", icon: "-" },
    ADJUSTMENT: { label: "Adjustment", color: "text-blue-600 bg-blue-100", icon: "~" },
    RESERVED: { label: "Reserved", color: "text-yellow-600 bg-yellow-100", icon: "R" },
    RELEASED: { label: "Released", color: "text-purple-600 bg-purple-100", icon: "L" },
    FULFILLED: { label: "Fulfilled", color: "text-green-600 bg-green-100", icon: "F" },
    RETURNED: { label: "Returned", color: "text-orange-600 bg-orange-100", icon: "↩" },
    TRANSFERRED_IN: { label: "Transfer In", color: "text-green-600 bg-green-100", icon: "→" },
    TRANSFERRED_OUT: { label: "Transfer Out", color: "text-orange-600 bg-orange-100", icon: "←" },
    CYCLE_COUNT: { label: "Cycle Count", color: "text-blue-600 bg-blue-100", icon: "#" },
  };
  return config[type] || { label: type, color: "text-gray-600 bg-gray-100", icon: "?" };
}
