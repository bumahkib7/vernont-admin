"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatCardSkeleton } from "@/components/ui/stat-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
} from "recharts";
import {
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Megaphone,
  Settings2,
  FileText,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { usePageContext } from "@/hooks/use-page-context";

// ------------------------------------------------------------------
// Types matching the backend GET /admin/consent-analytics response
// ------------------------------------------------------------------

interface ConsentRate {
  analytics: number;
  marketing: number;
  functional: number;
}

interface DailyTrendPoint {
  date: string;
  total: number;
  analyticsAccepted: number;
  marketingAccepted: number;
}

interface VersionBreakdown {
  version: number;
  count: number;
}

interface RecentConsentRecord {
  id: string;
  sessionId: string;
  categories: Record<string, boolean>;
  ipRegion?: string;
  consentVersion: number;
  createdAt: string;
}

interface ConsentAnalyticsData {
  totalRecords: number;
  consentRate: ConsentRate;
  dailyTrend: DailyTrendPoint[];
  versionBreakdown: VersionBreakdown[];
  recentRecords: RecentConsentRecord[];
}

// ------------------------------------------------------------------
// API
// ------------------------------------------------------------------

async function fetchConsentAnalytics(): Promise<ConsentAnalyticsData> {
  return apiFetch<ConsentAnalyticsData>("/admin/consent-analytics");
}

// ------------------------------------------------------------------
// Chart configs
// ------------------------------------------------------------------

const trendChartConfig = {
  total: {
    label: "Total Consents",
    color: "hsl(var(--chart-1))",
  },
  analyticsAccepted: {
    label: "Analytics Accepted",
    color: "#22c55e",
  },
  marketingAccepted: {
    label: "Marketing Accepted",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const VERSION_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
];

const versionChartConfig = {
  count: {
    label: "Records",
  },
} satisfies ChartConfig;

// ------------------------------------------------------------------
// Skeleton helpers
// ------------------------------------------------------------------

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
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function CategoryBadges({ categories }: { categories: Record<string, boolean> }) {
  const entries = Object.entries(categories).filter(
    ([key]) => key !== "necessary" && key !== "vendors"
  );
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([key, value]) => (
        <Badge
          key={key}
          variant={value ? "default" : "outline"}
          className={
            value
              ? key === "analytics"
                ? "bg-green-600 text-white"
                : key === "marketing"
                  ? "bg-blue-600 text-white"
                  : "bg-orange-500 text-white"
              : ""
          }
        >
          {key}
        </Badge>
      ))}
    </div>
  );
}

function truncateSession(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

// ------------------------------------------------------------------
// Empty state
// ------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
      <ShieldCheck className="h-12 w-12 text-muted-foreground/40" />
      <div>
        <h3 className="text-lg font-semibold">No consent data yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Consent records will appear here once visitors interact with the cookie
          banner on your storefront.
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

export default function ConsentAnalyticsPage() {
  usePageContext("analytics");

  const { data, isLoading, isError } = useQuery<ConsentAnalyticsData>({
    queryKey: ["consent-analytics"],
    queryFn: fetchConsentAnalytics,
    staleTime: 60_000,
    retry: 1,
  });

  // If API not yet live or no data, show empty state
  if (isError || (!isLoading && (!data || data.totalRecords === 0))) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Cookie Consent Analytics
          </h1>
          <p className="text-muted-foreground">
            Monitor consent rates and compliance
          </p>
        </div>
        <EmptyState />
      </div>
    );
  }

  const analyticsRate = data ? Math.round(data.consentRate.analytics * 100) : 0;
  const marketingRate = data ? Math.round(data.consentRate.marketing * 100) : 0;
  const functionalRate = data
    ? Math.round(data.consentRate.functional * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Cookie Consent Analytics
        </h1>
        <p className="text-muted-foreground">
          Monitor consent rates and compliance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Consent Records"
              value={new Intl.NumberFormat("en-US").format(data!.totalRecords)}
              icon={<FileText />}
              subtitle="All-time records"
            />
            <StatCard
              title="Analytics Opt-in Rate"
              value={`${analyticsRate}%`}
              icon={<BarChart3 />}
              trend={
                analyticsRate > 50
                  ? { direction: "up", value: `${analyticsRate}%`, label: "opt-in" }
                  : { direction: "down", value: `${analyticsRate}%`, label: "opt-in" }
              }
            />
            <StatCard
              title="Marketing Opt-in Rate"
              value={`${marketingRate}%`}
              icon={<Megaphone />}
              subtitle="of visitors"
            />
            <StatCard
              title="Functional Opt-in Rate"
              value={`${functionalRate}%`}
              icon={<Settings2 />}
              subtitle="of visitors"
            />
          </>
        )}
      </div>

      {/* Daily trend chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Daily Consent Trend</CardTitle>
              <CardDescription>
                Consent volume and category acceptance over the last 30 days
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : data!.dailyTrend.length === 0 ? (
            <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          ) : (
            <ChartContainer
              config={trendChartConfig}
              className="h-[350px] w-full"
            >
              <LineChart data={data!.dailyTrend} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  dataKey="total"
                  type="monotone"
                  stroke="var(--color-total)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  dataKey="analyticsAccepted"
                  type="monotone"
                  stroke="var(--color-analyticsAccepted)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  dataKey="marketingAccepted"
                  type="monotone"
                  stroke="var(--color-marketingAccepted)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Version breakdown bar chart */}
      <Card>
        <CardHeader>
          <CardTitle>Consent Version Breakdown</CardTitle>
          <CardDescription>
            Records per privacy policy version
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton />
          ) : data!.versionBreakdown.length === 0 ? (
            <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
              No version data available
            </div>
          ) : (
            <ChartContainer
              config={versionChartConfig}
              className="h-[250px] w-full"
            >
              <BarChart
                data={data!.versionBreakdown.map((v) => ({
                  ...v,
                  name: `v${v.version}`,
                }))}
                accessibilityLayer
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data!.versionBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={VERSION_COLORS[index % VERSION_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent consent audit log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consent Audit Log</CardTitle>
          <CardDescription>Last 20 consent records</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={10} />
          ) : !data!.recentRecords || data!.recentRecords.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">
              No recent records
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead className="hidden md:table-cell">
                      IP Region
                    </TableHead>
                    <TableHead className="text-right">Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.recentRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleString("en-GB", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {truncateSession(record.sessionId)}
                      </TableCell>
                      <TableCell>
                        <CategoryBadges categories={record.categories} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {record.ipRegion || "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        v{record.consentVersion}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
