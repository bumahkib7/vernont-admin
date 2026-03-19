import { apiFetch } from "./client";

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
