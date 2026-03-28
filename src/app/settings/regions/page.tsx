"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Globe,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError, type Region, type CreateRegionInput, type UpdateRegionInput } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { useRegions, useCreateRegion, useUpdateRegion, useDeleteRegion } from "@/hooks/use-regions";

export default function RegionsSettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // WebSocket for real-time updates
  const { isConnected, subscribe } = useWebSocket();

  // React Query — server state
  const regionsQuery = useRegions({ limit: 100 });
  const createMutation = useCreateRegion();
  const updateMutation = useUpdateRegion();
  const deleteMutation = useDeleteRegion();

  const regions = regionsQuery.data?.regions ?? [];
  const isLoading = regionsQuery.isLoading;
  const error = regionsQuery.error
    ? regionsQuery.error instanceof ApiError
      ? regionsQuery.error.message
      : regionsQuery.error.message
    : null;

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCurrencyCode, setCreateCurrencyCode] = useState("");
  const [createAutomaticTaxes, setCreateAutomaticTaxes] = useState(false);
  const [createTaxInclusive, setCreateTaxInclusive] = useState(false);
  const [createTaxRate, setCreateTaxRate] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editName, setEditName] = useState("");
  const [editCurrencyCode, setEditCurrencyCode] = useState("");
  const [editAutomaticTaxes, setEditAutomaticTaxes] = useState(false);
  const [editTaxInclusive, setEditTaxInclusive] = useState(false);
  const [editTaxRate, setEditTaxRate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRegion, setDeletingRegion] = useState<Region | null>(null);

  // Extract error message from API error
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "An unexpected error occurred";
  };

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe("/topic/auditlog", (message) => {
      const auditLog = message as {
        entityType?: string;
        action?: string;
      };

      // Refetch regions when a Region entity is modified
      if (auditLog.entityType === "Region") {
        regionsQuery.refetch();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, regionsQuery.refetch]);

  // Filter regions by search
  const filteredRegions = regions.filter((region) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      region.name.toLowerCase().includes(query) ||
      region.currency_code.toLowerCase().includes(query) ||
      region.countries.some((c) => c.name.toLowerCase().includes(query))
    );
  });

  // Handle create
  const handleCreate = () => {
    if (!createName || !createCurrencyCode) {
      setCreateError("Name and currency code are required");
      return;
    }

    setCreateError(null);
    const data: CreateRegionInput = {
      name: createName,
      currencyCode: createCurrencyCode.toUpperCase(),
      automaticTaxes: createAutomaticTaxes,
      taxInclusive: createTaxInclusive,
      taxRate: createTaxRate ? parseFloat(createTaxRate) : undefined,
    };

    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        resetCreateForm();
      },
      onError: (err) => {
        setCreateError(getErrorMessage(err));
      },
    });
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreateCurrencyCode("");
    setCreateAutomaticTaxes(false);
    setCreateTaxInclusive(false);
    setCreateTaxRate("");
    setCreateError(null);
  };

  // Handle edit
  const openEditModal = (region: Region) => {
    setEditingRegion(region);
    setEditName(region.name);
    setEditCurrencyCode(region.currency_code);
    setEditAutomaticTaxes(region.automatic_taxes);
    setEditTaxInclusive(region.tax_inclusive);
    setEditTaxRate(region.tax_rate?.toString() || "0");
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRegion || !editName) {
      setEditError("Name is required");
      return;
    }

    setEditError(null);
    const data: UpdateRegionInput = {
      name: editName,
      currencyCode: editCurrencyCode.toUpperCase(),
      automaticTaxes: editAutomaticTaxes,
      taxInclusive: editTaxInclusive,
      taxRate: editTaxRate ? parseFloat(editTaxRate) : undefined,
    };

    updateMutation.mutate(
      { id: editingRegion.id, data },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingRegion(null);
        },
        onError: (err) => {
          setEditError(getErrorMessage(err));
        },
      },
    );
  };

  // Handle delete
  const openDeleteConfirm = (region: Region) => {
    setDeletingRegion(region);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingRegion) return;

    deleteMutation.mutate(deletingRegion.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setDeletingRegion(null);
      },
      onError: (err) => {
        console.error("Failed to delete region:", err);
        toast.error(err instanceof Error ? err.message : "Failed to delete region");
      },
    });
  };

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Regions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Regions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Regions
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-gray-500 gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Manage the markets you will operate within</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Region
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search regions..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => regionsQuery.refetch()} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Regions Table */}
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="max-w-[200px]">Countries</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="hidden sm:table-cell">Tax Rate</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead className="hidden lg:table-cell">Fulfillment</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No regions match your search" : "No regions found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegions.map((region) => (
                      <TableRow key={region.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {region.name}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-sm text-muted-foreground truncate block">
                            {region.countries.length === 0
                              ? "No countries"
                              : region.countries.slice(0, 2).map((c) => c.display_name).join(", ")}
                            {region.countries.length > 2 && ` +${region.countries.length - 2} more`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{region.currency_code}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm">
                            {region.tax_rate ? `${(region.tax_rate * 100).toFixed(1)}%` : "0%"}
                            {region.tax_inclusive && (
                              <span className="text-muted-foreground ml-1">(incl.)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {region.payment_providers.length === 0 ? (
                              <span className="text-sm text-muted-foreground">None</span>
                            ) : (
                              region.payment_providers.slice(0, 2).map((provider) => (
                                <Badge key={provider} variant="outline">
                                  {provider}
                                </Badge>
                              ))
                            )}
                            {region.payment_providers.length > 2 && (
                              <Badge variant="outline">+{region.payment_providers.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {region.fulfillment_providers.length === 0 ? (
                              <span className="text-sm text-muted-foreground">None</span>
                            ) : (
                              region.fulfillment_providers.slice(0, 2).map((provider) => (
                                <Badge key={provider} variant="outline">
                                  {provider}
                                </Badge>
                              ))
                            )}
                            {region.fulfillment_providers.length > 2 && (
                              <Badge variant="outline">+{region.fulfillment_providers.length - 2}</Badge>
                            )}
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
                              <DropdownMenuItem onClick={() => openEditModal(region)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Region
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteConfirm(region)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Region
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                {filteredRegions.length} region{filteredRegions.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Region Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Create Region
            </DialogTitle>
            <DialogDescription>
              Add a new region to define markets, currencies, and tax settings.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., North America"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-currency">Currency Code *</Label>
              <Input
                id="create-currency"
                placeholder="e.g., USD"
                value={createCurrencyCode}
                onChange={(e) => setCreateCurrencyCode(e.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-tax-rate">Tax Rate (%)</Label>
              <Input
                id="create-tax-rate"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 10"
                value={createTaxRate}
                onChange={(e) => setCreateTaxRate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="create-automatic-taxes" className="font-medium">
                  Automatic Taxes
                </Label>
                <span className="text-xs text-muted-foreground">
                  Automatically calculate taxes for this region
                </span>
              </div>
              <Switch
                id="create-automatic-taxes"
                checked={createAutomaticTaxes}
                onCheckedChange={setCreateAutomaticTaxes}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="create-tax-inclusive" className="font-medium">
                  Tax Inclusive Pricing
                </Label>
                <span className="text-xs text-muted-foreground">
                  Prices include tax in this region
                </span>
              </div>
              <Switch
                id="create-tax-inclusive"
                checked={createTaxInclusive}
                onCheckedChange={setCreateTaxInclusive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Region"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Region Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Region
            </DialogTitle>
            <DialogDescription>Update region settings and configuration.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-currency">Currency Code</Label>
              <Input
                id="edit-currency"
                value={editCurrencyCode}
                onChange={(e) => setEditCurrencyCode(e.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-tax-rate">Tax Rate (%)</Label>
              <Input
                id="edit-tax-rate"
                type="text"
                inputMode="decimal"
                value={editTaxRate}
                onChange={(e) => setEditTaxRate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-automatic-taxes" className="font-medium">
                  Automatic Taxes
                </Label>
                <span className="text-xs text-muted-foreground">
                  Automatically calculate taxes for this region
                </span>
              </div>
              <Switch
                id="edit-automatic-taxes"
                checked={editAutomaticTaxes}
                onCheckedChange={setEditAutomaticTaxes}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-tax-inclusive" className="font-medium">
                  Tax Inclusive Pricing
                </Label>
                <span className="text-xs text-muted-foreground">
                  Prices include tax in this region
                </span>
              </div>
              <Switch
                id="edit-tax-inclusive"
                checked={editTaxInclusive}
                onCheckedChange={setEditTaxInclusive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Region
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingRegion?.name}</strong>? This action
              cannot be undone. Any products, prices, or orders associated with this region may be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Region"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
