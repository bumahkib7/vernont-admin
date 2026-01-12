// Admin API client

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const AUTH_REFRESH_ENDPOINT = "/api/v1/internal/auth/refresh";

// Token refresh state management
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let refreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Attempt to refresh the authentication token.
 * Returns true if refresh was successful, false otherwise.
 */
async function refreshAuthToken(): Promise<boolean> {
  // If already refreshing, wait for that to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch (error) {
      console.error("[API] Token refresh failed:", error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Start proactive token refresh interval.
 * Refreshes the token every 10 minutes to prevent expiration during active sessions.
 */
export function startTokenRefreshInterval(): void {
  if (refreshInterval) {
    return; // Already running
  }

  // Refresh every 10 minutes (tokens typically expire in 15-30 minutes)
  refreshInterval = setInterval(async () => {
    if (typeof window !== "undefined") {
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        console.warn("[API] Proactive token refresh failed - session may expire soon");
      }
    }
  }, 10 * 60 * 1000); // 10 minutes
}

/**
 * Stop proactive token refresh interval.
 */
export function stopTokenRefreshInterval(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Standardized API error response from backend.
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
  requestId?: string;
}

/**
 * Custom API error class that captures full error details from backend.
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;
  public readonly timestamp?: string;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>,
    requestId?: string,
    timestamp?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
    this.timestamp = timestamp;
  }

  /**
   * Get field-specific validation errors if available.
   */
  getFieldErrors(): Record<string, string> | undefined {
    if (this.details?.fields) {
      return this.details.fields as Record<string, string>;
    }
    return undefined;
  }

  /**
   * Check if this is an authentication error.
   */
  isAuthError(): boolean {
    return this.status === 401 || this.code === "UNAUTHORIZED" || this.code === "INVALID_CREDENTIALS";
  }

  /**
   * Check if this is a validation error.
   */
  isValidationError(): boolean {
    return this.code === "VALIDATION_ERROR" || this.code === "INVALID_ARGUMENT" || this.status === 400;
  }

  /**
   * Check if this is a not found error.
   */
  isNotFoundError(): boolean {
    return this.status === 404 || this.code.includes("NOT_FOUND");
  }

  /**
   * Check if this is a conflict/duplicate error.
   */
  isConflictError(): boolean {
    return this.status === 409 || this.code.includes("ALREADY_EXISTS") || this.code === "DUPLICATE_SKU";
  }
}

/**
 * Parse error response from backend.
 */
async function parseErrorResponse(response: Response): Promise<ApiError> {
  const status = response.status;

  try {
    const errorData = await response.json() as ApiErrorResponse;
    return new ApiError(
      errorData.message || `Request failed with status ${status}`,
      errorData.error || `HTTP_${status}`,
      status,
      errorData.details,
      errorData.requestId,
      errorData.timestamp
    );
  } catch {
    // JSON parsing failed, create basic error
    const message = status === 401
      ? "Authentication required"
      : status === 403
        ? "Access denied"
        : status === 404
          ? "Resource not found"
          : `Request failed with status ${status}`;

    return new ApiError(message, `HTTP_${status}`, status);
  }
}

// Generic API fetch with auth and automatic token refresh
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry: boolean = false
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
    // On 401, attempt to refresh token and retry (once)
    if (response.status === 401 && !_isRetry) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the original request
        return apiFetch<T>(endpoint, options, true);
      }
      // Refresh failed - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw await parseErrorResponse(response);
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
  trackingUrls?: string[];
  labelUrls?: string[];
  shipEngineLabelId?: string;
  carrier?: string;
  shippingCost?: string;
  message: string;
}

export interface ShipOrderRequest {
  trackingNumber?: string;
  carrier?: string;
  shippedBy?: string;
  // ShipEngine integration
  useShipEngine?: boolean;
  carrierId?: string;
  serviceCode?: string;
  packageWeight?: number;
  packageLength?: number;
  packageWidth?: number;
  packageHeight?: number;
}

export async function shipOrder(
  id: string,
  data?: ShipOrderRequest
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

// Format price helper - amounts are in pounds/dollars (major currency unit)
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

// =============================================================================
// Shipping Options API
// =============================================================================

export interface ShippingOption {
  id: string;
  name: string;
  price_type: string;
  amount: number;
  is_return: boolean;
  admin_only: boolean;
  provider_id?: string;
  region_id?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ShippingOptionsResponse {
  shipping_options: ShippingOption[];
}

// Get shipping options (uses store endpoint as it's public)
export async function getShippingOptions(): Promise<ShippingOptionsResponse> {
  return apiFetch<ShippingOptionsResponse>("/store/shipping-options");
}

// ShipEngine shipping configuration
export interface CarrierInfo {
  code: string;
  name: string;
}

export interface ShippingConfig {
  shipEngineEnabled: boolean;
  shipEngineConfigured: boolean;
  sandboxMode: boolean;
  defaultCarrierId: string;
  defaultServiceCode: string;
  availableCarriers: CarrierInfo[];
}

export async function getShippingConfig(): Promise<ShippingConfig> {
  return apiFetch<ShippingConfig>("/admin/orders/shipping/config");
}

// Draft orders API
export async function getDraftOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<OrdersResponse>(`/admin/orders/drafts${query ? `?${query}` : ""}`);
}

// =============================================================================
// Products API
// =============================================================================

export type ProductStatus =
  | "draft"
  | "pending_assets"  // Waiting for image uploads
  | "proposed"
  | "ready"           // Ready to publish
  | "published"
  | "rejected"
  | "failed"          // Creation failed
  | "archived";       // Soft deleted

export interface ProductVariantPrice {
  id: string;
  currencyCode: string;
  amount: number;
  compareAtPrice?: number;
  regionId?: string;
  minQuantity?: number;
  maxQuantity?: number;
  hasDiscount: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku?: string;
  barcode?: string;
  ean?: string;
  allowBackorder: boolean;
  manageInventory: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices: ProductVariantPrice[];
  options: Record<string, string>;
  calculatedPrice?: {
    calculatedAmount: number;
    originalAmount: number;
    currencyCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description?: string;
  image?: string;
  is_active: boolean;
  is_internal: boolean;
  position: number;
  parent_category_id?: string;
  external_id?: string;
  source?: string;
  product_count: number;
  subcategory_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CollectionProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: string;
}

export interface ProductCollection {
  id: string;
  title: string;
  handle: string;
  image_url: string | null;
  product_count: number;
  products: CollectionProduct[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProductOption {
  id: string;
  title: string;
  values: string[];
  position: number;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  description?: string;
  status: ProductStatus;
  thumbnail?: string;
  isGiftcard: boolean;
  discountable: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  originCountry?: string;
  material?: string;
  collectionId?: string;
  typeId?: string;
  brandId?: string;
  brandName?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  tags: string[];
  categories: string[];  // category names
  createdAt: string;
  updatedAt: string;
}

export interface ProductSummary {
  id: string;
  title: string;
  handle: string;
  subtitle?: string;
  status: ProductStatus;
  thumbnail?: string;
  discountable?: boolean;
  variantCount: number;
  brandName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  content: ProductSummary[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateProductVariantInput {
  title: string;
  sku?: string;
  ean?: string;
  barcode?: string;
  inventoryQuantity: number;
  manageInventory: boolean;
  allowBackorder: boolean;
  options: Record<string, string>;
  prices: { currencyCode: string; amount: number }[];
}

// Image input for product creation - matches backend ImageInput
export interface ImageInput {
  url: string;
  altText?: string;
  position?: number;
}

export interface CreateProductInput {
  title: string;
  description?: string;
  handle: string;
  status?: ProductStatus;
  shippingProfileId: string;
  images?: ImageInput[];
  thumbnail?: string;
  options?: { title: string; values: string[] }[];
  variants?: CreateProductVariantInput[];
  categoryIds?: string[];
  salesChannelIds?: string[];
}

// Get products list
export async function getProducts(params?: {
  start?: number;
  end?: number;
  q?: string;
  status?: ProductStatus;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("_start", (params?.start ?? 0).toString());
  searchParams.set("_end", (params?.end ?? 20).toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);

  return apiFetch<ProductsResponse>(`/admin/products?${searchParams.toString()}`);
}

// Get single product
export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`);
}

// Create product response (includes workflow execution ID for progress tracking)
export interface CreateProductResponse extends Product {
  executionId?: string;
}

// Create product
export async function createProduct(data: CreateProductInput): Promise<CreateProductResponse> {
  return apiFetch<CreateProductResponse>("/admin/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update product input - matches backend UpdateProductInput
export interface UpdateProductInput {
  title?: string;
  subtitle?: string;
  description?: string;
  handle?: string;
  status?: string;  // Product status: draft, published, proposed, rejected
  thumbnail?: string;
  images?: string[];
  weight?: number;
  length?: number;
  height?: number;
  width?: number;
  hsCode?: string;
  originCountry?: string;
  midCode?: string;
  material?: string;
  collectionId?: string;
  typeId?: string;
  tags?: string[];
  categories?: string[];  // category IDs
  shippingProfileId?: string;
  metadata?: Record<string, unknown>;
}

// Update product
export async function updateProduct(
  id: string,
  data: UpdateProductInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete product
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`/admin/products/${id}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Categories API (Admin)
// =============================================================================

export interface AdminCategoriesResponse {
  categories: ProductCategory[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateCategoryInput {
  name: string;
  handle?: string;
  description?: string;
  image?: string;
  is_active?: boolean;
  is_internal?: boolean;
  position?: number;
  parent_category_id?: string;
}

export async function getCategories(params?: {
  offset?: number;
  limit?: number;
  q?: string;
  is_active?: boolean;
}): Promise<AdminCategoriesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.is_active !== undefined) searchParams.set("is_active", params.is_active.toString());

  const query = searchParams.toString();
  return apiFetch<AdminCategoriesResponse>(`/admin/categories${query ? `?${query}` : ""}`);
}

export async function createCategory(data: CreateCategoryInput): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: string,
  data: Partial<CreateCategoryInput>
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(`/admin/categories/${id}`, {
    method: "DELETE",
  });
}

export async function getCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}`);
}

export async function activateCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}/activate`, {
    method: "POST",
  });
}

export async function deactivateCategory(id: string): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(`/admin/categories/${id}/deactivate`, {
    method: "POST",
  });
}

export interface CategoryProductItem {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  status: string;
}

export interface CategoryProductsResponse {
  products: CategoryProductItem[];
  count: number;
  offset: number;
  limit: number;
}

export async function getCategoryProducts(
  categoryId: string,
  params?: { offset?: number; limit?: number }
): Promise<CategoryProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<CategoryProductsResponse>(
    `/admin/categories/${categoryId}/products${query ? `?${query}` : ""}`
  );
}

export async function addProductsToCategory(
  categoryId: string,
  productIds: string[]
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${categoryId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ add: productIds }),
    }
  );
}

export async function removeProductsFromCategory(
  categoryId: string,
  productIds: string[]
): Promise<{ category: ProductCategory }> {
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${categoryId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ remove: productIds }),
    }
  );
}

export async function moveProductToCategory(
  targetCategoryId: string,
  productId: string,
  fromCategoryId?: string
): Promise<{ category: ProductCategory }> {
  const params = fromCategoryId ? `?from_category_id=${fromCategoryId}` : "";
  return apiFetch<{ category: ProductCategory }>(
    `/admin/categories/${targetCategoryId}/products/${productId}/move${params}`,
    {
      method: "POST",
    }
  );
}

// =============================================================================
// Collections API (Admin)
// =============================================================================

export interface AdminCollectionsResponse {
  collections: ProductCollection[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateCollectionInput {
  title: string;
  handle?: string;
  metadata?: Record<string, unknown>;
}

export async function getCollections(params?: {
  offset?: number;
  limit?: number;
}): Promise<AdminCollectionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<AdminCollectionsResponse>(`/admin/collections${query ? `?${query}` : ""}`);
}

export async function createCollection(data: CreateCollectionInput): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>("/admin/collections", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCollection(
  id: string,
  data: Partial<CreateCollectionInput>
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCollection(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/collections/${id}`, {
    method: "DELETE",
  });
}

export async function getCollection(id: string): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}`);
}

export async function publishCollection(id: string): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(`/admin/collections/${id}/publish`, {
    method: "POST",
  });
}

export interface CollectionUploadResponse {
  url: string;
  key: string;
  collectionId?: string;
  savedToCollection: boolean;
}

export async function uploadCollectionImage(
  file: File,
  collectionId?: string
): Promise<CollectionUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (collectionId) {
    formData.append("collectionId", collectionId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/collection-image`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function addProductsToCollection(
  collectionId: string,
  productIds: string[]
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(
    `/admin/collections/${collectionId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ add: productIds }),
    }
  );
}

export async function removeProductsFromCollection(
  collectionId: string,
  productIds: string[]
): Promise<{ collection: ProductCollection }> {
  return apiFetch<{ collection: ProductCollection }>(
    `/admin/collections/${collectionId}/products`,
    {
      method: "POST",
      body: JSON.stringify({ remove: productIds }),
    }
  );
}

// Collection type alias for convenience
export type Collection = ProductCollection;
export type CollectionResponse = { collection: ProductCollection };
export type CollectionsResponse = AdminCollectionsResponse;

// =============================================================================
// Variants API
// =============================================================================

export interface CreateVariantInput {
  title: string;
  sku?: string;
  barcode?: string;
  allowBackorder?: boolean;
  manageInventory?: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices?: { currencyCode: string; amount: number; compareAtPrice?: number }[];
  options?: Record<string, string>;
}

export interface UpdateVariantInput {
  title?: string;
  sku?: string;
  barcode?: string;
  allowBackorder?: boolean;
  manageInventory?: boolean;
  weight?: string;
  length?: string;
  height?: string;
  width?: string;
  prices?: { currencyCode: string; amount: number; compareAtPrice?: number }[];
}

// Create variant for a product
export async function createVariant(
  productId: string,
  data: CreateVariantInput
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/variants?productId=${productId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update variant
export async function updateVariant(
  variantId: string,
  data: UpdateVariantInput
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/admin/variants/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete variant
export async function deleteVariant(variantId: string): Promise<void> {
  await apiFetch<void>(`/admin/variants/${variantId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Options API
// =============================================================================

export interface CreateOptionInput {
  title: string;
  values: string[];
  position?: number;
}

export interface UpdateOptionInput {
  title?: string;
  values?: string[];
  position?: number;
}

// Add option to product
export async function addOption(
  productId: string,
  data: CreateOptionInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update option
export async function updateOption(
  productId: string,
  optionId: string,
  data: UpdateOptionInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options/${optionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete option
export async function deleteOption(
  productId: string,
  optionId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/options/${optionId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Product Images API
// =============================================================================

export interface UploadImageResponse {
  url: string;
  key: string;
  productId?: string;
  savedToProduct: boolean;
}

export interface AddProductImageInput {
  url: string;
  altText?: string;
  position?: number;
}

// Upload image to storage (MinIO/S3)
export async function uploadProductImage(
  file: File,
  productId?: string,
  _isRetry: boolean = false
): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (productId) {
    formData.append("productId", productId);
  }

  const response = await fetch(`${API_BASE_URL}/admin/uploads/product-image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    // On 401, attempt to refresh token and retry (once)
    if (response.status === 401 && !_isRetry) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry the upload
        return uploadProductImage(file, productId, true);
      }
      // Refresh failed - redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const error = await response.text();
    throw new Error(error || "Failed to upload image");
  }

  return response.json();
}

// Add image to product (after uploading to storage)
export async function addProductImage(
  productId: string,
  data: AddProductImageInput
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Delete image from product
export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

// Update image (position, alt text)
export async function updateProductImage(
  productId: string,
  imageId: string,
  data: Partial<AddProductImageInput>
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/${imageId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Reorder product images - first image becomes thumbnail
export async function reorderProductImages(
  productId: string,
  imageIds: string[]
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/images/reorder`, {
    method: "POST",
    body: JSON.stringify({ imageIds }),
  });
}

// Set product thumbnail by image ID
export async function setProductThumbnail(
  productId: string,
  imageId: string
): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${productId}/thumbnail`, {
    method: "PUT",
    body: JSON.stringify({ imageId }),
  });
}

// =============================================================================
// SKU & Barcode Utilities
// =============================================================================
// Note: SKU and EAN-13 barcode generation is handled by the backend
// (SkuGeneratorService) to ensure uniqueness and proper numeric format

// Validate EAN-13 barcode
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[12], 10);
}

// =============================================================================
// Customers API
// =============================================================================

export type CustomerTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type CustomerActivityType =
  | "ORDER_PLACED"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_CREATED"
  | "TIER_CHANGED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_ACTIVATED"
  | "ACCOUNT_BANNED"
  | "EMAIL_SENT"
  | "GIFT_CARD_SENT"
  | "PROFILE_UPDATED"
  | "ADDRESS_ADDED"
  | "ADDRESS_UPDATED"
  | "ADDRESS_DELETED"
  | "GROUP_ADDED"
  | "GROUP_REMOVED"
  | "WISHLIST_ITEM_ADDED"
  | "WISHLIST_ITEM_REMOVED"
  | "NOTE_ADDED"
  | "LOGIN"
  | "LOGOUT";

export interface CustomerAddress {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  isDefault: boolean;
}

export interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  activityType: CustomerActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  performedBy?: string;
  occurredAt: string;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  hasAccount: boolean;
  tier: CustomerTier;
  tierOverride: boolean;
  totalSpent: number;
  orderCount: number;
  status: CustomerStatus;
  suspendedAt?: string;
  suspendedReason?: string;
  lastLoginAt?: string;
  lastOrderAt?: string;
  internalNotes?: string;
  addresses: CustomerAddress[];
  groups: CustomerGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tier: CustomerTier;
  totalSpent: number;
  orderCount: number;
  status: CustomerStatus;
  hasAccount: boolean;
  createdAt: string;
}

export interface CustomersResponse {
  customers: CustomerSummary[];
  count: number;
  offset: number;
  limit: number;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  customersWithAccounts: number;
  customersByTier: Record<CustomerTier, number>;
  newCustomersThisMonth: number;
  totalRevenue: number;
}

// Customer CRUD
export async function getCustomers(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  tier?: CustomerTier;
  status?: CustomerStatus;
  groupId?: string;
}): Promise<CustomersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.tier) searchParams.set("tier", params.tier);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.groupId) searchParams.set("groupId", params.groupId);

  const query = searchParams.toString();
  return apiFetch<CustomersResponse>(`/admin/customers${query ? `?${query}` : ""}`);
}

export async function getCustomer(id: string): Promise<{ customer: Customer }> {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${id}`);
}

export interface CreateCustomerRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  tier?: CustomerTier;
  groupIds?: string[];
}

export async function createCustomer(data: CreateCustomerRequest): Promise<{ customer: Customer }> {
  return apiFetch<{ customer: Customer }>("/admin/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateCustomerRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  internalNotes?: string;
}

export async function updateCustomer(
  id: string,
  data: UpdateCustomerRequest
): Promise<{ customer: Customer }> {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomer(id: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/customers/${id}`, {
    method: "DELETE",
  });
}

// Customer orders
export async function getCustomerOrders(
  customerId: string,
  params?: { limit?: number; offset?: number }
): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<OrdersResponse>(`/admin/customers/${customerId}/orders${query ? `?${query}` : ""}`);
}

// Customer activity
export interface CustomerActivityResponse {
  activities: CustomerActivity[];
  count: number;
  offset: number;
  limit: number;
}

export async function getCustomerActivity(
  customerId: string,
  params?: { limit?: number; offset?: number }
): Promise<CustomerActivityResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<CustomerActivityResponse>(
    `/admin/customers/${customerId}/activity${query ? `?${query}` : ""}`
  );
}

// Customer actions
export interface SendEmailRequest {
  subject: string;
  body: string;
}

export async function sendCustomerEmail(
  customerId: string,
  data: SendEmailRequest
): Promise<{ success: boolean; messageId?: string }> {
  return apiFetch<{ success: boolean; messageId?: string }>(
    `/admin/customers/${customerId}/send-email`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export interface SendGiftCardRequest {
  amount: number; // In cents
  currencyCode?: string;
  message?: string;
  expiresInDays?: number;
}

export async function sendGiftCard(
  customerId: string,
  data: SendGiftCardRequest
): Promise<{ giftCardId: string; giftCardCode: string; amount: number; emailSent: boolean }> {
  return apiFetch<{ giftCardId: string; giftCardCode: string; amount: number; emailSent: boolean }>(
    `/admin/customers/${customerId}/send-gift-card`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export interface ChangeTierRequest {
  tier: CustomerTier;
  reason?: string;
}

export async function changeCustomerTier(
  customerId: string,
  data: ChangeTierRequest
): Promise<{ success: boolean; previousTier: CustomerTier; newTier: CustomerTier }> {
  return apiFetch<{ success: boolean; previousTier: CustomerTier; newTier: CustomerTier }>(
    `/admin/customers/${customerId}/change-tier`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export interface SuspendCustomerRequest {
  reason: string;
}

export async function suspendCustomer(
  customerId: string,
  data: SuspendCustomerRequest
): Promise<{ success: boolean; suspendedAt: string }> {
  return apiFetch<{ success: boolean; suspendedAt: string }>(
    `/admin/customers/${customerId}/suspend`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function activateCustomer(
  customerId: string
): Promise<{ success: boolean; activatedAt: string }> {
  return apiFetch<{ success: boolean; activatedAt: string }>(
    `/admin/customers/${customerId}/activate`,
    {
      method: "POST",
    }
  );
}

export async function resetCustomerPassword(
  customerId: string
): Promise<{ success: boolean; resetTokenSent: boolean }> {
  return apiFetch<{ success: boolean; resetTokenSent: boolean }>(
    `/admin/customers/${customerId}/reset-password`,
    {
      method: "POST",
    }
  );
}

// Customer stats
export async function getCustomerStats(): Promise<CustomerStats> {
  return apiFetch<CustomerStats>("/admin/customers/stats");
}

// Customer groups
export interface CustomerGroupsResponse {
  groups: CustomerGroup[];
  count: number;
  offset: number;
  limit: number;
}

export async function getCustomerGroups(params?: {
  limit?: number;
  offset?: number;
}): Promise<CustomerGroupsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<CustomerGroupsResponse>(`/admin/customers/groups${query ? `?${query}` : ""}`);
}

export interface CreateCustomerGroupRequest {
  name: string;
  description?: string;
}

export async function createCustomerGroup(
  data: CreateCustomerGroupRequest
): Promise<{ group: CustomerGroup }> {
  return apiFetch<{ group: CustomerGroup }>("/admin/customers/groups", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomerGroup(
  groupId: string,
  data: Partial<CreateCustomerGroupRequest>
): Promise<{ group: CustomerGroup }> {
  return apiFetch<{ group: CustomerGroup }>(`/admin/customers/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomerGroup(groupId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/admin/customers/groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function addCustomerToGroup(
  customerId: string,
  groupId: string
): Promise<{ customer: Customer }> {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${customerId}/groups/${groupId}`, {
    method: "POST",
  });
}

export async function removeCustomerFromGroup(
  customerId: string,
  groupId: string
): Promise<{ customer: Customer }> {
  return apiFetch<{ customer: Customer }>(`/admin/customers/${customerId}/groups/${groupId}`, {
    method: "DELETE",
  });
}

// Customer display helpers
export function getTierDisplay(tier: CustomerTier): { label: string; color: string } {
  const config: Record<CustomerTier, { label: string; color: string }> = {
    BRONZE: { label: "Bronze", color: "bg-orange-100 text-orange-800" },
    SILVER: { label: "Silver", color: "bg-gray-100 text-gray-800" },
    GOLD: { label: "Gold", color: "bg-yellow-100 text-yellow-800" },
    PLATINUM: { label: "Platinum", color: "bg-purple-100 text-purple-800" },
  };
  return config[tier] || { label: tier, color: "bg-gray-100 text-gray-800" };
}

export function getCustomerStatusDisplay(status: CustomerStatus): { label: string; color: string } {
  const config: Record<CustomerStatus, { label: string; color: string }> = {
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
    SUSPENDED: { label: "Suspended", color: "bg-yellow-100 text-yellow-800" },
    BANNED: { label: "Banned", color: "bg-red-100 text-red-800" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

export function getActivityTypeDisplay(type: CustomerActivityType): { label: string; icon: string } {
  const config: Record<CustomerActivityType, { label: string; icon: string }> = {
    ORDER_PLACED: { label: "Order Placed", icon: "shopping-cart" },
    ORDER_COMPLETED: { label: "Order Completed", icon: "check-circle" },
    ORDER_CANCELED: { label: "Order Canceled", icon: "x-circle" },
    PASSWORD_RESET_REQUESTED: { label: "Password Reset Requested", icon: "key" },
    PASSWORD_CHANGED: { label: "Password Changed", icon: "lock" },
    ACCOUNT_CREATED: { label: "Account Created", icon: "user-plus" },
    TIER_CHANGED: { label: "Tier Changed", icon: "star" },
    ACCOUNT_SUSPENDED: { label: "Account Suspended", icon: "ban" },
    ACCOUNT_ACTIVATED: { label: "Account Activated", icon: "check" },
    ACCOUNT_BANNED: { label: "Account Banned", icon: "x" },
    EMAIL_SENT: { label: "Email Sent", icon: "mail" },
    GIFT_CARD_SENT: { label: "Gift Card Sent", icon: "gift" },
    PROFILE_UPDATED: { label: "Profile Updated", icon: "edit" },
    ADDRESS_ADDED: { label: "Address Added", icon: "map-pin" },
    ADDRESS_UPDATED: { label: "Address Updated", icon: "map-pin" },
    ADDRESS_DELETED: { label: "Address Deleted", icon: "trash" },
    GROUP_ADDED: { label: "Added to Group", icon: "users" },
    GROUP_REMOVED: { label: "Removed from Group", icon: "user-minus" },
    WISHLIST_ITEM_ADDED: { label: "Added to Wishlist", icon: "heart" },
    WISHLIST_ITEM_REMOVED: { label: "Removed from Wishlist", icon: "heart-off" },
    NOTE_ADDED: { label: "Note Added", icon: "file-text" },
    LOGIN: { label: "Login", icon: "log-in" },
    LOGOUT: { label: "Logout", icon: "log-out" },
  };
  return config[type] || { label: type, icon: "activity" };
}

export function getCustomerName(customer: { firstName?: string; lastName?: string; email: string }): string {
  if (customer.firstName || customer.lastName) {
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
  }
  return customer.email;
}

export function getCustomerInitials(customer: { firstName?: string; lastName?: string; email: string }): string {
  if (customer.firstName && customer.lastName) {
    return `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
  }
  if (customer.firstName) {
    return customer.firstName.substring(0, 2).toUpperCase();
  }
  return customer.email.substring(0, 2).toUpperCase();
}

// =============================================================================
// Pricing API
// =============================================================================

export type AdjustmentType = "PERCENTAGE" | "FIXED_AMOUNT" | "SET_PRICE";
export type RoundingStrategy = "NONE" | "ROUND_TO_99" | "ROUND_TO_95" | "ROUND_TO_NEAREST_POUND" | "ROUND_TO_NEAREST_50P";
export type PricingRuleType = "PERCENTAGE_DISCOUNT" | "FIXED_DISCOUNT" | "MARKUP" | "TIME_BASED" | "QUANTITY_BASED" | "TIERED";
export type PricingRuleStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";

export interface WorkbenchItem {
  variantId: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku?: string;
  barcode?: string;
  thumbnail?: string;
  currentPrice: number; // In cents
  compareAtPrice?: number;
  currencyCode: string;
  costPrice?: number;
  margin?: number;
  marginPercentage?: number;
  inventory?: number;
  lastUpdated?: string;
  lastUpdatedBy?: string;
}

export interface WorkbenchStats {
  totalVariants: number;
  variantsWithDiscount: number;
  averageMargin?: number;
  activeRules: number;
}

export interface WorkbenchResponse {
  items: WorkbenchItem[];
  count: number;
  offset: number;
  limit: number;
  stats: WorkbenchStats;
}

export interface PriceUpdate {
  variantId: string;
  amount: number; // In cents
  compareAtPrice?: number;
}

export interface BulkPriceUpdateRequest {
  updates: PriceUpdate[];
}

export interface BulkUpdateError {
  variantId: string;
  message: string;
}

export interface PriceChangeLogDto {
  id: string;
  variantId: string;
  productId: string;
  productTitle?: string;
  variantTitle?: string;
  sku?: string;
  previousPrice?: number;
  newPrice: number;
  priceDifference: number;
  percentageChange?: number;
  currencyCode: string;
  changeType: string;
  changeTypeDisplay: string;
  changeSource?: string;
  ruleId?: string;
  ruleName?: string;
  changedBy?: string;
  changedByName?: string;
  changedAt: string;
}

export interface BulkPriceUpdateResult {
  successCount: number;
  failureCount: number;
  errors: BulkUpdateError[];
  changes: PriceChangeLogDto[];
}

export interface SimulatedPriceChange {
  variantId: string;
  productTitle: string;
  variantTitle: string;
  currentPrice: number;
  newPrice: number;
  priceDifference: number;
  percentageChange: number;
}

export interface SimulationSummary {
  totalVariants: number;
  totalCurrentValue: number;
  totalNewValue: number;
  averageChange: number;
  maxIncrease?: SimulatedPriceChange;
  maxDecrease?: SimulatedPriceChange;
}

export interface PriceSimulationRequest {
  variantIds: string[];
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  roundingStrategy?: RoundingStrategy;
}

export interface PriceSimulationResult {
  simulations: SimulatedPriceChange[];
  summary: SimulationSummary;
}

export interface PricingRuleDto {
  id: string;
  name: string;
  description?: string;
  type: string;
  typeDisplay: string;
  status: string;
  statusDisplay: string;
  priority: number;
  config: Record<string, unknown>;
  targetType?: string;
  targetTypeDisplay?: string;
  targetIds: string[];
  targetCount: number;
  startAt?: string;
  endAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface PricingRulesResponse {
  rules: PricingRuleDto[];
  count: number;
}

export interface PricingRuleResponse {
  rule: PricingRuleDto;
}

export interface CreatePricingRuleRequest {
  name: string;
  description?: string;
  type: string;
  config: Record<string, unknown>;
  targetType?: string;
  targetIds?: string[];
  startAt?: string;
  endAt?: string;
  priority?: number;
  activateImmediately?: boolean;
}

export interface UpdatePricingRuleRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  targetType?: string;
  targetIds?: string[];
  startAt?: string;
  endAt?: string;
  priority?: number;
}

export interface PriceHistoryResponse {
  changes: PriceChangeLogDto[];
  count: number;
  offset: number;
  limit: number;
}

export interface PricingActivityItem {
  id: string;
  type: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  actor?: string;
}

export interface PricingActivityResponse {
  activities: PricingActivityItem[];
  count: number;
}

// Get pricing workbench data
export async function getPricingWorkbench(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  categoryId?: string;
  hasDiscount?: boolean;
}): Promise<WorkbenchResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.hasDiscount !== undefined) searchParams.set("hasDiscount", params.hasDiscount.toString());

  const query = searchParams.toString();
  return apiFetch<WorkbenchResponse>(`/admin/pricing/workbench${query ? `?${query}` : ""}`);
}

// Bulk update prices
export async function bulkUpdatePrices(request: BulkPriceUpdateRequest): Promise<BulkPriceUpdateResult> {
  return apiFetch<BulkPriceUpdateResult>("/admin/pricing/bulk-update", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Preview bulk update (dry run)
export async function previewBulkUpdate(request: BulkPriceUpdateRequest): Promise<SimulatedPriceChange[]> {
  return apiFetch<SimulatedPriceChange[]>("/admin/pricing/bulk-update/preview", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Simulate price changes
export async function simulatePriceChanges(request: PriceSimulationRequest): Promise<PriceSimulationResult> {
  return apiFetch<PriceSimulationResult>("/admin/pricing/simulate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Get pricing rules
export async function getPricingRules(params?: {
  status?: string;
  type?: string;
}): Promise<PricingRulesResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);

  const query = searchParams.toString();
  return apiFetch<PricingRulesResponse>(`/admin/pricing/rules${query ? `?${query}` : ""}`);
}

// Get single pricing rule
export async function getPricingRule(id: string): Promise<PricingRuleResponse> {
  return apiFetch<PricingRuleResponse>(`/admin/pricing/rules/${id}`);
}

// Create pricing rule
export async function createPricingRule(data: CreatePricingRuleRequest): Promise<PricingRuleResponse> {
  return apiFetch<PricingRuleResponse>("/admin/pricing/rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update pricing rule
export async function updatePricingRule(id: string, data: UpdatePricingRuleRequest): Promise<PricingRuleResponse> {
  return apiFetch<PricingRuleResponse>(`/admin/pricing/rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete pricing rule
export async function deletePricingRule(id: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/admin/pricing/rules/${id}`, {
    method: "DELETE",
  });
}

// Activate pricing rule
export async function activatePricingRule(id: string): Promise<PricingRuleResponse> {
  return apiFetch<PricingRuleResponse>(`/admin/pricing/rules/${id}/activate`, {
    method: "POST",
  });
}

// Deactivate pricing rule
export async function deactivatePricingRule(id: string): Promise<PricingRuleResponse> {
  return apiFetch<PricingRuleResponse>(`/admin/pricing/rules/${id}/deactivate`, {
    method: "POST",
  });
}

// Get price change history
export async function getPriceHistory(params?: {
  limit?: number;
  offset?: number;
  variantId?: string;
  changeType?: string;
}): Promise<PriceHistoryResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.variantId) searchParams.set("variantId", params.variantId);
  if (params?.changeType) searchParams.set("changeType", params.changeType);

  const query = searchParams.toString();
  return apiFetch<PriceHistoryResponse>(`/admin/pricing/history${query ? `?${query}` : ""}`);
}

// Get pricing activity feed
export async function getPricingActivity(params?: {
  limit?: number;
}): Promise<PricingActivityResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<PricingActivityResponse>(`/admin/pricing/activity${query ? `?${query}` : ""}`);
}

// Pricing display helpers
export function getPricingRuleTypeDisplay(type: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    PERCENTAGE_DISCOUNT: { label: "Percentage Discount", color: "bg-green-100 text-green-800" },
    FIXED_DISCOUNT: { label: "Fixed Discount", color: "bg-blue-100 text-blue-800" },
    MARKUP: { label: "Markup", color: "bg-orange-100 text-orange-800" },
    TIME_BASED: { label: "Time-Based", color: "bg-purple-100 text-purple-800" },
    QUANTITY_BASED: { label: "Quantity-Based", color: "bg-yellow-100 text-yellow-800" },
    TIERED: { label: "Tiered", color: "bg-indigo-100 text-indigo-800" },
  };
  return config[type] || { label: type, color: "bg-gray-100 text-gray-800" };
}

export function getPricingRuleStatusDisplay(status: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
    INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
    SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

export function getPriceChangeTypeDisplay(type: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    MANUAL: { label: "Manual", color: "text-gray-600" },
    BULK_UPDATE: { label: "Bulk Update", color: "text-blue-600" },
    RULE_APPLIED: { label: "Rule Applied", color: "text-purple-600" },
    SYNC_FROM_SHOPIFY: { label: "Shopify Sync", color: "text-green-600" },
    SYNC_FROM_WOOCOMMERCE: { label: "WooCommerce Sync", color: "text-orange-600" },
  };
  return config[type] || { label: type, color: "text-gray-600" };
}

// =============================================================================
// Discounts API
// =============================================================================

export type PromotionType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING" | "BUY_X_GET_Y";
export type PromotionStatus = "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED" | "DISABLED" | "LIMIT_REACHED" | "DELETED";
export type PromotionRuleType = "MIN_SUBTOTAL" | "MIN_QUANTITY" | "PRODUCT_IDS" | "PRODUCT_COLLECTIONS" | "PRODUCT_TYPES" | "PRODUCT_TAGS" | "CUSTOMER_GROUPS";

export interface Promotion {
  id: string;
  name?: string;
  code: string;
  type: PromotionType;
  value: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  usageCount: number;
  usageLimit?: number;
  customerUsageLimit: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  isStackable: boolean;
  priority: number;
  isActive: boolean;
  isDisabled: boolean;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountValue?: number;
  rules: PromotionRuleDto[];
  stats?: PromotionStats;
  status: PromotionStatus;
  redemptionCount?: number;
  totalDiscountGiven?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PromotionRuleDto {
  id: string;
  type: PromotionRuleType;
  value?: string;
  description?: string;
  attribute?: string;
  operator?: string;
}

export interface PromotionStats {
  redemptionCount: number;
  totalDiscountGiven: number;
  averageOrderValue?: number;
  redemptionsToday: number;
  redemptionsThisWeek: number;
}

export interface PromotionsListResponse {
  items: Promotion[];
  count: number;
  offset: number;
  limit: number;
}

export interface PromotionResponse {
  promotion: Promotion;
}

export interface DiscountStatsResponse {
  totalPromotions: number;
  activePromotions: number;
  scheduledPromotions: number;
  expiredPromotions: number;
  disabledPromotions: number;
  totalRedemptions: number;
  totalDiscountGiven: number;
  redemptionsToday: number;
  redemptionsThisWeek: number;
  topPerformingCodes: TopPerformingCode[];
}

export interface TopPerformingCode {
  promotionId: string;
  code: string;
  redemptionCount: number;
  totalDiscount: number;
}

export interface CreatePromotionRequest {
  name?: string;
  code: string;
  type: PromotionType;
  value: number;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  customerUsageLimit?: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  isStackable?: boolean;
  priority?: number;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountValue?: number;
  rules?: CreatePromotionRuleRequest[];
  activateImmediately?: boolean;
}

export interface CreatePromotionRuleRequest {
  type: PromotionRuleType;
  value?: string;
  description?: string;
  attribute?: string;
  operator?: string;
}

export interface UpdatePromotionRequest {
  name?: string;
  description?: string;
  value?: number;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  customerUsageLimit?: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  isStackable?: boolean;
  priority?: number;
  buyQuantity?: number;
  getQuantity?: number;
  getDiscountValue?: number;
  rules?: CreatePromotionRuleRequest[];
}

export interface BulkDiscountRequest {
  ids: string[];
  action: "ACTIVATE" | "DEACTIVATE" | "DELETE";
}

export interface BulkDiscountResult {
  successCount: number;
  failureCount: number;
  errors: { promotionId: string; message: string }[];
}

export interface DiscountRedemption {
  id: string;
  promotionId: string;
  promotionCode: string;
  customerId?: string;
  orderId?: string;
  discountAmount: number;
  orderSubtotal?: number;
  redeemedAt: string;
}

export interface RedemptionsResponse {
  items: DiscountRedemption[];
  count: number;
  offset: number;
  limit: number;
}

export interface DiscountActivityItem {
  id: string;
  promotionId?: string;
  promotionCode?: string;
  activityType: string;
  description?: string;
  actorId?: string;
  actorName?: string;
  timestamp: string;
}

export interface DiscountActivityResponse {
  items: DiscountActivityItem[];
  count: number;
}

// List all promotions/discounts
export async function getDiscounts(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
  type?: string;
}): Promise<PromotionsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.type) searchParams.set("type", params.type);

  const query = searchParams.toString();
  return apiFetch<PromotionsListResponse>(`/admin/discounts${query ? `?${query}` : ""}`);
}

// Get single promotion/discount
export async function getDiscount(id: string): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>(`/admin/discounts/${id}`);
}

// Create promotion/discount
export async function createDiscount(data: CreatePromotionRequest): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>("/admin/discounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update promotion/discount
export async function updateDiscount(id: string, data: UpdatePromotionRequest): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>(`/admin/discounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete promotion/discount
export async function deleteDiscount(id: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/admin/discounts/${id}`, {
    method: "DELETE",
  });
}

// Activate promotion
export async function activateDiscount(id: string): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>(`/admin/discounts/${id}/activate`, {
    method: "POST",
  });
}

// Deactivate promotion
export async function deactivateDiscount(id: string): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>(`/admin/discounts/${id}/deactivate`, {
    method: "POST",
  });
}

// Bulk operations on promotions
export async function bulkDiscountAction(request: BulkDiscountRequest): Promise<BulkDiscountResult> {
  return apiFetch<BulkDiscountResult>("/admin/discounts/bulk", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// Duplicate promotion
export async function duplicateDiscount(id: string): Promise<PromotionResponse> {
  return apiFetch<PromotionResponse>(`/admin/discounts/${id}/duplicate`, {
    method: "POST",
  });
}

// Get discount statistics
export async function getDiscountStats(): Promise<DiscountStatsResponse> {
  return apiFetch<DiscountStatsResponse>("/admin/discounts/stats");
}

// Get redemption history for a promotion
export async function getDiscountRedemptions(
  id: string,
  params?: { limit?: number; offset?: number }
): Promise<RedemptionsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<RedemptionsResponse>(`/admin/discounts/${id}/redemptions${query ? `?${query}` : ""}`);
}

// Get discount activity feed
export async function getDiscountActivity(params?: { limit?: number }): Promise<DiscountActivityResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  return apiFetch<DiscountActivityResponse>(`/admin/discounts/activity${query ? `?${query}` : ""}`);
}

// Generate unique discount code
export async function generateDiscountCode(): Promise<{ code: string }> {
  return apiFetch<{ code: string }>("/admin/discounts/generate-code", {
    method: "POST",
  });
}

// Discount display helpers
export function getPromotionTypeDisplay(type: string): { label: string; color: string; icon: string } {
  const config: Record<string, { label: string; color: string; icon: string }> = {
    PERCENTAGE: { label: "Percentage Off", color: "bg-green-100 text-green-800", icon: "%" },
    FIXED: { label: "Fixed Amount", color: "bg-blue-100 text-blue-800", icon: "£" },
    FREE_SHIPPING: { label: "Free Shipping", color: "bg-purple-100 text-purple-800", icon: "🚚" },
    BUY_X_GET_Y: { label: "Buy X Get Y", color: "bg-orange-100 text-orange-800", icon: "🎁" },
  };
  return config[type] || { label: type, color: "bg-gray-100 text-gray-800", icon: "?" };
}

export function getPromotionStatusDisplay(status: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
    INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-800" },
    SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800" },
    DISABLED: { label: "Disabled", color: "bg-yellow-100 text-yellow-800" },
    LIMIT_REACHED: { label: "Limit Reached", color: "bg-orange-100 text-orange-800" },
    DELETED: { label: "Deleted", color: "bg-red-100 text-red-800" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

export function getPromotionRuleTypeDisplay(type: string): string {
  const config: Record<string, string> = {
    MIN_SUBTOTAL: "Minimum Order Amount",
    MIN_QUANTITY: "Minimum Quantity",
    PRODUCT_IDS: "Specific Products",
    PRODUCT_COLLECTIONS: "Collections",
    PRODUCT_TYPES: "Product Types",
    PRODUCT_TAGS: "Product Tags",
    CUSTOMER_GROUPS: "Customer Groups",
  };
  return config[type] || type;
}

export function formatDiscountValue(type: PromotionType, value: number): string {
  switch (type) {
    case "PERCENTAGE":
      return `${value}% off`;
    case "FIXED":
      return `£${value.toFixed(2)} off`;
    case "FREE_SHIPPING":
      return "Free Shipping";
    case "BUY_X_GET_Y":
      return `BOGO Deal`;
    default:
      return `${value}`;
  }
}

// ============================================================================
// Gift Cards API
// ============================================================================

export type GiftCardStatus = "ACTIVE" | "FULLY_REDEEMED" | "EXPIRED" | "DISABLED";

export interface GiftCard {
  id: string;
  code: string;
  status: GiftCardStatus;
  statusDisplay: string;
  initialAmount: number;
  remainingAmount: number;
  formattedInitialAmount: string;
  formattedBalance: string;
  currencyCode: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  expiresAt?: string;
  isExpired: boolean;
  canRedeem: boolean;
  issuedToCustomerId?: string;
  issuedByUserId?: string;
  redeemedByCustomerId?: string;
  firstRedeemedAt?: string;
  fullyRedeemedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GiftCardListItem {
  id: string;
  code: string;
  status: GiftCardStatus;
  statusDisplay: string;
  initialAmount: number;
  remainingAmount: number;
  formattedInitialAmount: string;
  formattedBalance: string;
  currencyCode: string;
  recipientName?: string;
  recipientEmail?: string;
  expiresAt?: string;
  isExpired: boolean;
  canRedeem: boolean;
  createdAt?: string;
}

export interface GiftCardsResponse {
  items: GiftCardListItem[];
  count: number;
  offset: number;
  limit: number;
}

export interface GiftCardResponse {
  giftCard: GiftCard;
}

export interface CreateGiftCardRequest {
  amount: number;
  currencyCode?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  expiresInDays?: number;
  sendEmail?: boolean;
}

export interface UpdateGiftCardRequest {
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  expiresAt?: string;
}

export interface AdjustBalanceRequest {
  amount: number;
  reason?: string;
}

export interface GiftCardStatsResponse {
  totalGiftCards: number;
  activeGiftCards: number;
  fullyRedeemedGiftCards: number;
  expiredGiftCards: number;
  disabledGiftCards: number;
  totalIssuedValue: number;
  totalRemainingValue: number;
  totalRedeemedValue: number;
  formattedIssuedValue: string;
  formattedRemainingValue: string;
  formattedRedeemedValue: string;
  expiringThisWeek: number;
  issuedThisWeek: number;
}

export interface BulkGiftCardRequest {
  ids: string[];
  action: "DISABLE" | "ENABLE" | "DELETE";
}

export interface BulkGiftCardResult {
  successCount: number;
  failureCount: number;
  errors: { giftCardId: string; error: string }[];
}

// Gift card API functions
export async function getGiftCards(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: GiftCardStatus;
}): Promise<GiftCardsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return apiFetch<GiftCardsResponse>(`/admin/gift-cards${query ? `?${query}` : ""}`);
}

export async function getGiftCard(id: string): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/${id}`);
}

export async function lookupGiftCard(code: string): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/lookup?code=${encodeURIComponent(code)}`);
}

export async function createGiftCard(data: CreateGiftCardRequest): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>("/admin/gift-cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGiftCard(id: string, data: UpdateGiftCardRequest): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adjustGiftCardBalance(id: string, data: AdjustBalanceRequest): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/${id}/adjust-balance`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function disableGiftCard(id: string): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/${id}/disable`, {
    method: "POST",
  });
}

export async function enableGiftCard(id: string): Promise<GiftCardResponse> {
  return apiFetch<GiftCardResponse>(`/admin/gift-cards/${id}/enable`, {
    method: "POST",
  });
}

export async function deleteGiftCard(id: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/admin/gift-cards/${id}`, {
    method: "DELETE",
  });
}

export async function bulkGiftCardAction(request: BulkGiftCardRequest): Promise<BulkGiftCardResult> {
  return apiFetch<BulkGiftCardResult>("/admin/gift-cards/bulk", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getGiftCardStats(): Promise<GiftCardStatsResponse> {
  return apiFetch<GiftCardStatsResponse>("/admin/gift-cards/stats");
}

// Gift card display helpers
export function getGiftCardStatusDisplay(status: GiftCardStatus): { label: string; color: string } {
  const config: Record<GiftCardStatus, { label: string; color: string }> = {
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
    FULLY_REDEEMED: { label: "Fully Redeemed", color: "bg-blue-100 text-blue-800" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800" },
    DISABLED: { label: "Disabled", color: "bg-gray-100 text-gray-800" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

// ============================================================================
// Store Settings API
// ============================================================================

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
  linkedin?: string;
}

export interface StorePolicies {
  returnPolicyUrl?: string;
  returnPolicySummary?: string;
  shippingPolicyUrl?: string;
  shippingPolicySummary?: string;
  termsAndConditionsUrl?: string;
  privacyPolicyUrl?: string;
  cookiePolicyUrl?: string;
  refundPolicyUrl?: string;
  returnWindowDays: number;
  exchangeWindowDays: number;
}

export interface CheckoutSettings {
  acceptedPaymentMethods: string[];
  checkoutFlow: "SINGLE_PAGE" | "MULTI_STEP" | "EXPRESS";
  requirePhone: boolean;
  requireCompany: boolean;
  showOrderNotes: boolean;
  autoCapture: boolean;
  minimumOrderAmount?: number;
  maximumOrderAmount?: number;
}

export interface ShippingSettings {
  freeShippingThreshold?: number;
  internationalShippingEnabled: boolean;
  defaultShippingMethodId?: string;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  internationalDeliveryDaysMin: number;
  internationalDeliveryDaysMax: number;
  allowedCountries?: string[];
  blockedCountries: string[];
}

export interface SeoSettings {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  enableStructuredData: boolean;
}

export interface ThemeSettings {
  primaryColor: string;
  primaryForeground: string;
  secondaryColor: string;
  secondaryForeground: string;
  accentColor: string;
  accentForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForeground: string;
  mutedColor: string;
  mutedForeground: string;
  borderColor: string;
  inputColor: string;
  ringColor: string;
  goldColor: string;
  champagneColor: string;
  roseGoldColor: string;
  destructiveColor: string;
  headingFont: string;
  bodyFont: string;
  accentFont: string;
  borderRadius: string;
}

export interface StoreSettings {
  id: string;
  storeId: string;
  storeName: string;

  // Business Info
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  legalBusinessName?: string;
  taxId?: string;
  socialLinks?: SocialLinks;

  // Localization
  timezone: string;
  defaultLocale: string;
  dateFormat: string;
  currencyDisplayFormat: string;

  // Features
  reviewsEnabled: boolean;
  wishlistEnabled: boolean;
  giftCardsEnabled: boolean;
  customerTiersEnabled: boolean;
  guestCheckoutEnabled: boolean;
  newsletterEnabled: boolean;
  productComparisonEnabled: boolean;

  // JSONB blocks
  policies?: StorePolicies;
  checkoutSettings?: CheckoutSettings;
  shippingSettings?: ShippingSettings;
  seoSettings?: SeoSettings;
  themeSettings?: ThemeSettings;

  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSettingsResponse {
  storeSettings: StoreSettings;
}

export interface UpdateBusinessInfoRequest {
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  legalBusinessName?: string;
  taxId?: string;
  socialLinks?: SocialLinks;
}

export interface UpdateLocalizationRequest {
  timezone?: string;
  defaultLocale?: string;
  dateFormat?: string;
  currencyDisplayFormat?: string;
}

export interface UpdateFeaturesRequest {
  reviewsEnabled?: boolean;
  wishlistEnabled?: boolean;
  giftCardsEnabled?: boolean;
  customerTiersEnabled?: boolean;
  guestCheckoutEnabled?: boolean;
  newsletterEnabled?: boolean;
  productComparisonEnabled?: boolean;
}

export interface UpdatePoliciesRequest {
  policies: StorePolicies;
}

export interface UpdateCheckoutSettingsRequest {
  checkoutSettings: CheckoutSettings;
}

export interface UpdateShippingSettingsRequest {
  shippingSettings: ShippingSettings;
}

export interface UpdateSeoSettingsRequest {
  seoSettings: SeoSettings;
}

export interface UpdateThemeSettingsRequest {
  themeSettings: ThemeSettings;
}

export interface UpdateAllSettingsRequest {
  businessInfo?: UpdateBusinessInfoRequest;
  localization?: UpdateLocalizationRequest;
  features?: UpdateFeaturesRequest;
  policies?: StorePolicies;
  checkoutSettings?: CheckoutSettings;
  shippingSettings?: ShippingSettings;
  seoSettings?: SeoSettings;
}

// Get store settings
export async function getStoreSettings(storeId: string): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings`);
}

// Update business info
export async function updateStoreBusinessInfo(
  storeId: string,
  data: UpdateBusinessInfoRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/business-info`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update localization
export async function updateStoreLocalization(
  storeId: string,
  data: UpdateLocalizationRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/localization`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update features
export async function updateStoreFeatures(
  storeId: string,
  data: UpdateFeaturesRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/features`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update policies
export async function updateStorePolicies(
  storeId: string,
  data: UpdatePoliciesRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/policies`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update checkout settings
export async function updateStoreCheckoutSettings(
  storeId: string,
  data: UpdateCheckoutSettingsRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/checkout`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update shipping settings
export async function updateStoreShippingSettings(
  storeId: string,
  data: UpdateShippingSettingsRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/shipping`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update SEO settings
export async function updateStoreSeoSettings(
  storeId: string,
  data: UpdateSeoSettingsRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/seo`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update theme settings
export async function updateStoreThemeSettings(
  storeId: string,
  data: UpdateThemeSettingsRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/theme`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Bulk update all settings
export async function updateAllStoreSettings(
  storeId: string,
  data: UpdateAllSettingsRequest
): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Initialize store settings
export async function initializeStoreSettings(storeId: string): Promise<StoreSettingsResponse> {
  return apiFetch<StoreSettingsResponse>(`/admin/stores/${storeId}/settings/initialize`, {
    method: "POST",
  });
}

// ============================================================================
// Store Management
// ============================================================================

export interface Store {
  id: string;
  name: string;
  default_currency_code: string;
  swap_link_template?: string;
  payment_link_template?: string;
  invite_link_template?: string;
  default_sales_channel_id?: string;
  default_region_id?: string;
  default_location_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StoresResponse {
  stores: Store[];
  count: number;
  limit: number;
  offset: number;
}

export interface StoreResponse {
  store: Store;
}

export interface CreateStoreRequest {
  name: string;
  default_currency_code?: string;
  swap_link_template?: string;
  payment_link_template?: string;
  invite_link_template?: string;
}

export interface UpdateStoreRequest {
  name?: string;
  default_currency_code?: string;
  swap_link_template?: string;
  payment_link_template?: string;
  invite_link_template?: string;
  default_sales_channel_id?: string;
  default_region_id?: string;
  default_location_id?: string;
}

// Get all stores
export async function getStores(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<StoresResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());
  if (params?.q) searchParams.append("q", params.q);

  const query = searchParams.toString();
  return apiFetch<StoresResponse>(`/admin/stores${query ? `?${query}` : ""}`);
}

// Get single store
export async function getStore(storeId: string): Promise<StoreResponse> {
  return apiFetch<StoreResponse>(`/admin/stores/${storeId}`);
}

// Create store
export async function createStore(data: CreateStoreRequest): Promise<StoreResponse> {
  return apiFetch<StoreResponse>("/admin/stores", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update store
export async function updateStore(storeId: string, data: UpdateStoreRequest): Promise<StoreResponse> {
  return apiFetch<StoreResponse>(`/admin/stores/${storeId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete store
export async function deleteStore(storeId: string): Promise<void> {
  await apiFetch<void>(`/admin/stores/${storeId}`, {
    method: "DELETE",
  });
}

// =============================================================================
// Internal Users API
// =============================================================================

export type InternalUserRole = "ADMIN" | "DEVELOPER" | "CUSTOMER_SERVICE" | "WAREHOUSE_MANAGER";

export type InviteStatus = "NONE" | "PENDING" | "ACCEPTED" | "EXPIRED";

export interface InternalUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  roles: string[];
  inviteStatus: InviteStatus;
  invitedAt: string | null;
  inviteAcceptedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternalUsersResponse {
  users: InternalUser[];
  count: number;
  offset: number;
  limit: number;
}

export interface InternalUserResponse {
  user: InternalUser;
}

export interface CreateInternalUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface UpdateInternalUserRequest {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface InviteInternalUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface InviteInternalUserResponse {
  userId: string;
  email: string;
}

// Get all internal users
export async function getInternalUsers(params?: {
  limit?: number;
  offset?: number;
}): Promise<InternalUsersResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.offset) searchParams.append("offset", params.offset.toString());

  const query = searchParams.toString();
  return apiFetch<InternalUsersResponse>(`/api/admin/internal-users${query ? `?${query}` : ""}`);
}

// Get single internal user
export async function getInternalUser(userId: string): Promise<InternalUserResponse> {
  return apiFetch<InternalUserResponse>(`/api/admin/internal-users/${userId}`);
}

// Create internal user directly
export async function createInternalUser(data: CreateInternalUserRequest): Promise<InternalUserResponse> {
  return apiFetch<InternalUserResponse>("/api/admin/internal-users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update internal user
export async function updateInternalUser(
  userId: string,
  data: UpdateInternalUserRequest
): Promise<InternalUserResponse> {
  return apiFetch<InternalUserResponse>(`/api/admin/internal-users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Archive internal user (soft delete - can be restored)
export async function archiveInternalUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/internal-users/${userId}`, {
    method: "DELETE",
  });
}

// Alias for backwards compatibility
export const deleteInternalUser = archiveInternalUser;

// Permanently delete internal user (CANNOT BE UNDONE)
export async function hardDeleteInternalUser(userId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/internal-users/${userId}/permanent`, {
    method: "DELETE",
  });
}

// Restore an archived user
export async function restoreInternalUser(userId: string): Promise<InternalUserResponse> {
  return apiFetch<InternalUserResponse>(`/api/admin/internal-users/${userId}/restore`, {
    method: "POST",
  });
}

// Invite internal user via email
export async function inviteInternalUser(data: InviteInternalUserRequest): Promise<InviteInternalUserResponse> {
  return apiFetch<InviteInternalUserResponse>("/api/admin/internal-users/invite", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Dashboard API
// ============================================================================

export interface RevenueStats {
  today: number;
  yesterday: number;
  changePercent: number;
  trend: "up" | "down";
}

export interface OrderStats {
  today: number;
  pending: number;
  processing: number;
  requiresAction: number;
}

export interface CustomerOverview {
  total: number;
  newThisWeek: number;
}

export interface ProductOverview {
  total: number;
  lowStock: number;
}

export interface OrderItemSummary {
  name: string;
  image: string | null;
}

export interface RecentOrderSummary {
  id: string;
  displayId: string;
  customerName: string;
  customerEmail: string | null;
  date: string;
  total: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  itemCount: number;
  items: OrderItemSummary[];
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  timestamp: string;
  userId: string | null;
  userName: string | null;
}

export interface DashboardStats {
  revenue: RevenueStats;
  orders: OrderStats;
  customers: CustomerOverview;
  products: ProductOverview;
  recentOrders: RecentOrderSummary[];
  activityFeed: ActivityItem[];
}

export interface KpiItem {
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export interface KpiData {
  totalRevenue: KpiItem;
  totalOrders: KpiItem;
  newCustomers: KpiItem;
  conversionRate: KpiItem;
  period: string;
}

// Get comprehensive dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/admin/dashboard/stats");
}

// Get recent orders
export async function getDashboardRecentOrders(limit: number = 10): Promise<RecentOrderSummary[]> {
  return apiFetch<RecentOrderSummary[]>(`/admin/dashboard/recent-orders?limit=${limit}`);
}

// Get activity feed
export async function getDashboardActivity(limit: number = 20): Promise<ActivityItem[]> {
  return apiFetch<ActivityItem[]>(`/admin/dashboard/activity?limit=${limit}`);
}

// Activity list response for live activity endpoint
export interface ActivityListResponse {
  items: ActivityItem[];
  count: number;
  hasMore: boolean;
}

// Get live activity feed (for HTTP polling fallback)
export async function getRecentActivity(limit: number = 50, since?: string): Promise<ActivityListResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (since) {
    params.append("since", since);
  }
  return apiFetch<ActivityListResponse>(`/admin/activity?${params.toString()}`);
}

// Poll for new activity since timestamp
export async function pollActivity(since: string, limit: number = 100): Promise<ActivityListResponse> {
  const params = new URLSearchParams({
    since,
    limit: limit.toString(),
  });
  return apiFetch<ActivityListResponse>(`/admin/activity/poll?${params.toString()}`);
}

// Get KPIs for analytics
export async function getDashboardKpis(period: "7d" | "30d" | "90d" | "12m" = "30d"): Promise<KpiData> {
  return apiFetch<KpiData>(`/admin/dashboard/kpis?period=${period}`);
}

// Analytics types
export interface SalesDataPoint {
  date: string;
  revenue: number;
}

export interface TopProductSummary {
  name: string;
  revenue: number;
  orders: number;
  growth: number;
}

export interface TopCategorySummary {
  category: string;
  sales: number;
}

export interface AnalyticsData {
  salesOverTime: SalesDataPoint[];
  topProducts: TopProductSummary[];
  topCategories: TopCategorySummary[];
}

// Get analytics data for charts
export async function getDashboardAnalytics(period: "7d" | "30d" | "90d" | "12m" = "30d"): Promise<AnalyticsData> {
  return apiFetch<AnalyticsData>(`/admin/dashboard/analytics?period=${period}`);
}

// =============================================================================
// Human Intervention API
// =============================================================================

export type InterventionSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type InterventionStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "IGNORED" | "AUTO_RETRYING";

export interface HumanInterventionItem {
  id: string;
  interventionType: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  errorMessage?: string;
  severity: InterventionSeverity;
  status: InterventionStatus;
  contextData?: Record<string, unknown>;
  assignedTo?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
  autoRetryCount: number;
  maxAutoRetries: number;
  nextAutoRetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionsResponse {
  interventions: HumanInterventionItem[];
  count: number;
  offset: number;
  limit: number;
}

export interface InterventionStats {
  pending: number;
  inProgress: number;
  resolved: number;
  ignored: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Get interventions list
export async function getInterventions(params?: {
  offset?: number;
  limit?: number;
  status?: InterventionStatus;
  severity?: InterventionSeverity;
  entityType?: string;
}): Promise<InterventionsResponse> {
  const query = new URLSearchParams();
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.status) query.set("status", params.status);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.entityType) query.set("entityType", params.entityType);
  return apiFetch<InterventionsResponse>(`/admin/interventions${query.toString() ? `?${query}` : ""}`);
}

// Get intervention stats
export async function getInterventionStats(): Promise<InterventionStats> {
  return apiFetch<InterventionStats>("/admin/interventions/stats");
}

// Get single intervention
export async function getIntervention(id: string): Promise<HumanInterventionItem> {
  return apiFetch<HumanInterventionItem>(`/admin/interventions/${id}`);
}

// Resolve an intervention
export async function resolveIntervention(id: string, resolution: string): Promise<HumanInterventionItem> {
  return apiFetch<HumanInterventionItem>(`/admin/interventions/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
  });
}

// Ignore an intervention
export async function ignoreIntervention(id: string, reason?: string): Promise<HumanInterventionItem> {
  return apiFetch<HumanInterventionItem>(`/admin/interventions/${id}/ignore`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// Assign intervention to user
export async function assignIntervention(id: string, userId: string): Promise<HumanInterventionItem> {
  return apiFetch<HumanInterventionItem>(`/admin/interventions/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// Retry intervention
export async function retryIntervention(id: string): Promise<HumanInterventionItem> {
  return apiFetch<HumanInterventionItem>(`/admin/interventions/${id}/retry`, {
    method: "POST",
  });
}

// Intervention severity display helper
export function getInterventionSeverityDisplay(severity: InterventionSeverity): { label: string; color: string } {
  const config: Record<InterventionSeverity, { label: string; color: string }> = {
    CRITICAL: { label: "Critical", color: "bg-red-600 text-white" },
    HIGH: { label: "High", color: "bg-orange-500 text-white" },
    MEDIUM: { label: "Medium", color: "bg-yellow-500 text-white" },
    LOW: { label: "Low", color: "bg-blue-500 text-white" },
  };
  return config[severity] || { label: severity, color: "bg-gray-500 text-white" };
}

// Intervention status display helper
export function getInterventionStatusDisplay(status: InterventionStatus): { label: string; color: string } {
  const config: Record<InterventionStatus, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
    RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-800" },
    IGNORED: { label: "Ignored", color: "bg-gray-100 text-gray-800" },
    AUTO_RETRYING: { label: "Auto Retrying", color: "bg-purple-100 text-purple-800" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800" };
}

// =========================================================================
// Regions API
// =========================================================================

export interface Country {
  iso_2: string;
  iso_3: string;
  num_code: number;
  name: string;
  display_name: string;
}

export interface Region {
  id: string;
  name: string;
  currency_code: string;
  automatic_taxes: boolean;
  tax_code: string | null;
  gift_cards_taxable: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  countries: Country[];
  payment_providers: string[];
  fulfillment_providers: string[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface RegionsResponse {
  regions: Region[];
  count: number;
  offset: number;
  limit: number;
}

export interface RegionResponse {
  region: Region;
}

export interface CreateRegionInput {
  name: string;
  currencyCode: string;
  automaticTaxes?: boolean;
  taxCode?: string;
  giftCardsTaxable?: boolean;
  taxRate?: number;
  taxInclusive?: boolean;
  countryCodes?: string[];
  paymentProviderIds?: string[];
  fulfillmentProviderIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateRegionInput {
  name?: string;
  currencyCode?: string;
  automaticTaxes?: boolean;
  taxCode?: string;
  giftCardsTaxable?: boolean;
  taxRate?: number;
  taxInclusive?: boolean;
  countryCodes?: string[];
  paymentProviderIds?: string[];
  fulfillmentProviderIds?: string[];
  metadata?: Record<string, unknown>;
}

// Get all regions
export async function getRegions(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<RegionsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  return apiFetch<RegionsResponse>(`/admin/regions${query.toString() ? `?${query}` : ""}`);
}

// Get single region by ID
export async function getRegion(id: string): Promise<RegionResponse> {
  return apiFetch<RegionResponse>(`/admin/regions/${id}`);
}

// Create regions (can create multiple at once)
export async function createRegions(regions: CreateRegionInput[]): Promise<{ regions: Region[]; count: number }> {
  return apiFetch<{ regions: Region[]; count: number }>("/admin/regions", {
    method: "POST",
    body: JSON.stringify({ regions }),
  });
}

// Create a single region (convenience function)
export async function createRegion(data: CreateRegionInput): Promise<Region> {
  const response = await createRegions([data]);
  return response.regions[0];
}

// Update a region
export async function updateRegion(id: string, data: UpdateRegionInput): Promise<RegionResponse> {
  return apiFetch<RegionResponse>(`/admin/regions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a region (soft delete)
export async function deleteRegion(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/regions/${id}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Tax Regions API
// =========================================================================

export interface TaxRate {
  id: string;
  name: string;
  code: string | null;
  rate: number;
  region_id: string;
  region_name: string | null;
  product_types: string | null;
  product_categories: string | null;
  shipping_option_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface TaxRegion {
  region_id: string;
  region_name: string;
  currency_code: string;
  default_tax_rate: number;
  tax_rates: TaxRate[];
  tax_rate_count: number;
}

export interface TaxRegionsResponse {
  tax_regions: TaxRegion[];
  count: number;
  offset: number;
  limit: number;
}

export interface TaxRatesResponse {
  tax_rates: TaxRate[];
  count: number;
  offset: number;
  limit: number;
}

export interface TaxRateResponse {
  tax_rate: TaxRate;
}

export interface CreateTaxRateInput {
  name: string;
  code?: string;
  rate: number;
  regionId: string;
  productTypes?: string;
  productCategories?: string;
  shippingOptionId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaxRateInput {
  name?: string;
  code?: string;
  rate?: number;
  productTypes?: string;
  productCategories?: string;
  shippingOptionId?: string;
  metadata?: Record<string, unknown>;
}

// Get all tax regions (regions with their tax rates)
export async function getTaxRegions(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<TaxRegionsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  return apiFetch<TaxRegionsResponse>(`/admin/tax-regions${query.toString() ? `?${query}` : ""}`);
}

// Get all tax rates
export async function getTaxRates(params?: {
  limit?: number;
  offset?: number;
  regionId?: string;
  q?: string;
}): Promise<TaxRatesResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.regionId) query.set("regionId", params.regionId);
  if (params?.q) query.set("q", params.q);
  return apiFetch<TaxRatesResponse>(`/admin/tax-regions/rates${query.toString() ? `?${query}` : ""}`);
}

// Get single tax rate by ID
export async function getTaxRate(id: string): Promise<TaxRateResponse> {
  return apiFetch<TaxRateResponse>(`/admin/tax-regions/rates/${id}`);
}

// Create a tax rate
export async function createTaxRate(data: CreateTaxRateInput): Promise<TaxRateResponse> {
  return apiFetch<TaxRateResponse>("/admin/tax-regions/rates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a tax rate
export async function updateTaxRate(id: string, data: UpdateTaxRateInput): Promise<TaxRateResponse> {
  return apiFetch<TaxRateResponse>(`/admin/tax-regions/rates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a tax rate (soft delete)
export async function deleteTaxRate(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/tax-regions/rates/${id}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Stock Locations API
// =========================================================================

export interface StockLocation {
  id: string;
  name: string;
  address: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  country_code: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  priority: number;
  fulfillment_enabled: boolean;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface StockLocationsResponse {
  locations: StockLocation[];
  count: number;
  offset: number;
  limit: number;
}

export interface StockLocationResponse {
  location: StockLocation;
}

export interface CreateStockLocationInput {
  name: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  countryCode?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  priority?: number;
  fulfillmentEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateStockLocationInput {
  name?: string;
  address?: string;
  address1?: string;
  address2?: string;
  city?: string;
  countryCode?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  priority?: number;
  fulfillmentEnabled?: boolean;
  metadata?: Record<string, unknown>;
}

// Get all stock locations
export async function getStockLocations(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<StockLocationsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  return apiFetch<StockLocationsResponse>(`/admin/locations${query.toString() ? `?${query}` : ""}`);
}

// Get single stock location by ID
export async function getStockLocation(id: string): Promise<StockLocationResponse> {
  return apiFetch<StockLocationResponse>(`/admin/locations/${id}`);
}

// Create a stock location
export async function createStockLocation(data: CreateStockLocationInput): Promise<StockLocationResponse> {
  return apiFetch<StockLocationResponse>("/admin/locations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a stock location
export async function updateStockLocation(id: string, data: UpdateStockLocationInput): Promise<StockLocationResponse> {
  return apiFetch<StockLocationResponse>(`/admin/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a stock location (soft delete)
export async function deleteStockLocation(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/locations/${id}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Shipping Profiles API
// =========================================================================

export interface ShippingProfile {
  id: string;
  name: string;
  type: string;
  product_count: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface ShippingProfilesResponse {
  profiles: ShippingProfile[];
  count: number;
  offset: number;
  limit: number;
}

export interface ShippingProfileResponse {
  profile: ShippingProfile;
}

export interface CreateShippingProfileInput {
  name: string;
  type?: string;
  productIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateShippingProfileInput {
  name?: string;
  type?: string;
  productIds?: string[];
  metadata?: Record<string, unknown>;
}

// Get all shipping profiles
export async function getShippingProfiles(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  type?: string;
}): Promise<ShippingProfilesResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  if (params?.type) query.set("type", params.type);
  return apiFetch<ShippingProfilesResponse>(`/admin/locations/shipping-profiles${query.toString() ? `?${query}` : ""}`);
}

// Get single shipping profile by ID
export async function getShippingProfile(id: string): Promise<ShippingProfileResponse> {
  return apiFetch<ShippingProfileResponse>(`/admin/locations/shipping-profiles/${id}`);
}

// Create a shipping profile
export async function createShippingProfile(data: CreateShippingProfileInput): Promise<ShippingProfileResponse> {
  return apiFetch<ShippingProfileResponse>("/admin/locations/shipping-profiles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a shipping profile
export async function updateShippingProfile(id: string, data: UpdateShippingProfileInput): Promise<ShippingProfileResponse> {
  return apiFetch<ShippingProfileResponse>(`/admin/locations/shipping-profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a shipping profile (soft delete)
export async function deleteShippingProfile(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/locations/shipping-profiles/${id}`, {
    method: "DELETE",
  });
}

// =========================================================================
// Return Reasons API
// =========================================================================

export interface ReturnReason {
  id: string;
  value: string;
  label: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  requires_note: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReturnReasonsResponse {
  return_reasons: ReturnReason[];
  count: number;
  offset: number;
  limit: number;
}

export interface ReturnReasonResponse {
  return_reason: ReturnReason;
}

export interface CreateReturnReasonInput {
  value: string;
  label: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  requiresNote?: boolean;
}

export interface UpdateReturnReasonInput {
  value?: string;
  label?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  requiresNote?: boolean;
}

// Get all return reasons
export async function getReturnReasons(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  active?: boolean;
}): Promise<ReturnReasonsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  if (params?.active !== undefined) query.set("active", params.active.toString());

  return apiFetch<ReturnReasonsResponse>(`/admin/return-reasons${query.toString() ? `?${query}` : ""}`);
}

// Get single return reason by ID
export async function getReturnReason(id: string): Promise<ReturnReasonResponse> {
  return apiFetch<ReturnReasonResponse>(`/admin/return-reasons/${id}`);
}

// Create a return reason
export async function createReturnReason(data: CreateReturnReasonInput): Promise<ReturnReasonResponse> {
  return apiFetch<ReturnReasonResponse>("/admin/return-reasons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a return reason
export async function updateReturnReason(id: string, data: UpdateReturnReasonInput): Promise<ReturnReasonResponse> {
  return apiFetch<ReturnReasonResponse>(`/admin/return-reasons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a return reason (soft delete)
export async function deleteReturnReason(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/return-reasons/${id}`, {
    method: "DELETE",
  });
}

// Reorder return reasons
export async function reorderReturnReasons(ids: string[]): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/admin/return-reasons/reorder", {
    method: "POST",
    body: JSON.stringify(ids),
  });
}

// Seed default return reasons
export async function seedReturnReasons(): Promise<{ message: string; count: number }> {
  return apiFetch<{ message: string; count: number }>("/admin/return-reasons/seed", {
    method: "POST",
  });
}

// ============================================================================
// REFUND REASONS
// ============================================================================

export interface RefundReason {
  id: string;
  value: string;
  label: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  requires_note: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface RefundReasonsResponse {
  refund_reasons: RefundReason[];
  count: number;
  offset: number;
  limit: number;
}

export interface RefundReasonResponse {
  refund_reason: RefundReason;
}

export interface CreateRefundReasonInput {
  value: string;
  label: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  requiresNote?: boolean;
}

export interface UpdateRefundReasonInput {
  value?: string;
  label?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  requiresNote?: boolean;
}

// List all refund reasons
export async function getRefundReasons(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  active?: boolean;
}): Promise<RefundReasonsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  if (params?.active !== undefined) query.set("active", params.active.toString());
  return apiFetch<RefundReasonsResponse>(`/admin/refund-reasons${query.toString() ? `?${query}` : ""}`);
}

// Get single refund reason
export async function getRefundReason(id: string): Promise<RefundReasonResponse> {
  return apiFetch<RefundReasonResponse>(`/admin/refund-reasons/${id}`);
}

// Create a new refund reason
export async function createRefundReason(data: CreateRefundReasonInput): Promise<RefundReasonResponse> {
  return apiFetch<RefundReasonResponse>("/admin/refund-reasons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a refund reason
export async function updateRefundReason(id: string, data: UpdateRefundReasonInput): Promise<RefundReasonResponse> {
  return apiFetch<RefundReasonResponse>(`/admin/refund-reasons/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a refund reason
export async function deleteRefundReason(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/refund-reasons/${id}`, {
    method: "DELETE",
  });
}

// Reorder refund reasons
export async function reorderRefundReasons(ids: string[]): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/admin/refund-reasons/reorder", {
    method: "POST",
    body: JSON.stringify(ids),
  });
}

// Seed default refund reasons
export async function seedRefundReasons(): Promise<{ message: string; count: number }> {
  return apiFetch<{ message: string; count: number }>("/admin/refund-reasons/seed", {
    method: "POST",
  });
}

// ============================================================================
// Security Dashboard API
// ============================================================================

// Types
export interface SecuritySession {
  id: string;
  userId: string;
  userEmail: string | null;
  ipAddress: string;
  userAgent: string | null;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  countryCode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  flaggedVpn: boolean;
  flaggedProxy: boolean;
  fraudScore: number | null;
  lastActivityAt: string;
  createdAt: string;
}

export interface ActiveSessionsResponse {
  sessions: SecuritySession[];
  count: number;
}

export interface IpListEntry {
  id: string;
  ipAddress: string;
  listType: "ALLOWLIST" | "BLOCKLIST";
  reason: string | null;
  expiresAt: string | null;
  addedByUserId: string | null;
  createdAt: string;
}

export interface IpListResponse {
  entries: IpListEntry[];
  count: number;
}

export interface SecurityEvent {
  id: string;
  eventType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ipAddress: string | null;
  userId: string | null;
  userEmail: string | null;
  title: string;
  description: string | null;
  countryCode: string | null;
  city: string | null;
  fraudScore: number | null;
  isVpn: boolean | null;
  isProxy: boolean | null;
  details: Record<string, unknown> | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
  count: number;
  offset: number;
  limit: number;
}

export interface SecurityConfig {
  block_vpn: boolean;
  block_proxy: boolean;
  block_datacenter: boolean;
  block_tor: boolean;
  block_bots: boolean;
  fraud_score_threshold: number;
  session_timeout_minutes: number;
  max_sessions_per_user: number;
  ipqs_enabled: boolean;
  require_allowlist: boolean;
}

export interface SecurityConfigResponse {
  config: SecurityConfig;
}

export interface SecurityStats {
  active_sessions: number;
  blocked_attempts_24h: number;
  unresolved_events: number;
  vpn_flagged_24h: number;
  proxy_flagged_24h: number;
}

export interface AddIpToListInput {
  ipAddress: string;
  listType: "ALLOWLIST" | "BLOCKLIST";
  reason?: string;
  expiresAt?: string;
}

export interface UpdateSecurityConfigInput {
  block_vpn?: boolean;
  block_proxy?: boolean;
  block_datacenter?: boolean;
  block_tor?: boolean;
  block_bots?: boolean;
  fraud_score_threshold?: number;
  session_timeout_minutes?: number;
  max_sessions_per_user?: number;
  ipqs_enabled?: boolean;
  require_allowlist?: boolean;
}

// Sessions
export async function getActiveSessions(): Promise<ActiveSessionsResponse> {
  return apiFetch<ActiveSessionsResponse>("/admin/security/sessions");
}

export async function revokeSession(id: string, reason?: string): Promise<{ id: string; revoked: boolean; message: string }> {
  return apiFetch<{ id: string; revoked: boolean; message: string }>(`/admin/security/sessions/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

export async function revokeAllUserSessions(userId: string, reason?: string): Promise<{ userId: string; revokedCount: number; message: string }> {
  return apiFetch<{ userId: string; revokedCount: number; message: string }>(`/admin/security/sessions/user/${userId}`, {
    method: "DELETE",
    body: JSON.stringify({ reason }),
  });
}

// IP List
export async function getIpList(listType?: "ALLOWLIST" | "BLOCKLIST"): Promise<IpListResponse> {
  const query = listType ? `?list_type=${listType}` : "";
  return apiFetch<IpListResponse>(`/admin/security/ip-list${query}`);
}

export async function addIpToList(data: AddIpToListInput): Promise<{ entry: IpListEntry }> {
  return apiFetch<{ entry: IpListEntry }>("/admin/security/ip-list", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeIpFromList(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/security/ip-list/${id}`, {
    method: "DELETE",
  });
}

// Security Events
export async function getSecurityEvents(params?: {
  limit?: number;
  offset?: number;
  event_type?: string;
  severity?: string;
  resolved?: boolean;
}): Promise<SecurityEventsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.event_type) query.set("event_type", params.event_type);
  if (params?.severity) query.set("severity", params.severity);
  if (params?.resolved !== undefined) query.set("resolved", params.resolved.toString());
  return apiFetch<SecurityEventsResponse>(`/admin/security/events${query.toString() ? `?${query}` : ""}`);
}

export async function resolveSecurityEvent(id: string, notes?: string): Promise<{ event: SecurityEvent }> {
  return apiFetch<{ event: SecurityEvent }>(`/admin/security/events/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function bulkResolveSecurityEvents(
  ids: string[],
  notes?: string
): Promise<{ resolvedCount: number; failedIds: string[] }> {
  return apiFetch<{ resolvedCount: number; failedIds: string[] }>("/admin/security/events/bulk-resolve", {
    method: "POST",
    body: JSON.stringify({ eventIds: ids, notes }),
  });
}

// Security Config
export async function getSecurityConfig(): Promise<SecurityConfigResponse> {
  return apiFetch<SecurityConfigResponse>("/admin/security/config");
}

export async function updateSecurityConfig(data: UpdateSecurityConfigInput): Promise<SecurityConfigResponse> {
  return apiFetch<SecurityConfigResponse>("/admin/security/config", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Security Stats
export async function getSecurityStats(): Promise<SecurityStats> {
  return apiFetch<SecurityStats>("/admin/security/stats");
}

// ============================================================================
// Sales Channels API
// ============================================================================

export interface SalesChannel {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_disabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesChannelsResponse {
  sales_channels: SalesChannel[];
  count: number;
  limit: number;
  offset: number;
}

export interface SalesChannelResponse {
  sales_channel: SalesChannel;
}

export interface CreateSalesChannelInput {
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateSalesChannelInput {
  name?: string;
  description?: string;
  is_active?: boolean;
}

// List all sales channels
export async function getSalesChannels(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<SalesChannelsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.offset) query.set("offset", params.offset.toString());
  if (params?.q) query.set("q", params.q);
  return apiFetch<SalesChannelsResponse>(`/admin/sales-channels${query.toString() ? `?${query}` : ""}`);
}

// Get single sales channel
export async function getSalesChannel(id: string): Promise<SalesChannelResponse> {
  return apiFetch<SalesChannelResponse>(`/admin/sales-channels/${id}`);
}

// Create a new sales channel
export async function createSalesChannel(data: CreateSalesChannelInput): Promise<SalesChannelResponse> {
  return apiFetch<SalesChannelResponse>("/admin/sales-channels", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a sales channel
export async function updateSalesChannel(id: string, data: UpdateSalesChannelInput): Promise<SalesChannelResponse> {
  return apiFetch<SalesChannelResponse>(`/admin/sales-channels/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Delete a sales channel
export async function deleteSalesChannel(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/sales-channels/${id}`, {
    method: "DELETE",
  });
}

// ============================================================================
// Notifications
// ============================================================================

export interface Notification {
  id: string;
  eventType: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  navigateTo: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  count: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationPreference {
  eventType: string;
  eventTypeDisplayName: string;
  browserEnabled: boolean;
  inAppEnabled: boolean;
}

export interface PreferencesResponse {
  preferences: NotificationPreference[];
}

export interface UpdatePreferencesInput {
  preferences: {
    eventType: string;
    browserEnabled: boolean;
    inAppEnabled: boolean;
  }[];
}

// Get user notifications
export async function getNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.unreadOnly) query.set("unreadOnly", "true");
  return apiFetch<NotificationsResponse>(`/api/v1/internal/notifications${query.toString() ? `?${query}` : ""}`);
}

// Get unread notification count
export async function getUnreadCount(): Promise<UnreadCountResponse> {
  return apiFetch<UnreadCountResponse>("/api/v1/internal/notifications/unread-count");
}

// Mark notification as read
export async function markNotificationAsRead(id: string): Promise<{ id: string; isRead: boolean }> {
  return apiFetch<{ id: string; isRead: boolean }>(`/api/v1/internal/notifications/${id}/read`, {
    method: "POST",
  });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(): Promise<{ markedAsRead: number }> {
  return apiFetch<{ markedAsRead: number }>("/api/v1/internal/notifications/read-all", {
    method: "POST",
  });
}

// Delete a notification
export async function deleteNotification(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/api/v1/internal/notifications/${id}`, {
    method: "DELETE",
  });
}

// Get notification preferences
export async function getNotificationPreferences(): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences");
}

// Update notification preferences
export async function updateNotificationPreferences(data: UpdatePreferencesInput): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Reset notification preferences to defaults
export async function resetNotificationPreferences(): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>("/api/v1/internal/notifications/preferences/reset", {
    method: "POST",
  });
}
