import { Metadata } from "next";
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
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { TopCategoriesChart } from "@/components/dashboard/top-categories-chart";

export const metadata: Metadata = {
  title: "Analytics",
};

const kpis = [
  {
    title: "Total Revenue",
    value: "$485,240",
    change: "+22.5%",
    trend: "up",
    icon: DollarSign,
    period: "vs last month",
  },
  {
    title: "Total Orders",
    value: "2,847",
    change: "+18.2%",
    trend: "up",
    icon: ShoppingCart,
    period: "vs last month",
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "+12.8%",
    trend: "up",
    icon: Users,
    period: "vs last month",
  },
  {
    title: "Conversion Rate",
    value: "3.24%",
    change: "-0.4%",
    trend: "down",
    icon: TrendingUp,
    period: "vs last month",
  },
];

const topProducts = [
  { name: "Hermès Birkin 25", revenue: 562500, orders: 45, growth: "+15%" },
  { name: "Chanel Classic Flap", revenue: 311600, orders: 38, growth: "+12%" },
  { name: "Louis Vuitton Neverfull", revenue: 109200, orders: 52, growth: "+8%" },
  { name: "Gucci Dionysus", revenue: 100050, orders: 29, growth: "+5%" },
  { name: "Dior Lady Dior", revenue: 139200, orders: 24, growth: "+18%" },
];

const topBrands = [
  { name: "Hermès", revenue: 892000, share: 35 },
  { name: "Chanel", revenue: 654000, share: 26 },
  { name: "Louis Vuitton", revenue: 456000, share: 18 },
  { name: "Gucci", revenue: 312000, share: 12 },
  { name: "Dior", revenue: 224000, share: 9 },
];

export default function AnalyticsPage() {
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
        <Select defaultValue="30d">
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={kpi.trend === "up" ? "text-green-500" : "text-red-500"}>
                  {kpi.change}
                </span>
                {kpi.period}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Daily revenue for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your customers come from</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficChart />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts & Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Sales by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <TopCategoriesChart />
          </CardContent>
        </Card>

        {/* Top Brands */}
        <Card>
          <CardHeader>
            <CardTitle>Top Brands</CardTitle>
            <CardDescription>Revenue by brand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBrands.map((brand, index) => (
                <div key={brand.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground w-4">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{brand.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${(brand.revenue / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${brand.share}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {brand.share}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>Products with the highest revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div
                key={product.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.orders} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${product.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-500">{product.growth}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
