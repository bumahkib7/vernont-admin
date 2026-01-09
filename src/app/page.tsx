"use client";

import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  Truck,
  RefreshCw,
} from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useActivityEvents } from "@/hooks/use-activity-events";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/api";
import { Wifi, WifiOff, Radio } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge className="bg-green-50 text-green-700 border-green-200 font-normal">Completed</Badge>;
    case "processing":
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-normal">Processing</Badge>;
    case "pending":
      return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-normal">Pending</Badge>;
    case "shipped":
      return <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-normal">Shipped</Badge>;
    case "canceled":
    case "cancelled":
      return <Badge className="bg-red-50 text-red-700 border-red-200 font-normal">Canceled</Badge>;
    default:
      return <Badge variant="outline" className="font-normal">{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatRelativeTime(timestamp: string) {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-20" />
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

export default function DashboardPage() {
  const { stats, isLoading, isError, error, refetch } = useDashboard();
  const { activities, connectionStatus, isConnected } = useActivityEvents();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

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
    <div className="flex flex-col gap-8 p-6 lg:p-8">
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

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-small-regular text-muted-foreground">Today&apos;s Revenue</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <span className="text-2xl-semi">{formatPrice(stats?.revenue.today || 0)}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-small-regular">
              {stats?.revenue.trend === "up" ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-green-600">+{stats?.revenue.changePercent}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-red-600">{stats?.revenue.changePercent}%</span>
                </>
              )}
              <span className="text-muted-foreground">from yesterday</span>
            </div>
          </div>
        )}

        {/* Orders */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-small-regular text-muted-foreground">Today&apos;s Orders</span>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <span className="text-2xl-semi">{stats?.orders.today || 0}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-small-regular text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {stats?.orders.pending || 0} pending
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {stats?.orders.processing || 0} processing
              </span>
            </div>
          </div>
        )}

        {/* Customers */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-small-regular text-muted-foreground">Total Customers</span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <span className="text-2xl-semi">{stats?.customers.total.toLocaleString() || 0}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-small-regular">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600">+{stats?.customers.newThisWeek || 0}</span>
              <span className="text-muted-foreground">new this week</span>
            </div>
          </div>
        )}

        {/* Products */}
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <span className="text-small-regular text-muted-foreground">Active Products</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3">
              <span className="text-2xl-semi">{stats?.products.total || 0}</span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-small-regular">
              {(stats?.products.lowStock || 0) > 0 ? (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
                  <span className="text-yellow-600">{stats?.products.lowStock} low stock</span>
                </>
              ) : (
                <span className="text-muted-foreground">All stocked</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders - Takes 2 columns */}
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
                  <div className="flex items-center gap-4">
                    {/* Product Thumbnails */}
                    <div className="flex -space-x-2">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base-semi">{order.displayId}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-small-regular text-muted-foreground mt-0.5">
                        {order.customerName} · {formatDate(order.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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

        {/* Activity Feed */}
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
                  <Badge className="bg-green-50 text-green-700 border-green-200 font-normal flex items-center gap-1">
                    <Radio className="h-3 w-3 animate-pulse" />
                    Live
                  </Badge>
                ) : connectionStatus === "polling" ? (
                  <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 font-normal flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Polling
                  </Badge>
                ) : (
                  <Badge className="bg-gray-50 text-gray-700 border-gray-200 font-normal flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </Badge>
                )}
              </div>
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
            ) : activities.length > 0 ? (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`p-4 transition-colors ${index === 0 && isConnected ? "bg-green-50/50" : ""}`}
                >
                  <p className="text-small-regular">{activity.message}</p>
                  <p className="text-xsmall-regular text-muted-foreground mt-1">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/products/new"
          className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-base-semi">Add Product</span>
            <p className="text-small-regular text-muted-foreground">Create a new listing</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/orders"
          className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-base-semi">View Orders</span>
            <p className="text-small-regular text-muted-foreground">{stats?.orders.pending || 0} pending</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/inventory"
          className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Truck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-base-semi">Inventory</span>
            <p className="text-small-regular text-muted-foreground">{stats?.products.lowStock || 0} low stock</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        <Link
          href="/customers"
          className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <span className="text-base-semi">Customers</span>
            <p className="text-small-regular text-muted-foreground">{stats?.customers.total.toLocaleString() || 0} total</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
