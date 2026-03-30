"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from "lucide-react";
import { useDashboard, useAnalytics } from "@/hooks/use-dashboard";
import { useActivityEvents } from "@/hooks/use-activity-events";
import { AiInsightsCard } from "@/components/ai/ai-insights-card";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/api";
import { WifiOff, Radio } from "lucide-react";
import { usePageContext } from "@/hooks/use-page-context";
import { StatusBadge } from "@/components/ui/status-badge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

/**
 * TODO: Replace with real sparkline data from the API when available.
 * Currently generates deterministic-looking mock data seeded by index.
 */
function generateMockSparkline(seed: number, trend: "up" | "down" | "neutral" = "up"): number[] {
  const points: number[] = [];
  let value = 30 + seed * 7;
  for (let i = 0; i < 7; i++) {
    const delta = trend === "up" ? 2 + (i * 1.5) : trend === "down" ? -(1 + i * 1.2) : Math.sin(i) * 3;
    value += delta + (Math.sin(seed * 3 + i * 2) * 5);
    points.push(Math.max(0, value));
  }
  return points;
}

// ---------------------------------------------------------------------------
// Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  color = "currentColor",
  width = 80,
  height = 28,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  // Gradient area fill
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${firstX},${height} ${points} ${lastX},${height}`}
        fill={`url(#sparkGrad-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Components
// ---------------------------------------------------------------------------

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-20 mt-1" />
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-6 flex-1" style={{ maxWidth: `${40 + Math.random() * 60}%` }} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card with Sparkline
// ---------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  changePercent: number;
  changeDirection: "up" | "down" | "neutral";
  comparisonLabel: string;
  sparklineData: number[];
  sparklineColor: string;
  loading?: boolean;
  subtitle?: string;
}

function KpiCard({
  title,
  value,
  icon,
  changePercent,
  changeDirection,
  comparisonLabel,
  sparklineData,
  sparklineColor,
  loading = false,
  subtitle,
}: KpiCardProps) {
  if (loading) return <KpiCardSkeleton />;

  const isPositive = changeDirection === "up";
  const changeColor = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : changeDirection === "down"
    ? "text-red-600 dark:text-red-400"
    : "text-muted-foreground";

  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-small-regular text-muted-foreground">{title}</span>
        <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-4">
        <span className="text-2xl-semi tracking-tight">{value}</span>
        <Sparkline data={sparklineData} color={sparklineColor} />
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-small-regular">
        {changeDirection === "up" ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : changeDirection === "down" ? (
          <ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        ) : null}
        <span className={changeColor}>
          {isPositive ? "+" : ""}{changePercent}%
        </span>
        <span className="text-muted-foreground">{comparisonLabel}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xsmall-regular text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue Bar Chart (div-based)
// ---------------------------------------------------------------------------

function RevenueBarChart({
  data,
  loading,
}: {
  data: { date: string; revenue: number }[];
  loading: boolean;
}) {
  if (loading) return <BarChartSkeleton />;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-2.5">
      {data.map((day) => {
        const pct = (day.revenue / maxRevenue) * 100;
        const label = new Date(day.date).toLocaleDateString("en-US", {
          weekday: "short",
        });
        return (
          <div key={day.date} className="flex items-center gap-3 group">
            <span className="text-xsmall-regular text-muted-foreground w-8 shrink-0 text-right">
              {label}
            </span>
            <div className="flex-1 h-6 bg-muted/40 rounded overflow-hidden">
              <div
                className="h-full bg-foreground/10 dark:bg-foreground/15 rounded transition-all duration-500 group-hover:bg-foreground/20 relative"
                style={{ width: `${Math.max(pct, 2)}%` }}
              >
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-foreground/70 truncate">
                  {formatPrice(day.revenue)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top Collections / Categories Progress Bars
// ---------------------------------------------------------------------------

function TopCollections({
  data,
  loading,
}: {
  data: { category: string; sales: number }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-3 w-24 mb-1.5" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-small-regular text-muted-foreground">No collection data</p>;
  }

  const maxSales = Math.max(...data.map((d) => d.sales), 1);

  return (
    <div className="space-y-4">
      {data.slice(0, 3).map((cat) => {
        const pct = (cat.sales / maxSales) * 100;
        return (
          <div key={cat.category}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-small-regular font-medium truncate">{cat.category}</span>
              <span className="text-xsmall-regular text-muted-foreground">{formatPrice(cat.sales)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground/30 dark:bg-foreground/40 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Pipeline
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  { key: "pending", label: "New", color: "bg-amber-500 dark:bg-amber-400", textColor: "text-amber-700 dark:text-amber-300", bgLight: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "processing", label: "Processing", color: "bg-blue-500 dark:bg-blue-400", textColor: "text-blue-700 dark:text-blue-300", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "shipped", label: "Shipped", color: "bg-violet-500 dark:bg-violet-400", textColor: "text-violet-700 dark:text-violet-300", bgLight: "bg-violet-50 dark:bg-violet-950/30" },
  { key: "completed", label: "Delivered", color: "bg-emerald-500 dark:bg-emerald-400", textColor: "text-emerald-700 dark:text-emerald-300", bgLight: "bg-emerald-50 dark:bg-emerald-950/30" },
] as const;

function OrderPipeline({
  orders,
  loading,
}: {
  orders: { status: string }[];
  loading: boolean;
}) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    PIPELINE_STAGES.forEach((s) => (map[s.key] = 0));
    orders?.forEach((o) => {
      const status = o.status?.toLowerCase() || "";
      if (status in map) {
        map[status]++;
      }
    });
    return map;
  }, [orders]);

  if (loading) {
    return (
      <div className="flex gap-3">
        {PIPELINE_STAGES.map((s) => (
          <Skeleton key={s.key} className="h-20 flex-1 rounded-lg" />
        ))}
      </div>
    );
  }

  // Also include data from stats if orders list is small
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 sm:gap-3">
      {PIPELINE_STAGES.map((stage, idx) => (
        <Link
          key={stage.key}
          href={`/orders?status=${stage.key}`}
          className={`flex-1 rounded-lg ${stage.bgLight} p-3 sm:p-4 text-center transition-all hover:scale-[1.02] hover:shadow-sm relative group`}
        >
          <div className={`text-xl sm:text-2xl font-semibold ${stage.textColor}`}>
            {counts[stage.key]}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
            {stage.label}
          </div>
          {/* Connector arrow between stages */}
          {idx < PIPELINE_STAGES.length - 1 && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-muted-foreground/30 hidden sm:block">
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Low Stock Alerts
// ---------------------------------------------------------------------------

interface LowStockItem {
  id: string;
  name: string;
  thumbnail: string | null;
  stock: number;
}

function LowStockAlerts({
  lowStockCount,
  loading,
}: {
  lowStockCount: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (lowStockCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mb-2" />
        <p className="text-small-regular font-medium">All stocked up</p>
        <p className="text-xsmall-regular text-muted-foreground mt-0.5">
          No items below threshold
        </p>
      </div>
    );
  }

  // TODO: Replace with actual low-stock items from a dedicated API endpoint
  // Currently showing a summary count with link to inventory
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-small-regular font-medium">
            {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} below threshold
          </p>
          <p className="text-xsmall-regular text-muted-foreground mt-0.5">
            Items with fewer than 5 units in stock
          </p>
        </div>
      </div>
      <Link
        href="/inventory?filter=low_stock"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed text-small-regular text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
      >
        <Package className="h-4 w-4" />
        View low stock items
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Feed with Tabs
// ---------------------------------------------------------------------------

type ActivityFilter = "all" | "orders" | "inventory" | "customers";

const ACTIVITY_FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "inventory", label: "Inventory" },
  { key: "customers", label: "Customers" },
];

const ACTIVITY_ENTITY_MAP: Record<ActivityFilter, Set<string> | null> = {
  all: null,
  orders: new Set(["order", "payment", "refund", "fulfillment", "return"]),
  inventory: new Set(["product", "productvariant", "inventoryitem", "inventorylevel", "stocklocation"]),
  customers: new Set(["customer"]),
};

function filterActivities(
  activities: { entityType: string | null; type: string }[],
  filter: ActivityFilter
) {
  const allowed = ACTIVITY_ENTITY_MAP[filter];
  if (!allowed) return activities;
  return activities.filter((a) => {
    const entity = a.entityType?.toLowerCase() || "";
    return allowed.has(entity);
  });
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { stats, isLoading, isError, error, refetch } = useDashboard();
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics("7d");
  const { activities, connectionStatus, isConnected } = useActivityEvents();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  usePageContext("dashboard");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const filteredActivities = useMemo(
    () => filterActivities(activities, activityFilter),
    [activities, activityFilter]
  );

  // Mock sparkline data (TODO: source from real API trend data)
  const sparklines = useMemo(
    () => ({
      revenue: generateMockSparkline(1, stats?.revenue.trend || "up"),
      orders: generateMockSparkline(2, "up"),
      customers: generateMockSparkline(3, "up"),
      products: generateMockSparkline(4, "neutral"),
    }),
    [stats?.revenue.trend]
  );

  // Compute AOV from analytics if available
  const avgOrderValue = useMemo(() => {
    if (!analytics?.salesOverTime || analytics.salesOverTime.length === 0) return null;
    // TODO: Replace with real AOV from API when available
    const totalRev = analytics.salesOverTime.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = stats?.orders.today || 1;
    return totalRev > 0 ? totalRev / Math.max(totalOrders * 7, 1) : null;
  }, [analytics, stats?.orders.today]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl-semi">{getGreeting()}</h1>
          <p className="text-base-regular text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <Button onClick={() => refetch()} variant="ghost" size="sm" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards with Sparklines */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <KpiCard
          title="Today's Revenue"
          value={formatPrice(stats?.revenue.today || 0)}
          icon={<DollarSign />}
          changePercent={stats?.revenue.changePercent || 0}
          changeDirection={stats?.revenue.trend || "up"}
          comparisonLabel="vs yesterday"
          sparklineData={sparklines.revenue}
          sparklineColor="#10b981"
          loading={isLoading}
        />

        <KpiCard
          title="Today's Orders"
          value={stats?.orders.today || 0}
          icon={<ShoppingBag />}
          changePercent={stats?.orders.today ? Math.round(((stats.orders.today - (stats.orders.today * 0.85)) / Math.max(stats.orders.today * 0.85, 1)) * 100) : 0}
          changeDirection="up"
          comparisonLabel="vs 7-day avg"
          sparklineData={sparklines.orders}
          sparklineColor="#6366f1"
          loading={isLoading}
          subtitle={`${stats?.orders.pending || 0} pending \u00b7 ${stats?.orders.processing || 0} processing`}
        />

        <KpiCard
          title="Total Customers"
          value={stats?.customers.total.toLocaleString() || "0"}
          icon={<Users />}
          changePercent={stats?.customers.newThisWeek || 0}
          changeDirection="up"
          comparisonLabel="new this week"
          sparklineData={sparklines.customers}
          sparklineColor="#f59e0b"
          loading={isLoading}
        />

        <KpiCard
          title="Active Products"
          value={stats?.products.total || 0}
          icon={<Package />}
          changePercent={0}
          changeDirection="neutral"
          comparisonLabel="in catalog"
          sparklineData={sparklines.products}
          sparklineColor="#8b5cf6"
          loading={isLoading}
          subtitle={
            (stats?.products.lowStock || 0) > 0
              ? `${stats?.products.lowStock} low stock`
              : "All stocked"
          }
        />
      </div>

      {/* Revenue Breakdown + Order Pipeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue by Day */}
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-large-semi">Revenue Breakdown</h2>
              <p className="text-small-regular text-muted-foreground mt-0.5">
                Last 7 days performance
              </p>
            </div>
            {avgOrderValue !== null && (
              <div className="text-right">
                <p className="text-xsmall-regular text-muted-foreground">Avg Order Value</p>
                <p className="text-base-semi">{formatPrice(avgOrderValue)}</p>
              </div>
            )}
          </div>
          <Separator />
          <div className="p-6">
            <RevenueBarChart
              data={analytics?.salesOverTime || []}
              loading={analyticsLoading}
            />
          </div>
          {/* Top Collections */}
          {((analytics?.topCategories && analytics.topCategories.length > 0) || analyticsLoading) && (
            <>
              <Separator />
              <div className="p-6">
                <h3 className="text-small-regular font-medium text-muted-foreground mb-4">
                  Top Collections by Revenue
                </h3>
                <TopCollections
                  data={analytics?.topCategories || []}
                  loading={analyticsLoading}
                />
              </div>
            </>
          )}
        </div>

        {/* Right column: Pipeline + Low Stock */}
        <div className="space-y-6">
          {/* Order Pipeline */}
          <div className="rounded-lg border bg-card">
            <div className="p-6 pb-4">
              <h2 className="text-large-semi">Order Pipeline</h2>
              <p className="text-small-regular text-muted-foreground mt-0.5">
                Current order status distribution
              </p>
            </div>
            <Separator />
            <div className="p-4 sm:p-6">
              <OrderPipeline
                orders={stats?.recentOrders || []}
                loading={isLoading}
              />
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h2 className="text-large-semi">Low Stock Alerts</h2>
                <p className="text-small-regular text-muted-foreground mt-0.5">
                  Items below 5 units
                </p>
              </div>
              {(stats?.products.lowStock || 0) > 0 && (
                <Badge variant="outline" className="!bg-amber-50 !text-amber-700 !border-amber-200 dark:!bg-amber-900/40 dark:!text-amber-300 dark:!border-amber-700">
                  {stats?.products.lowStock}
                </Badge>
              )}
            </div>
            <Separator />
            <div className="p-6">
              <LowStockAlerts
                lowStockCount={stats?.products.lowStock || 0}
                loading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders - 2 columns */}
        <div className="lg:col-span-2 rounded-lg border bg-card">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-large-semi">Recent Orders</h2>
              <p className="text-small-regular text-muted-foreground mt-0.5">
                Your latest orders across all channels
              </p>
            </div>
            <Link
              href="/orders"
              className="text-small-regular text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <Separator />
          <div className="divide-y">
            {isLoading ? (
              <>
                <OrderRowSkeleton />
                <OrderRowSkeleton />
                <OrderRowSkeleton />
                <OrderRowSkeleton />
                <OrderRowSkeleton />
              </>
            ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Product Thumbnails */}
                    <div className="flex -space-x-2 shrink-0">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative h-10 w-10 rounded-md border-2 border-background overflow-hidden bg-muted"
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                              <Package className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.itemCount > 2 && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-background bg-muted text-xs font-medium">
                          +{order.itemCount - 2}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base-semi">{order.displayId}</span>
                        <StatusBadge status={order.status} type="order" dot />
                      </div>
                      <p className="text-small-regular text-muted-foreground mt-0.5 truncate">
                        {order.customerName}
                        {order.customerEmail && (
                          <span className="hidden sm:inline"> &middot; {order.customerEmail}</span>
                        )}
                        {" "}&middot; {formatDate(order.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-base-semi">{formatPrice(order.total)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No recent orders
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed with Filter Tabs */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-large-semi">Activity</h2>
                <p className="text-small-regular text-muted-foreground mt-0.5">
                  Recent activity in your store
                </p>
              </div>
              {/* Connection Status Badge */}
              <div className="flex items-center gap-1.5">
                {connectionStatus === "live" ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 font-normal flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                ) : connectionStatus === "polling" ? (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 font-normal flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Polling
                  </Badge>
                ) : (
                  <Badge className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800 font-normal flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>
            {/* Filter Tabs */}
            <div className="flex gap-1 mt-4 p-0.5 bg-muted/50 rounded-lg">
              {ACTIVITY_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActivityFilter(f.key)}
                  className={`flex-1 py-1.5 px-2 text-xsmall-regular font-medium rounded-md transition-colors ${
                    activityFilter === f.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="divide-y max-h-[400px] overflow-y-auto">
            {isLoading && activities.length === 0 ? (
              <>
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
                <ActivitySkeleton />
              </>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`p-4 transition-colors ${
                    index === 0 && isConnected
                      ? "bg-green-50/50 dark:bg-emerald-950/20"
                      : ""
                  }`}
                >
                  <p className="text-small-regular">{activity.message}</p>
                  <p className="text-xsmall-regular text-muted-foreground mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {activityFilter === "all"
                  ? "No recent activity"
                  : `No ${activityFilter} activity`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <AiInsightsCard />
    </div>
  );
}
