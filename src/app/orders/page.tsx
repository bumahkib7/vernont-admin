"use client";

import { useMemo } from "react";
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
import {
  Search,
  SlidersHorizontal,
  Plus,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Truck,
  XCircle,
  Download,
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
import { CsvExportButton } from "@/components/csv-export-button";
import { useWebSocketStore } from "@/stores";
import { usePageContext } from "@/hooks/use-page-context";
import { useOrdersPage } from "@/hooks/use-orders";
import { useOrderStore } from "@/stores/order-store";

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

          {/* Orders Table */}
          <DataTable
            columns={orderColumns}
            data={orders}
            loading={isLoading}
            selectable
            selectedIds={selectedOrderIds}
            onSelectionChange={(ids) => {
              // DataTable gives us the full Set; sync it into Zustand
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
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedOrderIds.size}
        onClearSelection={clearSelection}
        actions={[
          { label: "Mark Shipped", icon: <Truck className="h-4 w-4" />, onClick: handleBulkMarkShipped },
          { label: "Cancel", icon: <XCircle className="h-4 w-4" />, onClick: handleBulkCancel, variant: "outline" },
          { label: "Export", icon: <Download className="h-4 w-4" />, onClick: handleBulkExport, variant: "outline" },
        ]}
      />
    </div>
  );
}
