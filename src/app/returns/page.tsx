"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Search,
  SlidersHorizontal,
  Plus,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Package,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  ReturnSummary,
  formatPrice,
  formatDate,
  getReturnStatusDisplay,
} from "@/lib/api";
import { usePageContext } from "@/hooks/use-page-context";
import { useReturns, useReturnStats } from "@/hooks/use-returns";

function ReturnStatusBadge({ status }: { status: string }) {
  const { label, color } = getReturnStatusDisplay(status);
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

const returnStatuses = [
  { value: "APPROVED", label: "Approved" },
  { value: "RECEIVED", label: "Received" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELED", label: "Canceled" },
];

export default function ReturnsPage() {
  usePageContext("returns");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });

  // Debounce search input (UI concern, not data fetching)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const statusFilter = activeFilters.find((f) => f.id === "status")?.value;

  const {
    data: returnsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReturns({
    limit: pagination.limit,
    offset: pagination.offset,
    q: debouncedSearch || undefined,
    status: statusFilter,
  });

  const { data: stats } = useReturnStats();

  const returns = returnsData?.returns ?? [];
  const count = returnsData?.count ?? 0;

  const addFilter = (filter: Filter) => {
    const newFilters = activeFilters.filter((f) => f.id !== filter.id);
    setActiveFilters([...newFilters, filter]);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter((f) => f.id !== filterId));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const totalPages = Math.ceil(count / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  };

  const returnColumns: Column<ReturnSummary>[] = useMemo(
    () => [
      {
        id: "returnId",
        header: "Return ID",
        cell: (ret) => (
          <span className="font-mono text-sm">{ret.id.slice(0, 8)}...</span>
        ),
      },
      {
        id: "order",
        header: "Order",
        cell: (ret) => (
          <span className="font-medium">
            #{ret.orderDisplayId || ret.orderId.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "customer",
        header: "Customer",
        hideOnMobile: true,
        cell: (ret) => <>{ret.customerEmail || "-"}</>,
      },
      {
        id: "status",
        header: "Status",
        cell: (ret) => <ReturnStatusBadge status={ret.status} />,
      },
      {
        id: "reason",
        header: "Reason",
        hideOnTablet: true,
        cell: (ret) => (
          <span className="capitalize">
            {ret.reason.replace(/_/g, " ").toLowerCase()}
          </span>
        ),
      },
      {
        id: "items",
        header: "Items",
        hideOnMobile: true,
        cell: (ret) => <>{ret.itemCount}</>,
      },
      {
        id: "date",
        header: "Date",
        hideOnTablet: true,
        cell: (ret) => <>{formatDate(ret.requestedAt)}</>,
      },
      {
        id: "refundAmount",
        header: "Refund Amount",
        className: "text-right",
        cell: (ret) => <>{formatPrice(ret.refundAmount / 100, ret.currencyCode)}</>,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Returns</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Received</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.received}</div>
              <p className="text-xs text-muted-foreground">Ready for refund</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.refunded}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <CardTitle className="text-xl font-semibold">Returns</CardTitle>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
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

                    {/* Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Return Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {returnStatuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status.value}
                            checked={activeFilters.some((f) => f.id === "status" && f.value === status.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addFilter({
                                  id: "status",
                                  label: `Status: ${status.label}`,
                                  value: status.value,
                                });
                              } else {
                                removeFilter("status");
                              }
                            }}
                          >
                            {status.label}
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
                    onClick={() => removeFilter(filter.id)}
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
                  placeholder="Search by order or email..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, offset: 0 }));
                  }}
                />
              </div>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error State */}
          {isError && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error instanceof Error ? error.message : "Failed to load returns"}</span>
              <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Returns Table */}
          <DataTable
            columns={returnColumns}
            data={returns}
            loading={isLoading}
            getRowId={(r) => r.id}
            onRowClick={(r) => (window.location.href = `/returns/${r.id}`)}
            pagination={{
              page: currentPage,
              pageSize: pagination.limit,
              total: count,
              onPageChange: goToPage,
            }}
            emptyTitle="No returns found"
            emptyIcon={<RotateCcw className="h-10 w-10 opacity-40" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
