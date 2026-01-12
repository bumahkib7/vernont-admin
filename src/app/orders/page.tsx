"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import {
  PaymentStatus,
  FulfillmentStatus,
  formatPrice,
  formatDate,
  getPaymentStatusDisplay,
  getFulfillmentStatusDisplay,
} from "@/lib/api";
import { useOrdersStore, useWebSocketStore } from "@/stores";

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

type Filter = {
  id: string;
  label: string;
  value: string;
};

export default function OrdersPage() {
  // Use Zustand store instead of local state
  const {
    orders,
    count,
    isLoading,
    error,
    filters,
    fetchOrders,
    setFilters,
    subscribeToOrders,
  } = useOrdersStore();

  const { isConnected } = useWebSocketStore();

  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Subscribe to WebSocket updates on mount
  useEffect(() => {
    const unsubscribe = subscribeToOrders();
    return unsubscribe;
  }, [subscribeToOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders({ q: searchQuery || undefined, offset: 0 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchOrders]);

  const addFilter = (filter: Filter) => {
    if (!activeFilters.find((f) => f.id === filter.id && f.value === filter.value)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filterId: string, value: string) => {
    setActiveFilters(activeFilters.filter((f) => !(f.id === filterId && f.value === value)));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const handleExport = () => {
    const headers = ["Order", "Date", "Customer", "Payment", "Fulfillment", "Order Total"];
    const rows = filteredOrders.map((order) => [
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

  // Filter orders based on active filters
  const filteredOrders = orders.filter((order) => {
    for (const filter of activeFilters) {
      if (filter.id === "payment" && order.paymentStatus !== filter.value) {
        return false;
      }
      if (filter.id === "fulfillment" && order.fulfillmentStatus !== filter.value) {
        return false;
      }
    }
    return true;
  });

  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  const totalPages = Math.ceil(count / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const goToPage = (page: number) => {
    fetchOrders({ offset: (page - 1) * limit });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
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
            <Button variant="outline" size="icon" onClick={() => fetchOrders()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={orders.length === 0}>
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
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
                  className="pl-8 w-[200px]"
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
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => fetchOrders()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && orders.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Orders Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {orders.length === 0 ? "No orders found" : "No orders match your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => (window.location.href = `/orders/${order.id}`)}
                      >
                        <TableCell className="font-medium">#{order.displayId}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.email}</TableCell>
                        <TableCell>
                          <PaymentStatusBadge status={order.paymentStatus as PaymentStatus} />
                        </TableCell>
                        <TableCell>
                          <FulfillmentStatusBadge status={order.fulfillmentStatus as FulfillmentStatus} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.total, order.currencyCode)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  {offset + 1} — {Math.min(offset + limit, count)} of {count} results
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {currentPage} of {totalPages || 1} pages
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
