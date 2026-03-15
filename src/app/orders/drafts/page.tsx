"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  DraftOrder,
  DraftOrderStatus,
  formatPrice,
  formatDate,
  getDraftOrder,
  getDraftOrderStatusDisplay,
  apiFetch,
} from "@/lib/api";

interface DraftOrdersListResponse {
  draftOrders: DraftOrder[];
  count: number;
  offset: number;
  limit: number;
}

function DraftStatusBadge({ status }: { status: DraftOrderStatus }) {
  const { label, color } = getDraftOrderStatusDisplay(status);
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

export default function DraftOrdersPage() {
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    count: 0,
  });

  const fetchDraftOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set("limit", pagination.limit.toString());
      searchParams.set("offset", pagination.offset.toString());
      const query = searchParams.toString();
      const response = await apiFetch<DraftOrdersListResponse>(
        `/admin/orders/drafts${query ? `?${query}` : ""}`
      );
      setDraftOrders(response.draftOrders || []);
      setPagination((prev) => ({ ...prev, count: response.count || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load draft orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraftOrders();
  }, [pagination.limit, pagination.offset]);

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

  // Filter orders based on active filters and search
  const filteredOrders = draftOrders.filter((order) => {
    // Status filter
    for (const filter of activeFilters) {
      if (filter.id === "status" && order.status !== filter.value) {
        return false;
      }
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.customerEmail?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.note?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(pagination.count / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">Draft Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchDraftOrders} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button asChild>
              <Link href="/orders/drafts/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Draft Order
              </Link>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["OPEN", "INVOICE_SENT", "COMPLETED", "CANCELLED"] as DraftOrderStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "status" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "status", label: `Status: ${getDraftOrderStatusDisplay(status).label}`, value: status });
                              else removeFilter("status", status);
                            }}
                          >
                            {getDraftOrderStatusDisplay(status).label}
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
                  placeholder="Search drafts..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchDraftOrders} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && draftOrders.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Draft Orders Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Draft</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {draftOrders.length === 0 ? "No draft orders" : "No draft orders match your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => (window.location.href = `/orders/drafts/${order.id}`)}
                      >
                        <TableCell className="font-medium font-mono text-xs">
                          {order.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.customerEmail || "No customer"}</TableCell>
                        <TableCell>
                          <DraftStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(order.total, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.count > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    {pagination.offset + 1} — {Math.min(pagination.offset + pagination.limit, pagination.count)} of {pagination.count} results
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
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
