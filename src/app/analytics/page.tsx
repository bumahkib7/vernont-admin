"use client";

import { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CalendarIcon,
  BarChart3,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { useAdvancedAnalytics, type AnalyticsPeriod } from "@/hooks/use-analytics";
import { RevenueChart } from "@/components/analytics/revenue-chart";
import { OrdersChart } from "@/components/analytics/orders-chart";
import { CategoryBreakdown } from "@/components/analytics/category-breakdown";
import { CustomerAcquisitionChart } from "@/components/analytics/customer-acquisition-chart";
import { ConversionFunnel } from "@/components/analytics/conversion-funnel";
import { TopProductsTable } from "@/components/analytics/top-products-table";
import { usePageContext } from "@/hooks/use-page-context";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
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
    <div className="h-[350px] w-full flex items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: "today",
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  "1y": "this year",
  custom: "custom range",
};

export default function AnalyticsPage() {
  usePageContext("analytics");
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [compare, setCompare] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const params = useMemo(() => ({
    period,
    startDate: period === "custom" && customStart ? format(customStart, "yyyy-MM-dd") : undefined,
    endDate: period === "custom" && customEnd ? format(customEnd, "yyyy-MM-dd") : undefined,
    compare,
  }), [period, customStart, customEnd, compare]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useAdvancedAnalytics(params);

  const periodLabel = PERIOD_LABELS[period];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Failed to load analytics data</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your store performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => refetch()} variant="ghost" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <div className="flex items-center gap-2">
            <Switch id="compare" checked={compare} onCheckedChange={setCompare} />
            <Label htmlFor="compare" className="text-sm">Compare</Label>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom date pickers */}
      {period === "custom" && (
        <div className="flex flex-wrap items-center gap-3">
          <Popover open={startOpen} onOpenChange={setStartOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customStart ? format(customStart, "MMM dd, yyyy") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customStart}
                onSelect={(d) => { setCustomStart(d ?? undefined); setStartOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground">to</span>
          <Popover open={endOpen} onOpenChange={setEndOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customEnd ? format(customEnd, "MMM dd, yyyy") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customEnd}
                onSelect={(d) => { setCustomEnd(d ?? undefined); setEndOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  {formatCurrency(Number(data?.kpis.totalRevenue.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {data?.kpis.totalRevenue.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={data?.kpis.totalRevenue.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(data?.kpis.totalRevenue.change || 0)}
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
                  {formatNumber(Number(data?.kpis.totalOrders.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {data?.kpis.totalOrders.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={data?.kpis.totalOrders.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(data?.kpis.totalOrders.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(Number(data?.kpis.avgOrderValue.value || 0))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {data?.kpis.avgOrderValue.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={data?.kpis.avgOrderValue.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {formatPercent(data?.kpis.avgOrderValue.change || 0)}
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
                  {Number(data?.kpis.conversionRate.value || 0).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {data?.kpis.conversionRate.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : data?.kpis.conversionRate.trend === "down" ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span className={
                    data?.kpis.conversionRate.trend === "up" ? "text-green-500" :
                    data?.kpis.conversionRate.trend === "down" ? "text-red-500" :
                    "text-muted-foreground"
                  }>
                    {formatPercent(data?.kpis.conversionRate.change || 0)}
                  </span>
                  vs {periodLabel}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Revenue & Orders Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>
              {compare ? "Current vs previous period" : `Revenue for ${periodLabel}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <RevenueChart data={data?.revenueOverTime || []} compare={compare} />
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Orders Over Time</CardTitle>
            <CardDescription>Daily order volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <OrdersChart data={data?.ordersOverTime || []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Customer Acquisition */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Sales distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <CategoryBreakdown data={data?.revenueByCategory || []} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Acquisition</CardTitle>
            <CardDescription>New vs returning customers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <CustomerAcquisitionChart data={data?.customerAcquisition || []} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>From visit to completed order</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <ConversionFunnel data={data?.conversionFunnel || []} />
          )}
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="channels">Sales Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Products by Revenue</CardTitle>
              <CardDescription>Best performing products for {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : (
                <TopProductsTable data={data?.topProducts || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Customers by Spend</CardTitle>
              <CardDescription>Highest-value customers for {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={10} />
              ) : data?.topCustomers && data.topCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Last Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topCustomers.map((customer, index) => (
                      <TableRow key={customer.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{customer.email}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(customer.totalSpent)}</TableCell>
                        <TableCell className="text-right tabular-nums">{customer.orderCount}</TableCell>
                        <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                          {new Date(customer.lastOrderDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No customer data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Sales Channel</CardTitle>
              <CardDescription>Performance across sales channels for {periodLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton rows={4} />
              ) : data?.channelRevenue && data.channelRevenue.length > 0 ? (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.channelRevenue.map((channel) => (
                      <TableRow key={channel.channel}>
                        <TableCell className="font-medium">{channel.channel}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(channel.revenue)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(channel.orders)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${channel.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm tabular-nums text-muted-foreground w-10 text-right">
                              {channel.percentage}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No channel data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
