"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Plus,
  Gift,
  MoreHorizontal,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  TrendingUp,
  CreditCard,
  Clock,
  DollarSign,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import {
  getGiftCards,
  getGiftCardStats,
  createGiftCard,
  updateGiftCard,
  disableGiftCard,
  enableGiftCard,
  deleteGiftCard,
  bulkGiftCardAction,
  adjustGiftCardBalance,
  type GiftCardListItem,
  type GiftCardStatsResponse,
  type GiftCardStatus,
  getGiftCardStatusDisplay,
} from "@/lib/api";

export default function GiftCardsPage() {
  // State
  const [giftCards, setGiftCards] = useState<GiftCardListItem[]>([]);
  const [stats, setStats] = useState<GiftCardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
    count: 0,
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCardListItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    amount: "",
    recipientName: "",
    recipientEmail: "",
    message: "",
    expiresInDays: "",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Balance adjustment form state
  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    reason: "",
  });

  // Fetch data
  const fetchGiftCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getGiftCards({
        limit: pagination.limit,
        offset: pagination.offset,
        q: searchQuery || undefined,
        status: statusFilter !== "all" ? (statusFilter as GiftCardStatus) : undefined,
      });
      setGiftCards(response.items);
      setPagination((prev) => ({
        ...prev,
        count: response.count,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load gift cards");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, pagination.offset, searchQuery, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await getGiftCardStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  useEffect(() => {
    fetchGiftCards();
    fetchStats();
  }, [fetchGiftCards]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((prev) => ({ ...prev, offset: 0 }));
      fetchGiftCards();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handlers
  const handleCreateGiftCard = async () => {
    if (!createForm.amount) return;

    setCreateLoading(true);
    try {
      await createGiftCard({
        amount: Math.round(parseFloat(createForm.amount) * 100), // Convert to pence
        recipientName: createForm.recipientName || undefined,
        recipientEmail: createForm.recipientEmail || undefined,
        message: createForm.message || undefined,
        expiresInDays: createForm.expiresInDays ? parseInt(createForm.expiresInDays) : undefined,
      });
      setCreateDialogOpen(false);
      setCreateForm({
        amount: "",
        recipientName: "",
        recipientEmail: "",
        message: "",
        expiresInDays: "",
      });
      await fetchGiftCards();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create gift card");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (card: GiftCardListItem) => {
    try {
      if (card.status === "ACTIVE") {
        await disableGiftCard(card.id);
      } else if (card.status === "DISABLED") {
        await enableGiftCard(card.id);
      }
      await fetchGiftCards();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!selectedCard) return;
    try {
      await deleteGiftCard(selectedCard.id);
      setDeleteDialogOpen(false);
      setSelectedCard(null);
      await fetchGiftCards();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedCard || !balanceForm.amount) return;
    try {
      const amount = Math.round(parseFloat(balanceForm.amount) * 100); // Convert to pence
      await adjustGiftCardBalance(selectedCard.id, {
        amount,
        reason: balanceForm.reason || undefined,
      });
      setBalanceDialogOpen(false);
      setBalanceForm({ amount: "", reason: "" });
      setSelectedCard(null);
      await fetchGiftCards();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust balance");
    }
  };

  const handleBulkAction = async (action: "DISABLE" | "ENABLE" | "DELETE") => {
    if (selectedIds.size === 0) return;
    try {
      await bulkGiftCardAction({
        ids: Array.from(selectedIds),
        action,
      });
      setSelectedIds(new Set());
      await fetchGiftCards();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
    if (selectedIds.size === giftCards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(giftCards.map((c) => c.id)));
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gift Cards</h1>
          <p className="text-sm text-muted-foreground">
            Manage gift cards, track balances, and monitor redemptions
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Gift Card
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGiftCards}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.totalGiftCards} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.formattedRemainingValue}</div>
              <p className="text-xs text-muted-foreground">unredeemed balance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.formattedRedeemedValue}</div>
              <p className="text-xs text-muted-foreground">
                {stats.fullyRedeemedGiftCards} fully used
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringThisWeek}</div>
              <p className="text-xs text-muted-foreground">within 7 days</p>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="FULLY_REDEEMED">Fully Redeemed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="DISABLED">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                fetchGiftCards();
                fetchStats();
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
                onClick={() => handleBulkAction("ENABLE")}
              >
                <Power className="h-4 w-4 mr-1" />
                Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction("DISABLE")}
              >
                <PowerOff className="h-4 w-4 mr-1" />
                Disable
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

      {/* Gift Cards Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      giftCards.length > 0 &&
                      selectedIds.size === giftCards.length
                    }
                    onCheckedChange={toggleAllSelection}
                  />
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initial Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && giftCards.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  </TableRow>
                ))
              ) : giftCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Gift className="h-8 w-8" />
                      <span>No gift cards found</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                giftCards.map((card) => {
                  const statusDisplay = getGiftCardStatusDisplay(card.status);

                  return (
                    <TableRow key={card.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(card.id)}
                          onCheckedChange={() => toggleSelection(card.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sm">
                            {card.code}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(card.code)}
                          >
                            {copiedCode === card.code ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {card.recipientName || card.recipientEmail ? (
                            <>
                              {card.recipientName && (
                                <div className="font-medium">{card.recipientName}</div>
                              )}
                              {card.recipientEmail && (
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {card.recipientEmail}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusDisplay.color}>
                          {statusDisplay.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {card.formattedInitialAmount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={card.remainingAmount === 0 ? "text-muted-foreground" : "font-medium text-green-600"}>
                          {card.formattedBalance}
                        </span>
                      </TableCell>
                      <TableCell>
                        {card.expiresAt ? (
                          <div className={`text-sm ${card.isExpired ? "text-red-600" : ""}`}>
                            {new Date(card.expiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {card.createdAt
                            ? new Date(card.createdAt).toLocaleDateString()
                            : "-"}
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
                              onClick={() => {
                                setSelectedCard(card);
                                setBalanceDialogOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Adjust Balance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {(card.status === "ACTIVE" || card.status === "DISABLED") && (
                              <DropdownMenuItem
                                onClick={() => handleToggleStatus(card)}
                              >
                                {card.status === "ACTIVE" ? (
                                  <>
                                    <PowerOff className="h-4 w-4 mr-2" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 mr-2" />
                                    Enable
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCard(card);
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

      {/* Create Gift Card Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Gift Card</DialogTitle>
            <DialogDescription>
              Create a new gift card with an initial balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (GBP) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="25.00"
                value={createForm.amount}
                onChange={(e) =>
                  setCreateForm({ ...createForm, amount: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  placeholder="John Doe"
                  value={createForm.recipientName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, recipientName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={createForm.recipientEmail}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, recipientEmail: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Personal Message</Label>
              <Textarea
                id="message"
                placeholder="Happy Birthday!"
                value={createForm.message}
                onChange={(e) =>
                  setCreateForm({ ...createForm, message: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresInDays">Expires In (Days)</Label>
              <Input
                id="expiresInDays"
                type="number"
                min="1"
                placeholder="365 (leave empty for no expiration)"
                value={createForm.expiresInDays}
                onChange={(e) =>
                  setCreateForm({ ...createForm, expiresInDays: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateGiftCard}
              disabled={!createForm.amount || createLoading}
            >
              {createLoading ? "Creating..." : "Create Gift Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Add or remove balance from gift card {selectedCard?.code}. Current
              balance: {selectedCard?.formattedBalance}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balanceAmount">Amount (GBP)</Label>
              <Input
                id="balanceAmount"
                type="number"
                step="0.01"
                placeholder="10.00 (negative to deduct)"
                value={balanceForm.amount}
                onChange={(e) =>
                  setBalanceForm({ ...balanceForm, amount: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Use positive values to add, negative to deduct
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceReason">Reason</Label>
              <Input
                id="balanceReason"
                placeholder="e.g., Refund, Bonus, Correction"
                value={balanceForm.reason}
                onChange={(e) =>
                  setBalanceForm({ ...balanceForm, reason: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={!balanceForm.amount}
            >
              Adjust Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gift Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the gift card &quot;{selectedCard?.code}&quot;?
              This action cannot be undone. The remaining balance of{" "}
              {selectedCard?.formattedBalance} will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
