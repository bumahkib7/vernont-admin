import { apiFetch } from "./client";

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
  productTypes: string[];
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
  productTypes?: string[];
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
  productTypes?: string[];
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
    PERCENTAGE: { label: "Percentage Off", color: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400", icon: "%" },
    FIXED: { label: "Fixed Amount", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400", icon: "\u00A3" },
    FREE_SHIPPING: { label: "Free Shipping", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400", icon: "\uD83D\uDE9A" },
    BUY_X_GET_Y: { label: "Buy X Get Y", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400", icon: "\uD83C\uDF81" },
  };
  return config[type] || { label: type, color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400", icon: "?" };
}

export function getPromotionStatusDisplay(status: string): { label: string; color: string } {
  const config: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400" },
    INACTIVE: { label: "Inactive", color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" },
    SCHEDULED: { label: "Scheduled", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" },
    DISABLED: { label: "Disabled", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400" },
    LIMIT_REACHED: { label: "Limit Reached", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400" },
    DELETED: { label: "Deleted", color: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" };
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
      return `\u00A3${value.toFixed(2)} off`;
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
    ACTIVE: { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400" },
    FULLY_REDEEMED: { label: "Fully Redeemed", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
    EXPIRED: { label: "Expired", color: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400" },
    DISABLED: { label: "Disabled", color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" };
}
