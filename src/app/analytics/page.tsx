"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from "lucide-react";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart";
import { useDashboardKpis, useAnalytics } from "@/hooks/use-dashboard";

type Period = "7d" | "30d" | "90d" | "12m";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100); // Assuming amounts are in cents
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function KpiCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full flex items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");

  const {
    data: kpis,
    isLoading: kpisLoading,
    isError: kpisError,
    refetch: refetchKpis
  } = useDashboardKpis(period);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isError: analyticsError,
    refetch: refetchAnalytics
  } = useAnalytics(period);

  const isLoading = kpisLoading || analyticsLoading;
  const isError = kpisError || analyticsError;

  const handleRefresh = () => {
    refetchKpis();
    refetchAnalytics();
  };

  const periodLabel = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
    "12m": "last 12 months",
  }[period];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Failed to load analytics data</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your store performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(kpis?.totalRevenue.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {kpis?.totalRevenue.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpis?.totalRevenue.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(kpis?.totalRevenue.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(Number(kpis?.totalOrders.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {kpis?.totalOrders.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpis?.totalOrders.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(kpis?.totalOrders.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(Number(kpis?.newCustomers.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {kpis?.newCustomers.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpis?.newCustomers.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(kpis?.newCustomers.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Number(kpis?.conversionRate.value || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {kpis?.conversionRate.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : kpis?.conversionRate.trend === "down" ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span className={
                    kpis?.conversionRate.trend === "up" ? "text-green-500" :
                    kpis?.conversionRate.trend === "down" ? "text-red-500" :
                    "text-muted-foreground"
                  }>
                    {formatPercent(kpis?.conversionRate.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : (
              <SalesChart data={analytics?.salesOverTime || []} />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your customers come from</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : (
              <TrafficChart />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts & Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Sales by fragrance type</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <ChartSkeleton />
            ) : (
              <TopCategoriesChart data={analytics?.topCategories || []} />
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling fragrances</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : analytics?.topProducts && analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => {
                  const maxRevenue = Math.max(...analytics.topProducts.map(p => p.revenue));
                  const percentage = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div key={product.name} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground w-4">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[200px]">{product.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(product.revenue)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {product.orders} orders
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
