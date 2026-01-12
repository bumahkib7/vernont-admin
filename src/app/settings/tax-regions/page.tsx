"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Receipt,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  getTaxRegions,
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getRegions,
  ApiError,
  type TaxRegion,
  type TaxRate,
  type Region,
  type CreateTaxRateInput,
  type UpdateTaxRateInput,
} from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function TaxRegionsSettingsPage() {
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  // WebSocket for real-time updates
  const { isConnected, subscribe } = useWebSocket();

  // Create modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createRate, setCreateRate] = useState("");
  const [createRegionId, setCreateRegionId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editRate, setEditRate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTaxRate, setDeletingTaxRate] = useState<TaxRate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Fetch tax regions
  const fetchTaxRegions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [taxRegionsResponse, regionsResponse] = await Promise.all([
        getTaxRegions({ limit: 100 }),
        getRegions({ limit: 100 }),
      ]);
      setTaxRegions(taxRegionsResponse.tax_regions || []);
      setRegions(regionsResponse.regions || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTaxRegions();
  }, [fetchTaxRegions]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe("/topic/auditlog", (message) => {
      const auditLog = message as {
        entityType?: string;
        action?: string;
      };

      // Refetch when TaxRate or Region entity is modified
      if (auditLog.entityType === "TaxRate" || auditLog.entityType === "Region") {
        fetchTaxRegions();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, fetchTaxRegions]);

  // Filter tax regions by search
  const filteredTaxRegions = taxRegions.filter((taxRegion) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      taxRegion.region_name.toLowerCase().includes(query) ||
      taxRegion.currency_code.toLowerCase().includes(query) ||
      taxRegion.tax_rates.some(
        (rate) =>
          rate.name.toLowerCase().includes(query) ||
          rate.code?.toLowerCase().includes(query)
      )
    );
  });

  // Toggle region expansion
  const toggleRegion = (regionId: string) => {
    setExpandedRegions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(regionId)) {
        newSet.delete(regionId);
      } else {
        newSet.add(regionId);
      }
      return newSet;
    });
  };

  // Handle create
  const handleCreate = async () => {
    if (!createName || !createRate || !createRegionId) {
      setCreateError("Name, rate, and region are required");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const data: CreateTaxRateInput = {
        name: createName,
        code: createCode || undefined,
        rate: parseFloat(createRate),
        regionId: createRegionId,
      };

      await createTaxRate(data);
      setIsCreateOpen(false);
      resetCreateForm();
      fetchTaxRegions();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreateCode("");
    setCreateRate("");
    setCreateRegionId("");
    setCreateError(null);
  };

  // Handle edit
  const openEditModal = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate);
    setEditName(taxRate.name);
    setEditCode(taxRate.code || "");
    setEditRate(taxRate.rate.toString());
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTaxRate || !editName) {
      setEditError("Name is required");
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);

      const data: UpdateTaxRateInput = {
        name: editName,
        code: editCode || undefined,
        rate: editRate ? parseFloat(editRate) : undefined,
      };

      await updateTaxRate(editingTaxRate.id, data);
      setIsEditOpen(false);
      setEditingTaxRate(null);
      fetchTaxRegions();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const openDeleteConfirm = (taxRate: TaxRate) => {
    setDeletingTaxRate(taxRate);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTaxRate) return;

    try {
      setIsDeleting(true);
      await deleteTaxRate(deletingTaxRate.id);
      setIsDeleteOpen(false);
      setDeletingTaxRate(null);
      fetchTaxRegions();
    } catch (err) {
      console.error("Failed to delete tax rate:", err);
    } finally {
      setIsDeleting(false);
    }
  };

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
            <BreadcrumbPage>Tax Regions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Tax Regions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Tax Regions
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
            <CardDescription>Manage tax settings for different regions</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Tax Rate
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tax regions..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchTaxRegions} className="ml-auto">
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
              {/* Tax Regions Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Default Tax Rate</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Tax Rates</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTaxRegions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No tax regions match your search" : "No tax regions found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTaxRegions.map((taxRegion) => (
                      <Collapsible key={taxRegion.region_id} asChild>
                        <>
                          <TableRow className="hover:bg-muted/50">
                            <TableCell>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleRegion(taxRegion.region_id)}
                                >
                                  {expandedRegions.has(taxRegion.region_id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                {taxRegion.region_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {taxRegion.default_tax_rate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{taxRegion.currency_code}</Badge>
                            </TableCell>
                            <TableCell>
                              {taxRegion.tax_rate_count > 0
                                ? `${taxRegion.tax_rate_count} rate${taxRegion.tax_rate_count === 1 ? "" : "s"}`
                                : "No custom rates"}
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
                                      setCreateRegionId(taxRegion.region_id);
                                      setIsCreateOpen(true);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Tax Rate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <>
                              {taxRegion.tax_rates.length > 0 &&
                                expandedRegions.has(taxRegion.region_id) &&
                                taxRegion.tax_rates.map((rate) => (
                                  <TableRow key={rate.id} className="bg-muted/30">
                                    <TableCell></TableCell>
                                    <TableCell className="pl-10">
                                      <span className="text-sm">{rate.name}</span>
                                      {rate.code && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({rate.code})
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="secondary">{rate.rate}%</Badge>
                                    </TableCell>
                                    <TableCell></TableCell>
                                    <TableCell>
                                      <span className="text-xs text-muted-foreground">
                                        {rate.product_types ? "Product types" : "All products"}
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => openEditModal(rate)}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit Tax Rate
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => openDeleteConfirm(rate)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Tax Rate
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {filteredTaxRegions.length} tax region{filteredTaxRegions.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Tax Rate Dialog */}
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
              <Receipt className="h-5 w-5" />
              Create Tax Rate
            </DialogTitle>
            <DialogDescription>
              Add a new tax rate for a specific region.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-region">Region *</Label>
              <Select value={createRegionId} onValueChange={setCreateRegionId}>
                <SelectTrigger id="create-region">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.currency_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Standard VAT"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-code">Code</Label>
              <Input
                id="create-code"
                placeholder="e.g., VAT-20"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-rate">Rate (%) *</Label>
              <Input
                id="create-rate"
                type="number"
                placeholder="e.g., 20"
                value={createRate}
                onChange={(e) => setCreateRate(e.target.value)}
                step="0.01"
                min="0"
                max="100"
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
                "Create Tax Rate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tax Rate Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Tax Rate
            </DialogTitle>
            <DialogDescription>Update tax rate settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Region: </span>
              <span className="font-medium">{editingTaxRate?.region_name}</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-rate">Rate (%)</Label>
              <Input
                id="edit-rate"
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                step="0.01"
                min="0"
                max="100"
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
              Delete Tax Rate
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tax rate{" "}
              <strong>{deletingTaxRate?.name}</strong>? This action cannot be undone.
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
                "Delete Tax Rate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
