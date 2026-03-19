import { apiFetch } from "./client";

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

// Fulfillment details
export interface FulfillmentDetail {
  id: string;
  orderId: string;
  trackingNumbers: string[];
  trackingUrls: string[];
  shippedAt: string | null;
  canceledAt: string | null;
  isShipped: boolean;
  isCanceled: boolean;
  labelId: string | null;
  labelStatus: string;
  labelUrl: string | null;
  labelCost: number | null;
  carrierCode: string | null;
  serviceCode: string | null;
  labelPurchasedAt: string | null;
  labelVoidError: string | null;
  itemCount: number;
  data: Record<string, unknown> | null;
}

export async function getOrderFulfillments(
  orderId: string
): Promise<{ fulfillments: FulfillmentDetail[]; count: number }> {
  return apiFetch(`/admin/orders/${orderId}/fulfillments`);
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

// Draft Order types (full detail)
export type DraftOrderStatus = "OPEN" | "INVOICE_SENT" | "COMPLETED" | "CANCELLED";

export interface DraftOrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DraftOrder {
  id: string;
  customerEmail?: string;
  customerId?: string;
  status: DraftOrderStatus;
  note?: string;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  convertedOrderId?: string;
  createdBy?: string;
  items: DraftOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface DraftOrdersDetailResponse {
  draftOrders: DraftOrder[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateDraftOrderItemInput {
  productId?: string;
  variantId?: string;
  title: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateDraftOrderInput {
  customerEmail?: string;
  customerId?: string;
  note?: string;
  shippingAddress?: Omit<OrderAddress, "id">;
  billingAddress?: Omit<OrderAddress, "id">;
  items: CreateDraftOrderItemInput[];
  currency?: string;
}

export interface UpdateDraftOrderInput {
  customerEmail?: string;
  customerId?: string;
  note?: string;
  shippingAddress?: Omit<OrderAddress, "id">;
  billingAddress?: Omit<OrderAddress, "id">;
  items?: CreateDraftOrderItemInput[];
}

// Draft Order CRUD
export async function getDraftOrder(id: string): Promise<DraftOrder> {
  return apiFetch<DraftOrder>(`/admin/orders/drafts/${id}`);
}

export async function createDraftOrder(data: CreateDraftOrderInput): Promise<DraftOrder> {
  return apiFetch<DraftOrder>("/admin/orders/drafts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDraftOrder(id: string, data: UpdateDraftOrderInput): Promise<DraftOrder> {
  return apiFetch<DraftOrder>(`/admin/orders/drafts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDraftOrder(id: string): Promise<void> {
  await apiFetch<void>(`/admin/orders/drafts/${id}`, {
    method: "DELETE",
  });
}

export async function sendDraftOrderInvoice(id: string): Promise<DraftOrder> {
  return apiFetch<DraftOrder>(`/admin/orders/drafts/${id}/invoice`, {
    method: "POST",
  });
}

export async function convertDraftOrderToOrder(id: string): Promise<{ orderId: string }> {
  return apiFetch<{ orderId: string }>(`/admin/orders/drafts/${id}/convert`, {
    method: "POST",
  });
}

export async function cancelDraftOrder(id: string): Promise<DraftOrder> {
  return apiFetch<DraftOrder>(`/admin/orders/drafts/${id}/cancel`, {
    method: "POST",
  });
}

export function getDraftOrderStatusDisplay(status: DraftOrderStatus): { label: string; color: string } {
  switch (status) {
    case "OPEN":
      return { label: "Open", color: "bg-blue-500" };
    case "INVOICE_SENT":
      return { label: "Invoice Sent", color: "bg-yellow-500" };
    case "COMPLETED":
      return { label: "Completed", color: "bg-green-500" };
    case "CANCELLED":
      return { label: "Cancelled", color: "bg-red-500" };
    default:
      return { label: status, color: "bg-gray-500" };
  }
}

// Order Edit APIs
export interface OrderEditItem {
  id: string;
  lineItemId: string | null;
  action: string;
  originalQuantity: number | null;
  newQuantity: number | null;
  originalUnitPrice: number | null;
  newUnitPrice: number | null;
}

export interface OrderEdit {
  id: string;
  orderId: string;
  editedBy: string | null;
  status: string;
  note: string | null;
  differenceAmount: number;
  confirmedAt: string | null;
  items: OrderEditItem[];
  createdAt: string;
}

export async function createOrderEdit(orderId: string, note?: string): Promise<OrderEdit> {
  return apiFetch<OrderEdit>(`/admin/orders/${orderId}/edits`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}

export async function getOrderEdits(orderId: string): Promise<{ edits: OrderEdit[]; count: number }> {
  return apiFetch(`/admin/orders/${orderId}/edits`);
}

export async function getOrderEdit(orderId: string, editId: string): Promise<OrderEdit> {
  return apiFetch<OrderEdit>(`/admin/orders/${orderId}/edits/${editId}`);
}

export async function addOrderEditItem(
  orderId: string,
  editId: string,
  item: { lineItemId?: string; action: string; newQuantity?: number; newUnitPrice?: number }
): Promise<OrderEdit> {
  return apiFetch<OrderEdit>(`/admin/orders/${orderId}/edits/${editId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function confirmOrderEdit(orderId: string, editId: string): Promise<OrderEdit> {
  return apiFetch<OrderEdit>(`/admin/orders/${orderId}/edits/${editId}/confirm`, {
    method: "POST",
  });
}

export async function cancelOrderEdit(orderId: string, editId: string): Promise<OrderEdit> {
  return apiFetch<OrderEdit>(`/admin/orders/${orderId}/edits/${editId}`, {
    method: "DELETE",
  });
}
