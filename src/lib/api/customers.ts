import { apiFetch } from "./client";
import type { OrdersResponse } from "./orders";

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
// Customer Segment APIs
// =============================================================================

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  criteria: Record<string, any> | null;
  isDynamic: boolean;
  customerCount: number;
  lastEvaluatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getCustomerSegments(): Promise<{ segments: CustomerSegment[]; count: number }> {
  return apiFetch("/admin/customers/segments");
}

export async function getCustomerSegment(id: string): Promise<CustomerSegment> {
  return apiFetch<CustomerSegment>(`/admin/customers/segments/${id}`);
}

export async function createCustomerSegment(data: {
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  isDynamic?: boolean;
}): Promise<CustomerSegment> {
  return apiFetch<CustomerSegment>("/admin/customers/segments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCustomerSegment(id: string, data: {
  name: string;
  description?: string;
  criteria?: Record<string, any>;
  isDynamic?: boolean;
}): Promise<CustomerSegment> {
  return apiFetch<CustomerSegment>(`/admin/customers/segments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomerSegment(id: string): Promise<void> {
  return apiFetch(`/admin/customers/segments/${id}`, { method: "DELETE" });
}

export async function evaluateCustomerSegment(id: string): Promise<CustomerSegment> {
  return apiFetch<CustomerSegment>(`/admin/customers/segments/${id}/evaluate`, {
    method: "POST",
  });
}

export async function previewCustomerSegment(criteria: Record<string, any>): Promise<{ matchingCount: number }> {
  return apiFetch(`/admin/customers/segments/preview`, {
    method: "POST",
    body: JSON.stringify(criteria),
  });
}

// =============================================================================
// B2B / Wholesale Company types and API functions
// =============================================================================

export type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface CompanyAddress {
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  taxId?: string;
  website?: string;
  status: CompanyStatus;
  paymentTerms?: string;
  notes?: string;
  billingAddress?: CompanyAddress;
  shippingAddress?: CompanyAddress;
  contacts: CompanyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface ContractPricingRule {
  id?: string;
  productId: string;
  productTitle?: string;
  variantId?: string;
  variantTitle?: string;
  priceOverride?: number;
  discountPercent?: number;
  minQuantity?: number;
  currencyCode?: string;
}

export interface ContractPricing {
  companyId: string;
  rules: ContractPricingRule[];
}

export interface CompaniesListResponse {
  companies: Company[];
  count: number;
  offset: number;
  limit: number;
}

export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  taxId?: string;
  website?: string;
  status?: CompanyStatus;
  paymentTerms?: string;
  notes?: string;
  billingAddress?: CompanyAddress;
  shippingAddress?: CompanyAddress;
  primaryContact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: string;
  };
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export async function getCompanies(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  status?: string;
}): Promise<CompaniesListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());
  if (params?.q) searchParams.set("q", params.q);
  if (params?.status) searchParams.set("status", params.status);
  const query = searchParams.toString();
  return apiFetch(`/admin/companies${query ? `?${query}` : ""}`);
}

export async function getCompany(id: string): Promise<Company> {
  return apiFetch(`/admin/companies/${id}`);
}

export async function createCompany(data: CreateCompanyRequest): Promise<Company> {
  return apiFetch("/admin/companies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCompany(id: string, data: Partial<CreateCompanyRequest>): Promise<Company> {
  return apiFetch(`/admin/companies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCompany(id: string): Promise<void> {
  await apiFetch(`/admin/companies/${id}`, {
    method: "DELETE",
  });
}

export async function addCompanyContact(
  companyId: string,
  data: CreateContactRequest
): Promise<CompanyContact> {
  return apiFetch(`/admin/companies/${companyId}/contacts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeCompanyContact(
  companyId: string,
  contactId: string
): Promise<void> {
  await apiFetch(`/admin/companies/${companyId}/contacts/${contactId}`, {
    method: "DELETE",
  });
}

export async function getContractPricing(companyId: string): Promise<ContractPricing> {
  return apiFetch(`/admin/companies/${companyId}/pricing`);
}

export async function setContractPricing(
  companyId: string,
  data: { rules: ContractPricingRule[] }
): Promise<ContractPricing> {
  return apiFetch(`/admin/companies/${companyId}/pricing`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCompanyStatusDisplay(status: CompanyStatus): { label: string; color: string } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", color: "bg-green-500" };
    case "SUSPENDED":
      return { label: "Suspended", color: "bg-yellow-500" };
    case "INACTIVE":
      return { label: "Inactive", color: "bg-gray-400" };
    default:
      return { label: status, color: "bg-gray-400" };
  }
}
