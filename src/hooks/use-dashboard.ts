"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getDashboardRecentOrders,
  getDashboardActivity,
  getDashboardKpis,
  getDashboardAnalytics,
  type DashboardStats,
  type RecentOrderSummary,
  type ActivityItem,
  type KpiData,
  type AnalyticsData,
} from "@/lib/api";

/**
 * Hook for fetching comprehensive dashboard statistics
 * Auto-refreshes every 30 seconds
 */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Auto-refresh every 30s
    staleTime: 10000, // Consider data stale after 10s
  });
}

/**
 * Hook for fetching recent orders
 */
export function useRecentOrders(limit: number = 10) {
  return useQuery<RecentOrderSummary[]>({
    queryKey: ["dashboard", "recent-orders", limit],
    queryFn: () => getDashboardRecentOrders(limit),
    staleTime: 15000,
  });
}

/**
 * Hook for fetching activity feed
 * Note: For real-time updates, use useActivityEvents hook instead.
 * This is a fallback for HTTP polling at 2-minute intervals.
 */
export function useActivityFeed(limit: number = 20, enabled: boolean = true) {
  return useQuery<ActivityItem[]>({
    queryKey: ["dashboard", "activity", limit],
    queryFn: () => getDashboardActivity(limit),
    staleTime: 30000,
    refetchInterval: 120000, // Refresh activity every 2 minutes (fallback)
    enabled,
  });
}

/**
 * Hook for fetching KPIs with period selection
 */
export function useDashboardKpis(period: "7d" | "30d" | "90d" | "12m" = "30d") {
  return useQuery<KpiData>({
    queryKey: ["dashboard", "kpis", period],
    queryFn: () => getDashboardKpis(period),
    staleTime: 60000, // KPIs don't change as frequently
  });
}

/**
 * Hook for fetching analytics data with period selection
 */
export function useAnalytics(period: "7d" | "30d" | "90d" | "12m" = "30d") {
  return useQuery<AnalyticsData>({
    queryKey: ["dashboard", "analytics", period],
    queryFn: () => getDashboardAnalytics(period),
    staleTime: 60000,
  });
}

/**
 * Combined hook for the main dashboard page
 * Returns all dashboard data in one call
 */
export function useDashboard() {
  const statsQuery = useDashboardStats();

  return {
    stats: statsQuery.data,
    isLoading: statsQuery.isLoading,
    isError: statsQuery.isError,
    error: statsQuery.error,
    refetch: statsQuery.refetch,
  };
}
