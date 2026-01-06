"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  Tag,
  Percent,
  Truck,
  Gift,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Copy,
  TrendingUp,
  Calendar,
  Users,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  getDiscounts,
  getDiscountStats,
  getDiscountActivity,
  activateDiscount,
  deactivateDiscount,
  deleteDiscount,
  duplicateDiscount,
  bulkDiscountAction,
  formatPrice,
  formatDateTime,
  type Promotion,
  type DiscountStatsResponse,
  type DiscountActivityItem,
  getPromotionTypeDisplay,
  getPromotionStatusDisplay,
  formatDiscountValue,
} from "@/lib/api";
import { DiscountDialog } from "@/components/discounts/DiscountDialog";

export default function DiscountsPage() {
  // State
  const [discounts, setDiscounts] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<DiscountStatsResponse | null>(null);
  const [activity, setActivity] = useState<DiscountActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
    count: 0,
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Promotion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDiscount, setDeletingDiscount] = useState<Promotion | null>(null);

  // Fetch data
  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDiscounts({
        limit: pagination.limit,
        offset: pagination.offset,
        q: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      });
      setDiscounts(response.items);
      setPagination((prev) => ({
        ...prev,
        count: response.count,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load discounts");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.offset, searchQuery, statusFilter, typeFilter]);

  const fetchStats = async () => {
    try {
      const response = await getDiscountStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await getDiscountActivity({ limit: 20 });
      setActivity(response.items);
    } catch (err) {
      console.error("Failed to load activity:", err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchStats();
    fetchActivity();
  }, [fetchDiscounts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, offset: 0 }));
      fetchDiscounts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleCreateDiscount = () => {
    setEditingDiscount(null);
    setDialogOpen(true);
  };

  const handleEditDiscount = (discount: Promotion) => {
    setEditingDiscount(discount);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (discount: Promotion) => {
    try {
      if (discount.isActive) {
        await deactivateDiscount(discount.id);
      } else {
        await activateDiscount(discount.id);
      }
      await fetchDiscounts();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDuplicate = async (discount: Promotion) => {
    try {
      await duplicateDiscount(discount.id);
      await fetchDiscounts();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate");
    }
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;
    try {
      await deleteDiscount(deletingDiscount.id);
      setDeleteDialogOpen(false);
      setDeletingDiscount(null);
      await fetchDiscounts();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleBulkAction = async (action: "ACTIVATE" | "DEACTIVATE" | "DELETE") => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDiscountAction({
        ids: Array.from(selectedIds),
        action,
      });
      setSelectedIds(new Set());
      await fetchDiscounts();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    }
  };

  const handleDialogSuccess = () => {
    fetchDiscounts();
    fetchStats();
    fetchActivity();
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === discounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(discounts.map((d) => d.id)));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PERCENTAGE":
        return <Percent className="h-4 w-4" />;
      case "FIXED":
        return <Tag className="h-4 w-4" />;
      case "FREE_SHIPPING":
        return <Truck className="h-4 w-4" />;
      case "BUY_X_GET_Y":
        return <Gift className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage promotions, discount codes, and pricing rules
          </p>
        </div>
        <Button onClick={handleCreateDiscount}>
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePromotions}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalPromotions} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledPromotions}</div>
              <p className="text-xs text-muted-foreground">upcoming promotions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redemptions Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.redemptionsToday}</div>
              <p className="text-xs text-muted-foreground">
                {stats.redemptionsThisWeek} this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(stats.totalDiscountGiven * 100, "GBP")}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalRedemptions} redemptions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by code or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                    <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    fetchDiscounts();
                    fetchStats();
                    fetchActivity();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("ACTIVATE")}
                  >
                    <Power className="h-4 w-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("DEACTIVATE")}
                  >
                    <PowerOff className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction("DELETE")}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discounts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          discounts.length > 0 &&
                          selectedIds.size === discounts.length
                        }
                        onCheckedChange={toggleAllSelection}
                      />
                    </TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && discounts.length === 0 ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : discounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="text-muted-foreground">
                          No discounts found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    discounts.map((discount) => {
                      const typeDisplay = getPromotionTypeDisplay(discount.type);
                      const statusDisplay = getPromotionStatusDisplay(discount.status);

                      return (
                        <TableRow key={discount.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(discount.id)}
                              onCheckedChange={() => toggleSelection(discount.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono font-medium">
                              {discount.code}
                            </div>
                            {discount.name && (
                              <div className="text-sm text-muted-foreground">
                                {discount.name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(discount.type)}
                              <span className="text-sm">{typeDisplay.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatDiscountValue(discount.type, discount.value)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusDisplay.color}>
                              {statusDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {discount.usageCount}
                              {discount.usageLimit && ` / ${discount.usageLimit}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {discount.startsAt ? (
                                <div>
                                  <span className="text-muted-foreground">From:</span>{" "}
                                  {new Date(discount.startsAt).toLocaleDateString()}
                                </div>
                              ) : null}
                              {discount.endsAt ? (
                                <div>
                                  <span className="text-muted-foreground">Until:</span>{" "}
                                  {new Date(discount.endsAt).toLocaleDateString()}
                                </div>
                              ) : null}
                              {!discount.startsAt && !discount.endsAt && (
                                <span className="text-muted-foreground">No limit</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditDiscount(discount)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDuplicate(discount)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(discount)}
                                >
                                  {discount.isActive ? (
                                    <>
                                      <PowerOff className="h-4 w-4 mr-2" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Power className="h-4 w-4 mr-2" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDeletingDiscount(discount);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {pagination.count > pagination.limit && (
              <CardContent className="border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Showing {pagination.offset + 1} to{" "}
                    {Math.min(pagination.offset + pagination.limit, pagination.count)} of{" "}
                    {pagination.count}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset === 0}
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          offset: Math.max(0, prev.offset - prev.limit),
                        }))
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        pagination.offset + pagination.limit >= pagination.count
                      }
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          offset: prev.offset + prev.limit,
                        }))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Activity Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {item.activityType.includes("CREATED") ? (
                          <Plus className="h-4 w-4 text-green-600" />
                        ) : item.activityType.includes("ACTIVATED") ? (
                          <Power className="h-4 w-4 text-green-600" />
                        ) : item.activityType.includes("DEACTIVATED") ? (
                          <PowerOff className="h-4 w-4 text-yellow-600" />
                        ) : item.activityType.includes("DELETED") ? (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        ) : item.activityType.includes("REDEEMED") ? (
                          <Tag className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          {stats && stats.topPerformingCodes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topPerformingCodes.map((code, index) => (
                    <div key={code.promotionId} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-sm truncate">{code.code}</div>
                        <div className="text-xs text-muted-foreground">
                          {code.redemptionCount} uses
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatPrice(code.totalDiscount * 100, "GBP")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Discount Dialog */}
      <DiscountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        discount={editingDiscount}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the discount code &quot;{deletingDiscount?.code}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
