import { apiFetch } from "./client";

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

export interface ServiceInfo {
  code: string;
  name: string;
  domestic: boolean;
  international: boolean;
}

export async function getCarrierServices(carrierId: string): Promise<{ services: ServiceInfo[] }> {
  return apiFetch<{ services: ServiceInfo[] }>(`/admin/orders/shipping/carriers/${carrierId}/services`);
}

// ShipEngine rate quoting
export interface ShippingRate {
  rateId: string;
  carrierId: string;
  carrierCode: string;
  serviceCode: string;
  serviceType: string | null;
  shippingAmount: { amount: number; currency: string };
  deliveryDays: number | null;
  estimatedDeliveryDate: string | null;
}

export interface GetRatesRequest {
  carrierIds?: string[];
  packageWeight?: number;
  packageLength?: number;
  packageWidth?: number;
  packageHeight?: number;
}

export async function getShippingRates(
  orderId: string,
  data?: GetRatesRequest
): Promise<{ rates: ShippingRate[]; carrierCount: number }> {
  return apiFetch(`/admin/orders/${orderId}/rates`, {
    method: "POST",
    body: JSON.stringify(data || {}),
  });
}

// Tracking
export interface TrackingEvent {
  occurredAt: string;
  description: string;
  cityLocality: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  countryCode: string | null;
}

export interface TrackingInfo {
  trackingNumber: string;
  statusCode: string;
  statusDescription: string;
  carrierStatusCode: string | null;
  carrierStatusDescription: string | null;
  trackingUrl: string | null;
  events: TrackingEvent[];
}

export interface TrackingResponse {
  tracking: TrackingInfo | null;
  fulfillmentId?: string;
  labelStatus?: string;
  labelId?: string;
  labelUrl?: string;
  labelCost?: number;
  carrierCode?: string;
  serviceCode?: string;
  message?: string;
}

export async function getOrderTracking(orderId: string): Promise<TrackingResponse> {
  return apiFetch<TrackingResponse>(`/admin/orders/${orderId}/tracking`);
}

// Void label
export async function voidShippingLabel(
  orderId: string
): Promise<{ success: boolean; message: string; alreadyVoided?: boolean; requiresAttention?: boolean }> {
  return apiFetch(`/admin/orders/${orderId}/label/void`, {
    method: "POST",
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
// Ship-From Addresses API
// =========================================================================

export interface ShipFromAddress {
  id: string;
  label: string;
  name: string;
  company: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string;
  country_code: string;
  phone: string | null;
  email: string | null;
  is_default: boolean;
}

export interface ShipFromAddressesResponse {
  addresses: ShipFromAddress[];
}

export interface ShipFromAddressResponse {
  address: ShipFromAddress;
}

export interface CreateShipFromAddressInput {
  label: string;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state_province?: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
}

export interface UpdateShipFromAddressInput {
  label?: string;
  name?: string;
  company?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
}

// Get all ship-from addresses
export async function getShipFromAddresses(): Promise<ShipFromAddressesResponse> {
  return apiFetch<ShipFromAddressesResponse>("/admin/shipping/from-addresses");
}

// Create a ship-from address
export async function createShipFromAddress(data: CreateShipFromAddressInput): Promise<ShipFromAddressResponse> {
  return apiFetch<ShipFromAddressResponse>("/admin/shipping/from-addresses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Update a ship-from address
export async function updateShipFromAddress(id: string, data: UpdateShipFromAddressInput): Promise<ShipFromAddressResponse> {
  return apiFetch<ShipFromAddressResponse>(`/admin/shipping/from-addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Set a ship-from address as the default
export async function setDefaultShipFromAddress(id: string): Promise<ShipFromAddressResponse> {
  return apiFetch<ShipFromAddressResponse>(`/admin/shipping/from-addresses/${id}/set-default`, {
    method: "PUT",
  });
}

// Delete a ship-from address
export async function deleteShipFromAddress(id: string): Promise<{ id: string; deleted: boolean }> {
  return apiFetch<{ id: string; deleted: boolean }>(`/admin/shipping/from-addresses/${id}`, {
    method: "DELETE",
  });
}
