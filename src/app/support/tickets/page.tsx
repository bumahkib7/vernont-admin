"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  UserPlus,
  ArrowRightLeft,
  Gauge,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Headphones,
  Inbox,
} from "lucide-react";
import { useTicketsPage } from "@/hooks/use-support";
import type {
  TicketSummary,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@/lib/api/support";

// ============================================================================
// Constants
// ============================================================================

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_ON_CUSTOMER", label: "Waiting on Customer" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: "ORDER_ISSUE", label: "Order Issue" },
  { value: "PRODUCT_INQUIRY", label: "Product Inquiry" },
  { value: "RETURN_REQUEST", label: "Return Request" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "BILLING", label: "Billing" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
];

// ============================================================================
// Status Badge
// ============================================================================

const STATUS_STYLES: Record<TicketStatus, { bg: string; text: string; dot: string }> = {
  OPEN: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  IN_PROGRESS: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  WAITING_ON_CUSTOMER: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  RESOLVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_STYLES[status];
  const label = STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} border-transparent font-normal gap-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label}
    </Badge>
  );
}

// ============================================================================
// Priority Badge
// ============================================================================

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  URGENT: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const label = PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
  return (
    <Badge variant="outline" className={`${PRIORITY_STYLES[priority]} font-normal`}>
      {label}
    </Badge>
  );
}

// ============================================================================
// SLA Indicator
// ============================================================================

function SlaIndicator({ breached, dueAt }: { breached: boolean; dueAt?: string }) {
  if (breached) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title="SLA breached">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs font-medium">Breached</span>
      </div>
    );
  }

  if (dueAt) {
    const remaining = new Date(dueAt).getTime() - Date.now();
    // Warn if less than 1 hour remaining
    if (remaining > 0 && remaining < 3600000) {
      return (
        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="SLA at risk">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">At risk</span>
        </div>
      );
    }
  }

  return (
    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400" title="Within SLA">
      <CheckCircle2 className="h-4 w-4" />
      <span className="text-xs font-medium">On track</span>
    </div>
  );
}

// ============================================================================
// Assignee Cell
// ============================================================================

function AssigneeCell({ assignee }: { assignee?: TicketSummary["assignee"] }) {
  if (!assignee) {
    return <span className="text-muted-foreground text-sm">Unassigned</span>;
  }

  const initials =
    (assignee.firstName?.[0] ?? "") + (assignee.lastName?.[0] ?? "");

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {assignee.avatarUrl && <AvatarImage src={assignee.avatarUrl} />}
        <AvatarFallback className="text-[10px]">{initials.toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="text-sm truncate max-w-[120px]">
        {assignee.firstName} {assignee.lastName}
      </span>
    </div>
  );
}

// ============================================================================
// Relative Time Helper
// ============================================================================

function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateString).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// Category Label Helper
// ============================================================================

function categoryLabel(category: TicketCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
}

// ============================================================================
// Multi-Select Filter Component
// ============================================================================

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (value: T[]) => void;
}) {
  const toggle = (value: T, checked: boolean) => {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter((v) => v !== value));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs rounded-full">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={(checked) => toggle(opt.value, !!checked)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onChange([])}
              className="justify-center text-muted-foreground"
            >
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function TicketsPage() {
  const {
    tickets,
    totalCount,
    assignableUsers,

    isLoading,
    isFetching,
    error,
    refetch,
    isBulkUpdating,

    page,
    pageSize,
    setPage,

    searchInput,
    setSearchInput,

    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    categoryFilter,
    setCategoryFilter,
    assignedToFilter,
    setAssignedToFilter,
    hasActiveFilters,
    clearAllFilters,

    selectedIds,
    setSelectedIds,
    clearSelection,

    handleBulkAssign,
    handleBulkStatus,
    handleBulkPriority,
    handleBulkClose,
  } = useTicketsPage();

  // ── Column definitions ────────────────────────────────────────────────────

  const columns: Column<TicketSummary>[] = useMemo(
    () => [
      {
        id: "ticketNumber",
        header: "#",
        className: "w-[60px]",
        cell: (ticket) => (
          <span className="font-mono text-sm text-muted-foreground">
            #{ticket.ticketNumber}
          </span>
        ),
      },
      {
        id: "subject",
        header: "Subject",
        cell: (ticket) => (
          <Link
            href={`/support/tickets/${ticket.id}`}
            className="font-medium text-sm hover:underline truncate block max-w-[250px]"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.subject}
          </Link>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        hideOnMobile: true,
        cell: (ticket) => (
          <div className="flex flex-col">
            <span className="text-sm truncate max-w-[160px]">
              {ticket.customer.firstName} {ticket.customer.lastName}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">
              {ticket.customer.email}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (ticket) => <TicketStatusBadge status={ticket.status} />,
      },
      {
        id: "priority",
        header: "Priority",
        cell: (ticket) => <PriorityBadge priority={ticket.priority} />,
      },
      {
        id: "category",
        header: "Category",
        hideOnMobile: true,
        cell: (ticket) => (
          <span className="text-sm text-muted-foreground">
            {categoryLabel(ticket.category)}
          </span>
        ),
      },
      {
        id: "assignee",
        header: "Assigned To",
        hideOnMobile: true,
        cell: (ticket) => <AssigneeCell assignee={ticket.assignee} />,
      },
      {
        id: "created",
        header: "Created",
        hideOnMobile: true,
        cell: (ticket) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {relativeTime(ticket.createdAt)}
          </span>
        ),
      },
      {
        id: "sla",
        header: "SLA",
        className: "w-[100px]",
        cell: (ticket) =>
          ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" ? (
            <SlaIndicator breached={ticket.slaBreached} dueAt={ticket.slaDueAt} />
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          ),
      },
    ],
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="flex items-center gap-3">
            <Headphones className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl font-semibold">
              Support Tickets
            </CardTitle>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/support/tickets/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Ticket
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <MultiSelectFilter
                label="Status"
                options={STATUS_OPTIONS}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
              <MultiSelectFilter
                label="Priority"
                options={PRIORITY_OPTIONS}
                selected={priorityFilter}
                onChange={setPriorityFilter}
              />
              <MultiSelectFilter
                label="Category"
                options={CATEGORY_OPTIONS}
                selected={categoryFilter}
                onChange={setCategoryFilter}
              />

              {/* Assigned To Filter */}
              <Select
                value={assignedToFilter}
                onValueChange={(val) =>
                  setAssignedToFilter(val === "__all__" ? "" : val)
                }
              >
                <SelectTrigger size="sm" className="h-8 w-[150px]">
                  <SelectValue placeholder="Assigned to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All agents</SelectItem>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={clearAllFilters}
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subject or email..."
                className="pl-8 h-8 w-full sm:w-[240px]"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={tickets}
            loading={isLoading}
            loadingRows={8}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            getRowId={(t) => t.id}
            onRowClick={(t) => (window.location.href = `/support/tickets/${t.id}`)}
            pagination={{
              page,
              pageSize,
              total: totalCount,
              onPageChange: setPage,
            }}
            emptyIcon={<Inbox className="h-12 w-12 opacity-30" />}
            emptyTitle="No tickets found"
            emptyDescription={
              hasActiveFilters || searchInput
                ? "Try adjusting your filters or search query."
                : "When customers submit support requests, they will appear here."
            }
          />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        actions={[
          {
            label: "Assign",
            icon: <UserPlus className="h-4 w-4" />,
            onClick: () => {
              // Use first assignable user as fallback; in a real app this would
              // open a popover to pick an agent. Kept simple for now.
              if (assignableUsers.length > 0) {
                handleBulkAssign(assignableUsers[0].id);
              }
            },
            disabled: assignableUsers.length === 0 || isBulkUpdating,
          },
          {
            label: "Change Status",
            icon: <ArrowRightLeft className="h-4 w-4" />,
            onClick: () => handleBulkStatus("IN_PROGRESS"),
            variant: "outline",
            disabled: isBulkUpdating,
          },
          {
            label: "Set Priority",
            icon: <Gauge className="h-4 w-4" />,
            onClick: () => handleBulkPriority("HIGH"),
            variant: "outline",
            disabled: isBulkUpdating,
          },
          {
            label: "Close",
            icon: <XCircle className="h-4 w-4" />,
            onClick: handleBulkClose,
            variant: "outline",
            disabled: isBulkUpdating,
          },
        ]}
      />
    </div>
  );
}
