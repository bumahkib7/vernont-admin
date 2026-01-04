import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Mock data
const stats = {
  revenue: {
    today: 12580,
    change: 12.5,
    trend: "up" as const,
  },
  orders: {
    today: 24,
    pending: 8,
    processing: 12,
  },
  customers: {
    total: 1234,
    new: 18,
  },
  products: {
    total: 156,
    lowStock: 5,
  },
};

const recentOrders = [
  {
    id: "ORD-001",
    displayId: "#1001",
    customer: "Olivia Martin",
    date: "2024-01-15",
    total: 12500,
    status: "processing",
    items: [
      { name: "Hermès Birkin 25", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=80&h=80&fit=crop" },
    ],
  },
  {
    id: "ORD-002",
    displayId: "#1002",
    customer: "Jackson Lee",
    date: "2024-01-15",
    total: 8200,
    status: "pending",
    items: [
      { name: "Chanel Classic Flap", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=80&h=80&fit=crop" },
      { name: "Chanel Wallet", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=80&h=80&fit=crop" },
    ],
  },
  {
    id: "ORD-003",
    displayId: "#1003",
    customer: "Isabella Nguyen",
    date: "2024-01-14",
    total: 2100,
    status: "shipped",
    items: [
      { name: "Louis Vuitton Neverfull", image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=80&h=80&fit=crop" },
    ],
  },
  {
    id: "ORD-004",
    displayId: "#1004",
    customer: "William Kim",
    date: "2024-01-14",
    total: 3450,
    status: "completed",
    items: [
      { name: "Gucci Dionysus", image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=80&h=80&fit=crop" },
    ],
  },
  {
    id: "ORD-005",
    displayId: "#1005",
    customer: "Sofia Davis",
    date: "2024-01-13",
    total: 5800,
    status: "completed",
    items: [
      { name: "Dior Lady Dior", image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=80&h=80&fit=crop" },
    ],
  },
];

const activityFeed = [
  {
    id: 1,
    type: "order",
    message: "New order #1001 from Olivia Martin",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "customer",
    message: "New customer registration: Emma Wilson",
    time: "15 minutes ago",
  },
  {
    id: 3,
    type: "stock",
    message: "Low stock alert: Hermès Birkin 25 (2 remaining)",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "order",
    message: "Order #998 has been shipped",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "review",
    message: "New 5-star review on Chanel Classic Flap",
    time: "3 hours ago",
  },
];

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
    default:
      return <Badge variant="outline" className="font-normal">{status}</Badge>;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl-semi">Good morning</h1>
        <p className="text-base-regular text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-small-regular text-muted-foreground">Today&apos;s Revenue</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="text-2xl-semi">{formatCurrency(stats.revenue.today)}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-small-regular">
            {stats.revenue.trend === "up" ? (
              <>
                <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600">+{stats.revenue.change}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />
                <span className="text-red-600">-{stats.revenue.change}%</span>
              </>
            )}
            <span className="text-muted-foreground">from yesterday</span>
          </div>
        </div>

        {/* Orders */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-small-regular text-muted-foreground">Today&apos;s Orders</span>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="text-2xl-semi">{stats.orders.today}</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-small-regular text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {stats.orders.pending} pending
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" />
              {stats.orders.processing} processing
            </span>
          </div>
        </div>

        {/* Customers */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-small-regular text-muted-foreground">Total Customers</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="text-2xl-semi">{stats.customers.total.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-small-regular">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="text-green-600">+{stats.customers.new}</span>
            <span className="text-muted-foreground">new this week</span>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-small-regular text-muted-foreground">Active Products</span>
            <Package className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="text-2xl-semi">{stats.products.total}</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-small-regular">
            <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />
            <span className="text-yellow-600">{stats.products.lowStock} low stock</span>
          </div>
        </div>
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
            {recentOrders.map((order) => (
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
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-background bg-muted text-xs font-medium">
                        +{order.items.length - 2}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base-semi">{order.displayId}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-small-regular text-muted-foreground mt-0.5">
                      {order.customer} · {formatDate(order.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base-semi">{formatCurrency(order.total)}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 pb-4">
            <h2 className="text-large-semi">Activity</h2>
            <p className="text-small-regular text-muted-foreground mt-0.5">
              Recent activity in your store
            </p>
          </div>
          <Separator />
          <div className="divide-y">
            {activityFeed.map((activity) => (
              <div key={activity.id} className="p-4">
                <p className="text-small-regular">{activity.message}</p>
                <p className="text-xsmall-regular text-muted-foreground mt-1">{activity.time}</p>
              </div>
            ))}
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
            <p className="text-small-regular text-muted-foreground">{stats.orders.pending} pending</p>
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
            <p className="text-small-regular text-muted-foreground">{stats.products.lowStock} low stock</p>
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
            <p className="text-small-regular text-muted-foreground">{stats.customers.total.toLocaleString()} total</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>
    </div>
  );
}
