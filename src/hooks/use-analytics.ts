"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdvancedAnalytics,
  type AdvancedAnalyticsParams,
  type AdvancedAnalyticsData,
  type AnalyticsPeriod,
  type RevenueTimePoint,
  type OrdersTimePoint,
  type CategoryRevenue,
  type TopProductRow,
  type TopCustomerRow,
  type ChannelRevenue,
  type CustomerAcquisitionPoint,
  type FunnelStep,
  type AdvancedKpiData,
} from "@/lib/api";

// Re-export types for convenience
export type {
  AdvancedAnalyticsData,
  AnalyticsPeriod,
  RevenueTimePoint,
  OrdersTimePoint,
  CategoryRevenue,
  TopProductRow,
  TopCustomerRow,
  ChannelRevenue,
  CustomerAcquisitionPoint,
  FunnelStep,
  AdvancedKpiData,
};

/**
 * Generate mock analytics data for development/demo when the API
 * endpoint is not yet available.
 */
function generateMockData(params: AdvancedAnalyticsParams): AdvancedAnalyticsData {
  const days = params.period === "today" ? 24 : params.period === "7d" ? 7 : params.period === "30d" ? 30 : params.period === "90d" ? 90 : 365;
  const isHourly = params.period === "today";

  const revenueOverTime: RevenueTimePoint[] = [];
  const ordersOverTime: OrdersTimePoint[] = [];
  const customerAcquisition: CustomerAcquisitionPoint[] = [];

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    let label: string;
    if (isHourly) {
      d.setHours(d.getHours() - i);
      label = `${d.getHours().toString().padStart(2, "0")}:00`;
    } else {
      d.setDate(d.getDate() - i);
      label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    const baseRev = 8000 + Math.random() * 12000;
    const rev = Math.round(baseRev * 100);
    const prevRev = params.compare ? Math.round((baseRev * (0.8 + Math.random() * 0.4)) * 100) : undefined;

    revenueOverTime.push({ date: label, revenue: rev, previousRevenue: prevRev });
    ordersOverTime.push({ date: label, orders: Math.round(20 + Math.random() * 40) });
    customerAcquisition.push({
      date: label,
      newCustomers: Math.round(5 + Math.random() * 20),
      returningCustomers: Math.round(10 + Math.random() * 30),
    });
  }

  const totalRev = revenueOverTime.reduce((s, p) => s + p.revenue, 0);
  const totalOrd = ordersOverTime.reduce((s, p) => s + p.orders, 0);

  return {
    kpis: {
      totalRevenue: { value: totalRev, change: 12.5, trend: "up" },
      totalOrders: { value: totalOrd, change: 8.3, trend: "up" },
      avgOrderValue: { value: totalOrd > 0 ? Math.round(totalRev / totalOrd) : 0, change: 3.7, trend: "up" },
      conversionRate: { value: 3.42, change: -0.8, trend: "down" },
    },
    revenueOverTime,
    ordersOverTime,
    revenueByCategory: [
      { name: "Handbags", revenue: Math.round(totalRev * 0.35), percentage: 35 },
      { name: "Shoes", revenue: Math.round(totalRev * 0.22), percentage: 22 },
      { name: "Watches", revenue: Math.round(totalRev * 0.18), percentage: 18 },
      { name: "Clothing", revenue: Math.round(totalRev * 0.15), percentage: 15 },
      { name: "Accessories", revenue: Math.round(totalRev * 0.10), percentage: 10 },
    ],
    topProducts: [
      { id: "1", name: "Louis Vuitton Neverfull MM", sku: "LV-NF-001", revenue: 245000, orders: 35, avgPrice: 7000 },
      { id: "2", name: "Chanel Classic Flap Medium", sku: "CH-CF-002", revenue: 198000, orders: 22, avgPrice: 9000 },
      { id: "3", name: "Hermes Birkin 30", sku: "HM-BK-003", revenue: 175000, orders: 12, avgPrice: 14583 },
      { id: "4", name: "Rolex Submariner Date", sku: "RX-SD-004", revenue: 156000, orders: 13, avgPrice: 12000 },
      { id: "5", name: "Gucci GG Marmont Mini", sku: "GC-MM-005", revenue: 134000, orders: 45, avgPrice: 2978 },
      { id: "6", name: "Dior Lady Dior Medium", sku: "DR-LD-006", revenue: 112000, orders: 20, avgPrice: 5600 },
      { id: "7", name: "Prada Re-Nylon Backpack", sku: "PR-RN-007", revenue: 98000, orders: 38, avgPrice: 2579 },
      { id: "8", name: "Cartier Love Bracelet", sku: "CT-LB-008", revenue: 87000, orders: 15, avgPrice: 5800 },
      { id: "9", name: "Balenciaga Speed Trainer", sku: "BL-ST-009", revenue: 76000, orders: 42, avgPrice: 1810 },
      { id: "10", name: "Saint Laurent Sac de Jour", sku: "SL-SJ-010", revenue: 65000, orders: 18, avgPrice: 3611 },
    ],
    topCustomers: [
      { id: "c1", name: "Sarah Chen", email: "sarah.chen@email.com", totalSpent: 45200, orderCount: 8, lastOrderDate: "2026-03-12" },
      { id: "c2", name: "Michael Ross", email: "m.ross@email.com", totalSpent: 38700, orderCount: 5, lastOrderDate: "2026-03-10" },
      { id: "c3", name: "Aisha Patel", email: "aisha.p@email.com", totalSpent: 32400, orderCount: 12, lastOrderDate: "2026-03-14" },
      { id: "c4", name: "James Wilson", email: "j.wilson@email.com", totalSpent: 28900, orderCount: 4, lastOrderDate: "2026-03-08" },
      { id: "c5", name: "Elena Volkov", email: "e.volkov@email.com", totalSpent: 25600, orderCount: 7, lastOrderDate: "2026-03-11" },
      { id: "c6", name: "David Kim", email: "d.kim@email.com", totalSpent: 22100, orderCount: 6, lastOrderDate: "2026-03-09" },
      { id: "c7", name: "Olivia Martinez", email: "o.martinez@email.com", totalSpent: 19800, orderCount: 3, lastOrderDate: "2026-03-13" },
      { id: "c8", name: "Thomas Brown", email: "t.brown@email.com", totalSpent: 17500, orderCount: 9, lastOrderDate: "2026-03-07" },
      { id: "c9", name: "Yuki Tanaka", email: "y.tanaka@email.com", totalSpent: 15200, orderCount: 5, lastOrderDate: "2026-03-06" },
      { id: "c10", name: "Priya Sharma", email: "p.sharma@email.com", totalSpent: 13800, orderCount: 4, lastOrderDate: "2026-03-05" },
    ],
    channelRevenue: [
      { channel: "Online Store", revenue: Math.round(totalRev * 0.55), orders: Math.round(totalOrd * 0.50), percentage: 55 },
      { channel: "Mobile App", revenue: Math.round(totalRev * 0.25), orders: Math.round(totalOrd * 0.30), percentage: 25 },
      { channel: "Marketplace", revenue: Math.round(totalRev * 0.12), orders: Math.round(totalOrd * 0.12), percentage: 12 },
      { channel: "In-Store", revenue: Math.round(totalRev * 0.08), orders: Math.round(totalOrd * 0.08), percentage: 8 },
    ],
    customerAcquisition,
    conversionFunnel: [
      { name: "Visits", value: 52400, dropOff: 0 },
      { name: "Add to Cart", value: 8640, dropOff: 83.5 },
      { name: "Checkout Started", value: 4320, dropOff: 50.0 },
      { name: "Payment", value: 2160, dropOff: 50.0 },
      { name: "Order Completed", value: 1792, dropOff: 17.0 },
    ],
  };
}

/**
 * Hook for fetching advanced analytics data.
 * Falls back to mock data if the API endpoint is not available.
 */
export function useAdvancedAnalytics(params: AdvancedAnalyticsParams) {
  return useQuery<AdvancedAnalyticsData>({
    queryKey: ["analytics", "advanced", params.period, params.startDate, params.endDate, params.compare],
    queryFn: async () => {
      try {
        return await getAdvancedAnalytics(params);
      } catch {
        // Fallback to mock data if the endpoint doesn't exist yet
        return generateMockData(params);
      }
    },
    staleTime: 60000,
  });
}
