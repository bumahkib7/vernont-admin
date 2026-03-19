import { apiFetch } from "./client";

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
// Advanced Analytics API
// =============================================================================

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "1y" | "custom";

export interface AdvancedAnalyticsParams {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  compare?: boolean;
}

export interface RevenueTimePoint {
  date: string;
  revenue: number;
  previousRevenue?: number;
}

export interface OrdersTimePoint {
  date: string;
  orders: number;
}

export interface CategoryRevenue {
  name: string;
  revenue: number;
  percentage: number;
  fill?: string;
}

export interface TopProductRow {
  id: string;
  name: string;
  sku: string;
  revenue: number;
  orders: number;
  avgPrice: number;
}

export interface TopCustomerRow {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface ChannelRevenue {
  channel: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface CustomerAcquisitionPoint {
  date: string;
  newCustomers: number;
  returningCustomers: number;
}

export interface FunnelStep {
  name: string;
  value: number;
  dropOff: number;
}

export interface AdvancedKpiData {
  totalRevenue: KpiItem;
  totalOrders: KpiItem;
  avgOrderValue: KpiItem;
  conversionRate: KpiItem;
}

export interface AdvancedAnalyticsData {
  kpis: AdvancedKpiData;
  revenueOverTime: RevenueTimePoint[];
  ordersOverTime: OrdersTimePoint[];
  revenueByCategory: CategoryRevenue[];
  topProducts: TopProductRow[];
  topCustomers: TopCustomerRow[];
  channelRevenue: ChannelRevenue[];
  customerAcquisition: CustomerAcquisitionPoint[];
  conversionFunnel: FunnelStep[];
}

function buildAnalyticsQueryString(params: AdvancedAnalyticsParams): string {
  const query = new URLSearchParams({ period: params.period });
  if (params.startDate) query.append("startDate", params.startDate);
  if (params.endDate) query.append("endDate", params.endDate);
  if (params.compare) query.append("compare", "true");
  return query.toString();
}

export async function getAdvancedAnalytics(params: AdvancedAnalyticsParams): Promise<AdvancedAnalyticsData> {
  return apiFetch<AdvancedAnalyticsData>(`/admin/analytics/advanced?${buildAnalyticsQueryString(params)}`);
}
