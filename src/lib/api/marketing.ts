import { apiFetch } from "./client";

// ============================================================================
// Advertising / Ad Platform APIs
// ============================================================================

export interface AdConnection {
  id: string;
  platform: string;
  accountId: string | null;
  accountName: string | null;
  status: string;
  tokenExpiresAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdConnectionsResponse {
  connections: AdConnection[];
  count: number;
}

export async function getAdConnections(): Promise<AdConnectionsResponse> {
  return apiFetch<AdConnectionsResponse>("/admin/advertising/connections");
}

export async function getAdAuthUrl(platform: string, redirectUri: string): Promise<{ authorizationUrl: string }> {
  return apiFetch<{ authorizationUrl: string }>(
    `/admin/advertising/connections/${platform}/auth-url?redirectUri=${encodeURIComponent(redirectUri)}`
  );
}

export async function submitAdOAuthCallback(
  platform: string,
  code: string,
  redirectUri: string,
  state?: string
): Promise<AdConnection> {
  return apiFetch<AdConnection>(`/admin/advertising/connections/${platform}/callback`, {
    method: "POST",
    body: JSON.stringify({ code, redirectUri, state }),
  });
}

export async function disconnectAdPlatform(id: string): Promise<{ id: string; status: string; message: string }> {
  return apiFetch(`/admin/advertising/connections/${id}`, {
    method: "DELETE",
  });
}

export async function refreshAdToken(id: string): Promise<{ id: string; status: string; tokenExpiresAt: string; message: string }> {
  return apiFetch(`/admin/advertising/connections/${id}/refresh`, {
    method: "POST",
  });
}

export interface AdCampaign {
  id: string;
  platform: string;
  externalCampaignId: string;
  name: string | null;
  status: string;
  campaignType: string | null;
  dailyBudgetCents: number | null;
  lifetimeBudgetCents: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface AdCampaignsResponse {
  campaigns: AdCampaign[];
  count: number;
}

export async function getAdCampaigns(platform?: string): Promise<AdCampaignsResponse> {
  const params = platform ? `?platform=${platform}` : "";
  return apiFetch<AdCampaignsResponse>(`/admin/advertising/campaigns${params}`);
}

export async function getAdCampaign(id: string): Promise<AdCampaign> {
  return apiFetch<AdCampaign>(`/admin/advertising/campaigns/${id}`);
}

export async function pauseAdCampaign(id: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/admin/advertising/campaigns/${id}/pause`, { method: "POST" });
}

export async function resumeAdCampaign(id: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/admin/advertising/campaigns/${id}/resume`, { method: "POST" });
}

export async function getAdCampaignMetrics(id: string, days?: number): Promise<any> {
  const params = days ? `?days=${days}` : "";
  return apiFetch(`/admin/advertising/campaigns/${id}/metrics${params}`);
}

export async function getAdPerformanceOverview(days?: number): Promise<any> {
  const params = days ? `?days=${days}` : "";
  return apiFetch(`/admin/advertising/campaigns/overview${params}`);
}

export interface CatalogSync {
  id: string;
  platform: string;
  catalogId: string | null;
  catalogName: string | null;
  status: string;
  totalProducts: number;
  syncedProducts: number;
  failedProducts: number;
  lastSyncAt: string | null;
  syncFrequency: string;
  errorMessage: string | null;
}

export async function getAdCatalogSyncs(): Promise<{ catalogs: CatalogSync[]; count: number }> {
  return apiFetch("/admin/advertising/catalogs");
}

export async function triggerCatalogSync(connectionId: string): Promise<{ id: string; status: string; message: string }> {
  return apiFetch(`/admin/advertising/catalogs/${connectionId}/sync`, { method: "POST" });
}

// ============================================================================
// Abandoned Cart Recovery APIs
// ============================================================================

export interface AbandonedCartStats {
  totalAbandoned: number;
  totalSent: number;
  totalRecovered: number;
  recoveryRate: number;
  sentLast24h: number;
  recoveredLast24h: number;
}

export interface AbandonedCartNotification {
  id: string;
  cartId: string;
  customerId: string | null;
  email: string;
  notificationNumber: number;
  status: string;
  recoveryToken: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  recoveredAt: string | null;
  createdAt: string;
}

export async function getAbandonedCartStats(): Promise<AbandonedCartStats> {
  return apiFetch<AbandonedCartStats>("/admin/marketing/abandoned-carts/stats");
}

export async function getAbandonedCartNotifications(): Promise<{ notifications: AbandonedCartNotification[]; count: number }> {
  return apiFetch("/admin/marketing/abandoned-carts");
}
