import { apiFetch } from "./client";

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

// Resend invitation email for a pending user
export async function resendInvite(userId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/admin/internal-users/invite/resend/${userId}`, {
    method: "POST",
  });
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

// Webhooks
export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  failureCount: number;
  lastFailureAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: string;
  status: string;
  responseStatus: number | null;
  responseBody: string | null;
  attempts: number;
  nextRetryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export async function getWebhookEndpoints(page = 0, size = 20): Promise<{ endpoints: WebhookEndpoint[]; total: number }> {
  return apiFetch(`/admin/webhooks?page=${page}&size=${size}`);
}

export async function getWebhookEndpoint(id: string): Promise<WebhookEndpoint> {
  return apiFetch(`/admin/webhooks/${id}`);
}

export async function createWebhookEndpoint(data: { url: string; secret: string; events: string[]; description?: string }): Promise<WebhookEndpoint> {
  return apiFetch("/admin/webhooks", { method: "POST", body: JSON.stringify(data) });
}

export async function updateWebhookEndpoint(id: string, data: Partial<{ url: string; secret: string; events: string[]; description: string; isActive: boolean }>): Promise<WebhookEndpoint> {
  return apiFetch(`/admin/webhooks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteWebhookEndpoint(id: string): Promise<void> {
  await apiFetch(`/admin/webhooks/${id}`, { method: "DELETE" });
}

export async function testWebhookEndpoint(id: string): Promise<WebhookDelivery> {
  return apiFetch(`/admin/webhooks/${id}/test`, { method: "POST" });
}

export async function getWebhookDeliveries(endpointId: string, page = 0, size = 20): Promise<{ deliveries: WebhookDelivery[]; total: number }> {
  return apiFetch(`/admin/webhooks/${endpointId}/deliveries?page=${page}&size=${size}`);
}

// ============================================================================
// Human Intervention API
// ============================================================================

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
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400" },
    IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400" },
    RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400" },
    IGNORED: { label: "Ignored", color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" },
    AUTO_RETRYING: { label: "Auto Retrying", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400" },
  };
  return config[status] || { label: status, color: "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-400" };
}
