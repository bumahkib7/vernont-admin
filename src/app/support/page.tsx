"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Headphones,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Plus,
  List,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";
import {
  useSupportStats,
  useOverdueTickets,
  useSupportActivity,
} from "@/hooks/use-support";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatOverdue(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m overdue`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h < 24) return m > 0 ? `${h}h ${m}m overdue` : `${h}h overdue`;
  const d = Math.floor(h / 24);
  const remainH = h % 24;
  return remainH > 0 ? `${d}d ${remainH}h overdue` : `${d}d overdue`;
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
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

function BarSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 flex-1" style={{ maxWidth: `${30 + Math.random() * 60}%` }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-20 mt-1" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface SupportKpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  loading?: boolean;
}

function SupportKpiCard({ title, value, icon, subtitle, loading = false }: SupportKpiCardProps) {
  if (loading) return <KpiCardSkeleton />;

  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-sm shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)] hover:shadow-[0_4px_0_-1px_rgba(17,24,39,0.06),0_20px_40px_-12px_rgba(17,24,39,0.18),0_8px_16px_-6px_rgba(17,24,39,0.1)]">
      <div className="flex items-center justify-between">
        <span className="text-small-regular text-muted-foreground">{title}</span>
        <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      </div>
      <div className="mt-3">
        <span className="text-2xl-semi tracking-tight">{value}</span>
      </div>
      <div className="mt-2">
        <span className="text-small-regular text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tickets by Status (horizontal bars)
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  OPEN: { label: "Open", color: "bg-blue-500", bg: "text-blue-700 dark:text-blue-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-amber-500", bg: "text-amber-700 dark:text-amber-300" },
  WAITING_ON_CUSTOMER: { label: "Waiting", color: "bg-violet-500", bg: "text-violet-700 dark:text-violet-300" },
  RESOLVED: { label: "Resolved", color: "bg-emerald-500", bg: "text-emerald-700 dark:text-emerald-300" },
  CLOSED: { label: "Closed", color: "bg-gray-400", bg: "text-gray-600 dark:text-gray-400" },
};

const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED", "CLOSED"];

function TicketsByStatusChart({
  data,
  loading,
}: {
  data: Record<string, number>;
  loading: boolean;
}) {
  if (loading) return <BarSkeleton />;

  const maxVal = Math.max(...Object.values(data), 1);
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <p className="text-small-regular text-muted-foreground py-4 text-center">
        No ticket data available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((key) => {
        const count = data[key] ?? 0;
        const cfg = STATUS_CONFIG[key];
        if (!cfg) return null;
        const pct = (count / maxVal) * 100;
        return (
          <div key={key} className="flex items-center gap-3 group">
            <span className="text-xsmall-regular text-muted-foreground w-20 shrink-0 text-right font-medium">
              {cfg.label}
            </span>
            <div className="flex-1 h-6 bg-muted/40 rounded overflow-hidden">
              <div
                className={`h-full ${cfg.color} rounded transition-all duration-500 relative`}
                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, opacity: 0.75 }}
              >
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-white truncate">
                  {count > 0 ? count : ""}
                </span>
              </div>
            </div>
            <span className={`text-xsmall-regular font-medium w-8 text-right ${cfg.bg}`}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tickets by Priority (horizontal bars with color coding)
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<string, { label: string; color: string; textColor: string }> = {
  LOW: { label: "Low", color: "bg-emerald-500", textColor: "text-emerald-700 dark:text-emerald-300" },
  MEDIUM: { label: "Medium", color: "bg-amber-400", textColor: "text-amber-700 dark:text-amber-300" },
  HIGH: { label: "High", color: "bg-orange-500", textColor: "text-orange-700 dark:text-orange-300" },
  URGENT: { label: "Urgent", color: "bg-red-500", textColor: "text-red-700 dark:text-red-300" },
};

const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function TicketsByPriorityChart({
  data,
  loading,
}: {
  data: Record<string, number>;
  loading: boolean;
}) {
  if (loading) return <BarSkeleton />;

  const maxVal = Math.max(...Object.values(data), 1);
  const total = Object.values(data).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <p className="text-small-regular text-muted-foreground py-4 text-center">
        No ticket data available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {PRIORITY_ORDER.map((key) => {
        const count = data[key] ?? 0;
        const cfg = PRIORITY_CONFIG[key];
        if (!cfg) return null;
        const pct = (count / maxVal) * 100;
        return (
          <div key={key} className="flex items-center gap-3 group">
            <span className="text-xsmall-regular text-muted-foreground w-16 shrink-0 text-right font-medium">
              {cfg.label}
            </span>
            <div className="flex-1 h-6 bg-muted/40 rounded overflow-hidden">
              <div
                className={`h-full ${cfg.color} rounded transition-all duration-500 relative`}
                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, opacity: 0.8 }}
              >
                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-semibold text-white truncate">
                  {count > 0 ? count : ""}
                </span>
              </div>
            </div>
            <span className={`text-xsmall-regular font-medium w-8 text-right ${cfg.textColor}`}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overdue Tickets Table
// ---------------------------------------------------------------------------

function OverdueTicketsTable({
  tickets,
  loading,
}: {
  tickets: { id: string; ticketNumber: string; subject: string; customerName: string; priority: string; overdueByMinutes: number }[];
  loading: boolean;
}) {
  if (loading) return <TableSkeleton />;

  if (!tickets || tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mb-2" />
        <p className="text-small-regular font-medium">All within SLA</p>
        <p className="text-xsmall-regular text-muted-foreground mt-0.5">
          No overdue tickets right now
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-small-regular">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left py-2 pr-4 font-medium">Ticket</th>
            <th className="text-left py-2 pr-4 font-medium">Subject</th>
            <th className="text-left py-2 pr-4 font-medium hidden sm:table-cell">Customer</th>
            <th className="text-right py-2 font-medium">Overdue</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tickets.map((ticket) => {
            const priorityCfg = PRIORITY_CONFIG[ticket.priority];
            return (
              <tr key={ticket.id} className="group hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/support/tickets/${ticket.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {ticket.ticketNumber}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 max-w-[200px] truncate">{ticket.subject}</td>
                <td className="py-2.5 pr-4 text-muted-foreground hidden sm:table-cell">
                  {ticket.customerName}
                </td>
                <td className="py-2.5 text-right">
                  <Badge
                    variant="outline"
                    className={`!border-red-200 !bg-red-50 !text-red-700 dark:!border-red-800 dark:!bg-red-950/30 dark:!text-red-300`}
                  >
                    {formatOverdue(ticket.overdueByMinutes)}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity Event Type Config
// ---------------------------------------------------------------------------

const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATED: "created",
  REPLIED: "replied to",
  ASSIGNED: "was assigned",
  STATUS_CHANGED: "status changed on",
  RESOLVED: "resolved",
  CLOSED: "closed",
  ESCALATED: "escalated",
  NOTE_ADDED: "added note to",
};

// ---------------------------------------------------------------------------
// Recent Activity
// ---------------------------------------------------------------------------

function RecentActivity({
  events,
  loading,
}: {
  events: { id: string; type: string; ticketNumber: string; subject: string; actorName: string | null; message: string; timestamp: string }[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivityItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="divide-y max-h-[400px] overflow-y-auto">
      {events.map((event) => {
        const verb = EVENT_TYPE_LABELS[event.type] || event.type.toLowerCase();
        const actor = event.actorName || "System";
        return (
          <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
            <p className="text-small-regular">
              <span className="font-medium">{actor}</span>{" "}
              {verb}{" "}
              <Link
                href={`/support/tickets/${event.ticketNumber}`}
                className="font-medium hover:underline"
              >
                #{event.ticketNumber}
              </Link>
              {event.subject && (
                <span className="text-muted-foreground"> &mdash; {event.subject}</span>
              )}
            </p>
            <p className="text-xsmall-regular text-muted-foreground mt-1">
              {formatRelativeTime(event.timestamp)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SupportDashboardPage() {
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useSupportStats();
  const { data: overdueTickets, isLoading: overdueLoading } = useOverdueTickets();
  const { data: activity, isLoading: activityLoading } = useSupportActivity(10);

  const loading = statsLoading;

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive">Failed to load support data</p>
        <Button onClick={() => refetchStats()} variant="outline">
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
          <h1 className="text-2xl-semi">Customer Support</h1>
          <p className="text-base-regular text-muted-foreground mt-1">
            Monitor tickets, response times, and SLA compliance.
          </p>
        </div>
        <Button onClick={() => refetchStats()} variant="ghost" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SupportKpiCard
          title="Open Tickets"
          value={stats?.openTickets ?? 0}
          icon={<Headphones />}
          subtitle="Awaiting response or action"
          loading={loading}
        />
        <SupportKpiCard
          title="Avg Response Time"
          value={stats ? formatDuration(stats.avgResponseTimeMinutes) : "--"}
          icon={<Clock />}
          subtitle="First reply to customer"
          loading={loading}
        />
        <SupportKpiCard
          title="Avg Resolution Time"
          value={stats ? formatDuration(stats.avgResolutionTimeMinutes) : "--"}
          icon={<CheckCircle2 />}
          subtitle="From open to resolved"
          loading={loading}
        />
        <SupportKpiCard
          title="SLA Compliance"
          value={stats ? `${stats.slaCompliancePercent.toFixed(1)}%` : "--"}
          icon={<ShieldCheck />}
          subtitle="Tickets resolved within SLA"
          loading={loading}
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tickets by Status */}
        <div className="rounded-lg border bg-card shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
          <div className="p-6 pb-4">
            <h2 className="text-large-semi">Tickets by Status</h2>
            <p className="text-small-regular text-muted-foreground mt-0.5">
              Current distribution across statuses
            </p>
          </div>
          <Separator />
          <div className="p-6">
            <TicketsByStatusChart
              data={stats?.ticketsByStatus ?? {}}
              loading={loading}
            />
          </div>
        </div>

        {/* Tickets by Priority */}
        <div className="rounded-lg border bg-card shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
          <div className="p-6 pb-4">
            <h2 className="text-large-semi">Tickets by Priority</h2>
            <p className="text-small-regular text-muted-foreground mt-0.5">
              Breakdown by urgency level
            </p>
          </div>
          <Separator />
          <div className="p-6">
            <TicketsByPriorityChart
              data={stats?.ticketsByPriority ?? {}}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Overdue Tickets + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overdue Tickets */}
        <div className="lg:col-span-2 rounded-lg border bg-card shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h2 className="text-large-semi">Overdue Tickets</h2>
              <p className="text-small-regular text-muted-foreground mt-0.5">
                Tickets that breached SLA response/resolution time
              </p>
            </div>
            {overdueTickets && overdueTickets.length > 0 && (
              <Badge
                variant="outline"
                className="!bg-red-50 !text-red-700 !border-red-200 dark:!bg-red-900/40 dark:!text-red-300 dark:!border-red-700"
              >
                {overdueTickets.length}
              </Badge>
            )}
          </div>
          <Separator />
          <div className="p-6">
            <OverdueTicketsTable
              tickets={overdueTickets ?? []}
              loading={overdueLoading}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
          <div className="p-6 pb-4">
            <h2 className="text-large-semi">Recent Activity</h2>
            <p className="text-small-regular text-muted-foreground mt-0.5">
              Last 10 ticket events
            </p>
          </div>
          <Separator />
          <RecentActivity
            events={activity ?? []}
            loading={activityLoading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6 shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)]">
        <h2 className="text-large-semi mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/support/tickets/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support/tickets">
              <List className="h-4 w-4 mr-2" />
              View All Tickets
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support/canned-responses">
              <MessageSquareText className="h-4 w-4 mr-2" />
              Canned Responses
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
