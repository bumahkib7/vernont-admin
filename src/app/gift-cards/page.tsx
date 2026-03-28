"use client";

import { useState, useEffect } from "react";
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
  type GiftCardListItem,
  type GiftCardStatus,
  getGiftCardStatusDisplay,
} from "@/lib/api";
import {
  useGiftCards,
  useGiftCardStats,
  useCreateGiftCard,
  useAdjustGiftCardBalance,
  useDisableGiftCard,
  useEnableGiftCard,
  useDeleteGiftCard,
  useBulkGiftCardAction,
} from "@/hooks/use-gift-cards";

export default function GiftCardsPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 50,
  });

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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

  // Balance adjustment form state
  const [balanceForm, setBalanceForm] = useState({
    amount: "",
    reason: "",
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, offset: 0 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // React Query hooks
  const giftCardsQuery = useGiftCards({
    limit: pagination.limit,
    offset: pagination.offset,
    q: debouncedSearch || undefined,
    status: statusFilter !== "all" ? (statusFilter as GiftCardStatus) : undefined,
  });
  const statsQuery = useGiftCardStats();

  // Mutations
  const createMutation = useCreateGiftCard();
  const adjustBalanceMutation = useAdjustGiftCardBalance();
  const disableMutation = useDisableGiftCard();
  const enableMutation = useEnableGiftCard();
  const deleteMutation = useDeleteGiftCard();
  const bulkMutation = useBulkGiftCardAction();

  const giftCards = giftCardsQuery.data?.items ?? [];
  const stats = statsQuery.data ?? null;
  const totalCount = giftCardsQuery.data?.count ?? 0;

  // Handlers
  const handleCreateGiftCard = () => {
    if (!createForm.amount) return;

    createMutation.mutate(
      {
        amount: Math.round(parseFloat(createForm.amount) * 100),
        recipientName: createForm.recipientName || undefined,
        recipientEmail: createForm.recipientEmail || undefined,
        message: createForm.message || undefined,
        expiresInDays: createForm.expiresInDays ? parseInt(createForm.expiresInDays) : undefined,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setCreateForm({
            amount: "",
            recipientName: "",
            recipientEmail: "",
            message: "",
            expiresInDays: "",
          });
        },
      }
    );
  };

  const handleToggleStatus = (card: GiftCardListItem) => {
    if (card.status === "ACTIVE") {
      disableMutation.mutate(card.id);
    } else if (card.status === "DISABLED") {
      enableMutation.mutate(card.id);
    }
  };

  const handleDelete = () => {
    if (!selectedCard) return;
    deleteMutation.mutate(selectedCard.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedCard(null);
      },
    });
  };

  const handleAdjustBalance = () => {
    if (!selectedCard || !balanceForm.amount) return;
    const amount = Math.round(parseFloat(balanceForm.amount) * 100);
    adjustBalanceMutation.mutate(
      {
        id: selectedCard.id,
        data: {
          amount,
          reason: balanceForm.reason || undefined,
        },
      },
      {
        onSuccess: () => {
          setBalanceDialogOpen(false);
          setBalanceForm({ amount: "", reason: "" });
          setSelectedCard(null);
        },
      }
    );
  };

  const handleBulkAction = (action: "DISABLE" | "ENABLE" | "DELETE") => {
    if (selectedIds.size === 0) return;
    bulkMutation.mutate(
      { ids: Array.from(selectedIds), action },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
        },
      }
    );
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

  const handleRefresh = () => {
    giftCardsQuery.refetch();
    statsQuery.refetch();
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
      {giftCardsQuery.error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{giftCardsQuery.error.message}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => giftCardsQuery.refetch()}
            className="ml-auto"
          >
            Retry
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
              onClick={handleRefresh}
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
          <div className="overflow-x-auto">
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
                <TableHead className="hidden sm:table-cell">Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Initial Amount</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="hidden sm:table-cell">Expires</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giftCardsQuery.isLoading && giftCards.length === 0 ? (
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
                      <TableCell className="hidden sm:table-cell">
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
                      <TableCell className="hidden md:table-cell">
                        <span className="font-medium">
                          {card.formattedInitialAmount}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={card.remainingAmount === 0 ? "text-muted-foreground" : "font-medium text-green-600"}>
                          {card.formattedBalance}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {card.expiresAt ? (
                          <div className={`text-sm ${card.isExpired ? "text-red-600" : ""}`}>
                            {new Date(card.expiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
                              <span className="sr-only">Open menu</span>
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
          </div>
        </CardContent>

        {/* Pagination */}
        {totalCount > pagination.limit && (
          <CardContent className="border-t">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Showing {pagination.offset + 1} to{" "}
                {Math.min(pagination.offset + pagination.limit, totalCount)} of{" "}
                {totalCount}
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
                    pagination.offset + pagination.limit >= totalCount
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
                type="text"
                inputMode="decimal"
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
              disabled={!createForm.amount || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Gift Card"}
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
                type="text"
                inputMode="decimal"
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
              disabled={!balanceForm.amount || adjustBalanceMutation.isPending}
            >
              {adjustBalanceMutation.isPending ? "Adjusting..." : "Adjust Balance"}
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
