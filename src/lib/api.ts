// Admin API client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Generic API fetch with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Order types
export interface OrderItem {
  id: string;
  variantId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currencyCode: string;
}

export interface OrderAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
}

// Full order response (for detail view)
export interface Order {
  id: string;
  displayId: number;
  email: string;
  customerId?: string;
  cartId?: string;
  regionId?: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  currencyCode: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  shippingMethodId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// Summary order response (for list view)
export interface OrderSummary {
  id: string;
  displayId: number;
  email: string;
  customerId?: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  currencyCode: string;
  total: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "PENDING" | "COMPLETED" | "ARCHIVED" | "CANCELED" | "REQUIRES_ACTION";
export type FulfillmentStatus = "NOT_FULFILLED" | "PARTIALLY_FULFILLED" | "FULFILLED" | "PARTIALLY_SHIPPED" | "SHIPPED" | "PARTIALLY_RETURNED" | "RETURNED" | "CANCELED" | "REQUIRES_ACTION";
export type PaymentStatus = "NOT_PAID" | "AWAITING" | "CAPTURED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "CANCELED" | "REQUIRES_ACTION" | "PARTIALLY_PAID" | "PAID";

export interface OrdersResponse {
  orders: OrderSummary[];
  limit: number;
  offset: number;
  count: number;
}

// Orders API
export async function getOrders(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);

  const query = searchParams.toString();
  return apiFetch<OrdersResponse>(`/admin/orders${query ? `?${query}` : ""}`);
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}`);
}

export async function cancelOrder(
  id: string,
  data?: { canceledBy?: string; reason?: string }
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

export interface FulfillOrderResponse {
  order: Order;
  fulfillmentId: string;
  message: string;
}

export async function fulfillOrder(
  id: string,
  data?: { fulfilledBy?: string }
): Promise<FulfillOrderResponse> {
  return apiFetch<FulfillOrderResponse>(`/admin/orders/${id}/fulfill`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

export interface ShipOrderResponse {
  order: Order;
  fulfillmentId: string;
  trackingNumbers: string[];
  message: string;
}

export async function shipOrder(
  id: string,
  data?: { trackingNumber?: string; carrier?: string; shippedBy?: string }
): Promise<ShipOrderResponse> {
  return apiFetch<ShipOrderResponse>(`/admin/orders/${id}/ship`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

export interface CompleteOrderResponse {
  order: Order;
  message: string;
}

export async function completeOrder(id: string): Promise<CompleteOrderResponse> {
  return apiFetch<CompleteOrderResponse>(`/admin/orders/${id}/complete`, {
    method: "POST",
  });
}

// Format price helper
export function formatPrice(amount: number, currencyCode: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
  }).format(amount);
}

// Format date helper
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Status display helpers
export function getPaymentStatusDisplay(status: PaymentStatus): { label: string; color: string } {
  const config: Record<PaymentStatus, { label: string; color: string }> = {
    NOT_PAID: { label: "Not Paid", color: "bg-gray-400" },
    AWAITING: { label: "Awaiting", color: "bg-orange-500" },
    CAPTURED: { label: "Captured", color: "bg-green-500" },
    PARTIALLY_PAID: { label: "Partially Paid", color: "bg-yellow-500" },
    PAID: { label: "Paid", color: "bg-green-500" },
    PARTIALLY_REFUNDED: { label: "Partially Refunded", color: "bg-purple-500" },
    REFUNDED: { label: "Refunded", color: "bg-purple-500" },
    CANCELED: { label: "Canceled", color: "bg-red-500" },
    REQUIRES_ACTION: { label: "Requires Action", color: "bg-orange-500" },
  };
  return config[status] || { label: status, color: "bg-gray-400" };
}

export function getFulfillmentStatusDisplay(status: FulfillmentStatus): { label: string; color: string } {
  const config: Record<FulfillmentStatus, { label: string; color: string }> = {
    NOT_FULFILLED: { label: "Not Fulfilled", color: "bg-gray-400" },
    PARTIALLY_FULFILLED: { label: "Partially Fulfilled", color: "bg-orange-500" },
    FULFILLED: { label: "Fulfilled", color: "bg-green-500" },
    PARTIALLY_SHIPPED: { label: "Partially Shipped", color: "bg-blue-400" },
    SHIPPED: { label: "Shipped", color: "bg-blue-500" },
    PARTIALLY_RETURNED: { label: "Partially Returned", color: "bg-purple-400" },
    RETURNED: { label: "Returned", color: "bg-purple-500" },
    CANCELED: { label: "Canceled", color: "bg-red-500" },
    REQUIRES_ACTION: { label: "Requires Action", color: "bg-orange-500" },
  };
  return config[status] || { label: status, color: "bg-gray-400" };
}

export function getOrderStatusDisplay(status: OrderStatus): { label: string; color: string } {
  const config: Record<OrderStatus, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "bg-orange-500" },
    COMPLETED: { label: "Completed", color: "bg-green-500" },
    ARCHIVED: { label: "Archived", color: "bg-gray-500" },
    CANCELED: { label: "Canceled", color: "bg-red-500" },
    REQUIRES_ACTION: { label: "Requires Action", color: "bg-orange-500" },
  };
  return config[status] || { label: status, color: "bg-gray-400" };
}

// =============================================================================
// Returns API
// =============================================================================

export type ReturnStatus = "REQUESTED" | "APPROVED" | "RECEIVED" | "REFUNDED" | "REJECTED" | "CANCELED";

export interface ReturnItem {
  id: string;
  orderLineItemId: string;
  variantId?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Return {
  id: string;
  orderId: string;
  orderDisplayId?: number;
  customerId?: string;
  customerEmail?: string;
  status: string;
  reason: string;
  reasonNote?: string;
  refundAmount: number;
  currencyCode: string;
  items: ReturnItem[];
  requestedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  refundedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  returnDeadline: string;
  daysRemaining: number;
  refundId?: string;
  canReceive: boolean;
  canRefund: boolean;
  canReject: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnSummary {
  id: string;
  orderId: string;
  orderDisplayId?: number;
  customerEmail?: string;
  status: string;
  reason: string;
  refundAmount: number;
  currencyCode: string;
  itemCount: number;
  requestedAt: string;
  canReceive: boolean;
  canRefund: boolean;
}

export interface ReturnsResponse {
  returns: ReturnSummary[];
  count: number;
  offset: number;
  limit: number;
}

export interface ReturnStats {
  pending: number;
  received: number;
  refunded: number;
  rejected: number;
  total: number;
}

// Get all returns
export async function getReturns(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  q?: string;
}): Promise<ReturnsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.status) searchParams.set("status", params.status);
  if (params?.q) searchParams.set("q", params.q);

  const query = searchParams.toString();
  return apiFetch<ReturnsResponse>(`/admin/returns${query ? `?${query}` : ""}`);
}

// Get single return
export async function getReturn(id: string): Promise<{ return_request: Return }> {
  return apiFetch<{ return_request: Return }>(`/admin/returns/${id}`);
}

// Get return stats
export async function getReturnStats(): Promise<ReturnStats> {
  return apiFetch<ReturnStats>("/admin/returns/stats");
}

// Mark return as received
export async function receiveReturn(
  id: string,
  data?: { receivedBy?: string; notes?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/receive`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

// Process refund for return
export async function processReturnRefund(
  id: string,
  data?: { processedBy?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/refund`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

// Reject return
export async function rejectReturn(
  id: string,
  data: { reason: string; rejectedBy?: string }
): Promise<{ return_request: Return; message: string }> {
  return apiFetch<{ return_request: Return; message: string }>(`/admin/returns/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Return status display helper
export function getReturnStatusDisplay(status: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    requested: { label: "Requested", color: "bg-yellow-500" },
    approved: { label: "Approved", color: "bg-green-500" },
    received: { label: "Received", color: "bg-blue-500" },
    refunded: { label: "Refunded", color: "bg-purple-500" },
    rejected: { label: "Rejected", color: "bg-red-500" },
    canceled: { label: "Canceled", color: "bg-gray-500" },
  };
  return config[status.toLowerCase()] || { label: status, color: "bg-gray-400" };
}

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

export interface StockLocation {
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

export interface StockLocationsResponse {
  stock_locations: StockLocation[];
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

export interface CreateStockLocationRequest {
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

// List stock locations
export async function getStockLocations(params?: {
  limit?: number;
  offset?: number;
}): Promise<StockLocationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<StockLocationsResponse>(`/admin/inventory/locations${query ? `?${query}` : ""}`);
}

// Get single stock location
export async function getStockLocation(id: string): Promise<{ stock_location: StockLocation }> {
  return apiFetch<{ stock_location: StockLocation }>(`/admin/inventory/locations/${id}`);
}

// Create stock location
export async function createStockLocation(
  data: CreateStockLocationRequest
): Promise<{ stock_location: StockLocation; message: string }> {
  return apiFetch<{ stock_location: StockLocation; message: string }>("/admin/inventory/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Delete stock location
export async function deleteStockLocation(id: string): Promise<{ message: string; id: string }> {
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
