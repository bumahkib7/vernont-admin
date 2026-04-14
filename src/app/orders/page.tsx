"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  SlidersHorizontal,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Truck,
  XCircle,
  Download,
  Table2,
  Columns3,
  Package,
  Eye,
  Inbox,
} from "lucide-react";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  PaymentStatus,
  FulfillmentStatus,
  formatPrice,
  formatDate,
  getPaymentStatusDisplay,
  getFulfillmentStatusDisplay,
} from "@/lib/api";
import type { OrderStatus, OrderSummary } from "@/lib/api/orders";
import { CsvExportButton } from "@/components/csv-export-button";
import { useWebSocketStore } from "@/stores";
import { usePageContext } from "@/hooks/use-page-context";
import { useOrdersPage } from "@/hooks/use-orders";
import { useOrderStore } from "@/stores/order-store";

// ============================================================================
// Status Badge Components
// ============================================================================

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, color } = getPaymentStatusDisplay(status);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  const { label, color } = getFulfillmentStatusDisplay(status);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function SmallPaymentBadge({ status }: { status: PaymentStatus }) {
  const { label, color } = getPaymentStatusDisplay(status);
  return (
    <Badge variant="outline" className="text-xs gap-1 font-normal">
      <div className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </Badge>
  );
}

// ============================================================================
// Pipeline Column Definitions
// ============================================================================

interface PipelineColumn {
  id: string;
  label: string;
  headerClass: string;
  badgeClass: string;
  match: (order: OrderSummary) => boolean;
  collapsedByDefault?: boolean;
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
  {
    id: "new",
    label: "New",
    headerClass: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    badgeClass: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    match: (o) => o.status === "PENDING" && o.fulfillmentStatus === "NOT_FULFILLED",
  },
  {
    id: "processing",
    label: "Processing",
    headerClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    badgeClass: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    match: (o) =>
      o.status === "REQUIRES_ACTION" ||
      o.fulfillmentStatus === "REQUIRES_ACTION" ||
      (o.status === "PENDING" && o.fulfillmentStatus !== "NOT_FULFILLED" && o.fulfillmentStatus !== "SHIPPED" && o.fulfillmentStatus !== "CANCELED"),
  },
  {
    id: "shipped",
    label: "Shipped",
    headerClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    badgeClass: "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    match: (o) => o.fulfillmentStatus === "SHIPPED" || o.fulfillmentStatus === "PARTIALLY_SHIPPED",
  },
  {
    id: "delivered",
    label: "Delivered",
    headerClass: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    badgeClass: "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
    match: (o) => o.status === "COMPLETED",
  },
  {
    id: "canceled",
    label: "Canceled",
    headerClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    badgeClass: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    match: (o) => o.status === "CANCELED" || o.fulfillmentStatus === "CANCELED",
    collapsedByDefault: true,
  },
];

// ============================================================================
// Pipeline Order Card
// ============================================================================

function OrderCard({ order }: { order: OrderSummary }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/orders/${order.id}`}>
      <Card
        className="relative cursor-pointer transition-colors hover:bg-accent/50"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <CardContent className="p-3 space-y-2">
          {/* Top line: order # + date */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              #{order.displayId}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(order.createdAt)}
            </span>
          </div>

          {/* Customer */}
          <p className="text-sm font-medium truncate">{order.email}</p>

          {/* Items indicator */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>
              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          {/* Bottom: total + payment badge */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">
              {formatPrice(order.total, order.currencyCode)}
            </span>
            <SmallPaymentBadge status={order.paymentStatus as PaymentStatus} />
          </div>

          {/* Hover overlay: View button */}
          {hovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
              <Button size="sm" variant="secondary" className="gap-1.5 pointer-events-none">
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// Pipeline Column Component
// ============================================================================

function PipelineColumnView({
  column,
  orders,
}: {
  column: PipelineColumn;
  orders: OrderSummary[];
}) {
  const [collapsed, setCollapsed] = useState(column.collapsedByDefault ?? false);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const currencyCode = orders[0]?.currencyCode ?? "GBP";

  return (
    <div
      className={`flex flex-col shrink-0 ${
        collapsed ? "w-12 min-w-12 max-w-12" : "w-[220px] sm:w-[250px] lg:w-[280px] lg:max-w-[320px] lg:flex-1"
      } transition-all`}
    >
      {/* Sticky Header */}
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className={`sticky top-0 z-10 rounded-lg px-2 py-3 flex flex-col items-center gap-2 ${column.headerClass}`}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="text-xs font-medium [writing-mode:vertical-lr] rotate-180">
            {column.label}
          </span>
          <Badge variant="secondary" className={`text-xs ${column.badgeClass}`}>
            {orders.length}
          </Badge>
        </button>
      ) : (
        <div
          className={`sticky top-0 z-10 rounded-t-lg px-3 py-2.5 flex items-center justify-between ${column.headerClass}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{column.label}</span>
            <Badge variant="secondary" className={`text-xs ${column.badgeClass}`}>
              {orders.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {orders.length > 0 && (
              <span className="text-xs font-medium opacity-75">
                {formatPrice(totalRevenue, currencyCode)}
              </span>
            )}
            {column.collapsedByDefault && (
              <button
                onClick={() => setCollapsed(true)}
                className="opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card List */}
      {!collapsed && (
        <ScrollArea className="flex-1 rounded-b-lg border border-t-0 bg-muted/30">
          <div className="p-2 space-y-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <span className="text-sm">No orders</span>
              </div>
            ) : (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ============================================================================
// Pipeline Board
// ============================================================================

function PipelineBoard({
  orders,
  isLoading,
}: {
  orders: OrderSummary[];
  isLoading: boolean;
}) {
  // Bucket orders into columns
  const columnData = useMemo(() => {
    const buckets = new Map<string, OrderSummary[]>();
    for (const col of PIPELINE_COLUMNS) {
      buckets.set(col.id, []);
    }
    for (const order of orders) {
      // First matching column wins (priority order)
      for (const col of PIPELINE_COLUMNS) {
        if (col.match(order)) {
          buckets.get(col.id)!.push(order);
          break;
        }
      }
    }
    return buckets;
  }, [orders]);

  if (isLoading) {
    return <PipelineSkeleton />;
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400, maxHeight: "calc(100vh - 240px)" }}>
      {PIPELINE_COLUMNS.map((col) => (
        <PipelineColumnView
          key={col.id}
          column={col}
          orders={columnData.get(col.id) ?? []}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Pipeline Loading Skeleton
// ============================================================================

function PipelineSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto" style={{ minHeight: 400 }}>
      {PIPELINE_COLUMNS.filter((c) => !c.collapsedByDefault).map((col) => (
        <div key={col.id} className="flex flex-col shrink-0 w-[220px] sm:w-[250px] lg:w-[280px] lg:max-w-[320px] lg:flex-1">
          <div className={`rounded-t-lg px-3 py-2.5 ${col.headerClass}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{col.label}</span>
              <div className="h-5 w-6 rounded bg-current opacity-20 animate-pulse" />
            </div>
          </div>
          <div className="flex-1 rounded-b-lg border border-t-0 bg-muted/30 p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-3 space-y-2 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-3 w-12 rounded bg-muted-foreground/20" />
                  <div className="h-3 w-16 rounded bg-muted-foreground/20" />
                </div>
                <div className="h-4 w-3/4 rounded bg-muted-foreground/20" />
                <div className="h-3 w-1/3 rounded bg-muted-foreground/20" />
                <div className="flex justify-between">
                  <div className="h-4 w-14 rounded bg-muted-foreground/20" />
                  <div className="h-5 w-16 rounded bg-muted-foreground/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {/* Collapsed skeleton for canceled */}
      <div className="w-12 min-w-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    </div>
  );
}

// ============================================================================
// View Mode Toggle
// ============================================================================

function ViewModeToggle() {
  const viewMode = useOrderStore((s) => s.viewMode);
  const setViewMode = useOrderStore((s) => s.setViewMode);

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-0.5">
      <button
        onClick={() => setViewMode("table")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "table"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Table2 className="h-4 w-4" />
        Table
      </button>
      <button
        onClick={() => setViewMode("pipeline")}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "pipeline"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Columns3 className="h-4 w-4" />
        Pipeline
      </button>
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function OrdersPage() {
  const {
    // Data
    orders,
    totalCount,

    // Loading / error
    isLoading,
    isFetching,
    error,
    refetch,

    // Pagination
    page,
    pageSize,
    setPage,

    // Search
    searchQuery,
    setSearchQuery,

    // Filters
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,

    // Selection
    selectedOrderIds,
    clearSelection,

    // Bulk actions
    bulkShip,
    bulkCancel,
  } = useOrdersPage();

  const { isConnected } = useWebSocketStore();
  const viewMode = useOrderStore((s) => s.viewMode);
  usePageContext("orders");

  // Handle CSV export
  const handleExport = () => {
    const headers = ["Order", "Date", "Customer", "Payment", "Fulfillment", "Order Total"];
    const rows = orders.map((order) => [
      `#${order.displayId}`,
      formatDate(order.createdAt),
      order.email,
      order.paymentStatus,
      order.fulfillmentStatus,
      formatPrice(order.total, order.currencyCode),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkMarkShipped = () => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length > 0) bulkShip(ids);
  };

  const handleBulkCancel = () => {
    const ids = Array.from(selectedOrderIds);
    if (ids.length > 0) bulkCancel(ids);
  };

  const handleBulkExport = () => {
    handleExport();
    clearSelection();
  };

  const orderColumns: Column<(typeof orders)[number]>[] = useMemo(
    () => [
      {
        id: "order",
        header: "Order",
        cell: (order) => <span className="font-medium">#{order.displayId}</span>,
      },
      {
        id: "date",
        header: "Date",
        hideOnMobile: true,
        cell: (order) => <>{formatDate(order.createdAt)}</>,
      },
      {
        id: "customer",
        header: "Customer",
        hideOnMobile: true,
        cell: (order) => <>{order.email}</>,
      },
      {
        id: "payment",
        header: "Payment",
        cell: (order) => <PaymentStatusBadge status={order.paymentStatus as PaymentStatus} />,
      },
      {
        id: "fulfillment",
        header: "Fulfillment",
        cell: (order) => <FulfillmentStatusBadge status={order.fulfillmentStatus as FulfillmentStatus} />,
      },
      {
        id: "total",
        header: "Total",
        className: "text-right",
        cell: (order) => <>{formatPrice(order.total, order.currencyCode)}</>,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-semibold">Orders</CardTitle>
            {/* Live indicator */}
            {isConnected ? (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50">
                <Wifi className="h-3 w-3" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-gray-500 border-gray-200">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ViewModeToggle />
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <CsvExportButton type="orders" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Add Filter Dropdown */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2 px-2">Filter by</p>

                    {/* Payment Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Payment Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["NOT_PAID", "AWAITING", "CAPTURED", "PAID", "REFUNDED"] as PaymentStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "payment" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "payment", label: `Payment: ${getPaymentStatusDisplay(status).label}`, value: status });
                              else removeFilter("payment", status);
                            }}
                          >
                            {getPaymentStatusDisplay(status).label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Fulfillment Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Fulfillment Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["NOT_FULFILLED", "FULFILLED", "SHIPPED", "RETURNED"] as FulfillmentStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "fulfillment" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "fulfillment", label: `Fulfillment: ${getFulfillmentStatusDisplay(status).label}`, value: status });
                              else removeFilter("fulfillment", status);
                            }}
                          >
                            {getFulfillmentStatusDisplay(status).label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Active Filters */}
              {activeFilters.map((filter) => (
                <div
                  key={`${filter.id}-${filter.value}`}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.id, filter.value)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  className="pl-8 w-full sm:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error.message}</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* View: Table or Pipeline */}
          {viewMode === "table" ? (
            <DataTable
              columns={orderColumns}
              data={orders}
              loading={isLoading}
              selectable
              selectedIds={selectedOrderIds}
              onSelectionChange={(ids) => {
                const store = useOrderStore;
                store.setState({ selectedOrderIds: ids });
              }}
              getRowId={(o) => o.id}
              onRowClick={(o) => (window.location.href = `/orders/${o.id}`)}
              pagination={{
                page,
                pageSize,
                total: totalCount,
                onPageChange: setPage,
              }}
              emptyTitle={orders.length === 0 ? "No orders found" : "No orders match your filters"}
            />
          ) : (
            <PipelineBoard orders={orders} isLoading={isLoading} />
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Bar (table mode only) */}
      {viewMode === "table" && (
        <BulkActionBar
          selectedCount={selectedOrderIds.size}
          onClearSelection={clearSelection}
          actions={[
            { label: "Mark Shipped", icon: <Truck className="h-4 w-4" />, onClick: handleBulkMarkShipped },
            { label: "Cancel", icon: <XCircle className="h-4 w-4" />, onClick: handleBulkCancel, variant: "outline" },
            { label: "Export", icon: <Download className="h-4 w-4" />, onClick: handleBulkExport, variant: "outline" },
          ]}
        />
      )}
    </div>
  );
}
