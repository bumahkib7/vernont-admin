"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  MoreHorizontal,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  RefreshCcw,
  Box,
  Warehouse,
  Loader2,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  getInventoryLevels,
  getStockLocations,
  adjustInventory,
  getInventoryMovements,
  getMovementTypeDisplay,
  type InventoryLevel,
  type StockLocation,
  type InventoryMovement,
  type MovementType,
} from "@/lib/api";
import { toast } from "sonner";

type AdjustmentType = "add" | "remove" | "adjust";

interface AdjustmentDialogState {
  isOpen: boolean;
  type: AdjustmentType;
  level: InventoryLevel | null;
}

const ADJUSTMENT_REASONS = [
  { value: "RESTOCK", label: "Restock", description: "Received new inventory" },
  { value: "DAMAGED", label: "Damaged", description: "Items damaged" },
  { value: "LOST", label: "Lost", description: "Items lost or missing" },
  { value: "FOUND", label: "Found", description: "Previously lost items found" },
  { value: "CORRECTION", label: "Correction", description: "Manual correction" },
  { value: "RETURN_RECEIVED", label: "Return Received", description: "Items returned by customer" },
  { value: "TRANSFER_IN", label: "Transfer In", description: "Transfer from another location" },
  { value: "TRANSFER_OUT", label: "Transfer Out", description: "Transfer to another location" },
  { value: "CYCLE_COUNT", label: "Cycle Count", description: "Inventory count adjustment" },
  { value: "OTHER", label: "Other", description: "Other reason" },
] as const;

function getStockStatus(available: number, stocked: number) {
  if (stocked === 0) return "out_of_stock";
  if (available <= 2) return "low_stock";
  return "in_stock";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "in_stock":
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    case "low_stock":
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    case "out_of_stock":
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<string>("levels");
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>("all");

  // Adjustment dialog state
  const [adjustmentDialog, setAdjustmentDialog] = useState<AdjustmentDialogState>({
    isOpen: false,
    type: "add",
    level: null,
  });
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(1);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("RESTOCK");
  const [adjustmentNote, setAdjustmentNote] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [levelsResponse, locationsResponse] = await Promise.all([
        getInventoryLevels({ limit: 100 }),
        getStockLocations({ limit: 50 }),
      ]);

      setInventoryLevels(levelsResponse.inventory_levels);
      setLocations(locationsResponse.stock_locations);
    } catch (err) {
      console.error("Failed to fetch inventory data:", err);
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMovements = useCallback(async () => {
    try {
      setIsLoadingMovements(true);
      const response = await getInventoryMovements({
        limit: 100,
        locationId: selectedLocation !== "all" ? selectedLocation : undefined,
        movementType: movementTypeFilter !== "all" ? movementTypeFilter : undefined,
      });
      setMovements(response.movements);
    } catch (err) {
      console.error("Failed to fetch movements:", err);
      toast.error("Failed to load stock movements");
    } finally {
      setIsLoadingMovements(false);
    }
  }, [selectedLocation, movementTypeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "movements") {
      fetchMovements();
    }
  }, [activeTab, fetchMovements]);

  // Filter inventory levels
  const filteredLevels = inventoryLevels.filter((level) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (level.sku?.toLowerCase().includes(searchLower)) ||
      (level.locationName?.toLowerCase().includes(searchLower));

    // Location filter
    const matchesLocation = selectedLocation === "all" || level.locationId === selectedLocation;

    // Status filter
    const status = getStockStatus(level.availableQuantity, level.stockedQuantity);
    const matchesStatus = statusFilter === "all" || status === statusFilter;

    return matchesSearch && matchesLocation && matchesStatus;
  });

  // Calculate stats
  const stats = {
    totalItems: inventoryLevels.reduce((acc, level) => acc + level.stockedQuantity, 0),
    available: inventoryLevels.reduce((acc, level) => acc + level.availableQuantity, 0),
    reserved: inventoryLevels.reduce((acc, level) => acc + level.reservedQuantity, 0),
    lowStock: inventoryLevels.filter(
      (level) => getStockStatus(level.availableQuantity, level.stockedQuantity) === "low_stock"
    ).length,
    outOfStock: inventoryLevels.filter(
      (level) => getStockStatus(level.availableQuantity, level.stockedQuantity) === "out_of_stock"
    ).length,
  };

  const openAdjustmentDialog = (type: AdjustmentType, level: InventoryLevel) => {
    setAdjustmentDialog({ isOpen: true, type, level });
    setAdjustmentQuantity(1);
    // Set default reason based on type
    if (type === "add") {
      setAdjustmentReason("RESTOCK");
    } else if (type === "remove") {
      setAdjustmentReason("DAMAGED");
    } else {
      setAdjustmentReason("CORRECTION");
    }
    setAdjustmentNote("");
  };

  const closeAdjustmentDialog = () => {
    setAdjustmentDialog({ isOpen: false, type: "add", level: null });
  };

  const handleAdjustment = async () => {
    if (!adjustmentDialog.level) return;

    try {
      setIsAdjusting(true);

      // Calculate the actual adjustment value
      let adjustmentValue = adjustmentQuantity;
      if (adjustmentDialog.type === "remove") {
        adjustmentValue = -adjustmentQuantity;
      } else if (adjustmentDialog.type === "adjust") {
        // For "adjust", the user enters the new target quantity
        // So adjustment = target - current
        adjustmentValue = adjustmentQuantity - adjustmentDialog.level.stockedQuantity;
      }

      await adjustInventory({
        inventoryLevelId: adjustmentDialog.level.id,
        adjustment: adjustmentValue,
        reason: adjustmentReason,
        note: adjustmentNote || undefined,
      });

      toast.success(`Successfully ${adjustmentDialog.type === "add" ? "added" : adjustmentDialog.type === "remove" ? "removed" : "adjusted"} stock`);

      // Refresh data
      await fetchData();
      closeAdjustmentDialog();
    } catch (err) {
      console.error("Failed to adjust inventory:", err);
      toast.error(err instanceof Error ? err.message : "Failed to adjust inventory");
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Failed to load inventory</p>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Track and manage your stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Link href="/inventory/locations">
            <Button variant="outline" className="gap-2">
              <Warehouse className="h-4 w-4" />
              Locations
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{stats.available}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="text-2xl font-bold">{stats.reserved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{stats.lowStock + stats.outOfStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Low Stock Alert</p>
              <p className="text-sm text-yellow-700">
                {stats.lowStock + stats.outOfStock} items need attention
                {stats.outOfStock > 0 && ` (${stats.outOfStock} out of stock)`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              onClick={() => {
                setStatusFilter("low_stock");
                setActiveTab("levels");
              }}
            >
              View Items
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Stock Levels and Movements */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="levels" className="gap-2">
            <Package className="h-4 w-4" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <History className="h-4 w-4" />
            Stock Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="levels" className="space-y-4">
          {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by SKU, location..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchQuery || statusFilter !== "all" || selectedLocation !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSelectedLocation("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
          <CardDescription>
            {filteredLevels.length} of {inventoryLevels.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLevels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No inventory items</p>
              <p className="text-muted-foreground">
                {inventoryLevels.length === 0
                  ? "Add products with inventory tracking to see stock levels here"
                  : "No items match your current filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">In Stock</TableHead>
                  <TableHead className="text-center">Reserved</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Incoming</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLevels.map((level) => {
                  const status = getStockStatus(level.availableQuantity, level.stockedQuantity);
                  return (
                    <TableRow key={level.id}>
                      <TableCell className="font-mono text-sm">
                        {level.sku || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {level.locationName || "-"}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {level.stockedQuantity}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {level.reservedQuantity}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={level.availableQuantity <= 2 ? "text-yellow-600 font-medium" : ""}>
                          {level.availableQuantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {level.incomingQuantity}
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openAdjustmentDialog("add", level)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjustmentDialog("remove", level)}>
                              <Minus className="mr-2 h-4 w-4" />
                              Remove Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjustmentDialog("adjust", level)}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Adjust Inventory
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          {/* Movements Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Movement Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="STOCK_ADDED">Stock Added</SelectItem>
                    <SelectItem value="STOCK_REMOVED">Stock Removed</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                    <SelectItem value="RELEASED">Released</SelectItem>
                    <SelectItem value="FULFILLED">Fulfilled</SelectItem>
                    <SelectItem value="RETURNED">Returned</SelectItem>
                    <SelectItem value="TRANSFERRED_IN">Transfer In</SelectItem>
                    <SelectItem value="TRANSFERRED_OUT">Transfer Out</SelectItem>
                    <SelectItem value="CYCLE_COUNT">Cycle Count</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" onClick={fetchMovements}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
              <CardDescription>
                History of all inventory changes - live updates from event stream
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMovements ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No movements yet</p>
                  <p className="text-muted-foreground">
                    Stock movements will appear here as inventory changes occur
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const typeDisplay = getMovementTypeDisplay(movement.movementType);
                      const isPositive = movement.quantity > 0;
                      return (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <Badge className={typeDisplay.color} variant="secondary">
                              {typeDisplay.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {movement.sku || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.locationName || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`font-medium flex items-center justify-center gap-1 ${
                              isPositive ? "text-green-600" : "text-red-600"
                            }`}>
                              {isPositive ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              {isPositive ? "+" : ""}{movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate">
                            {movement.reason || movement.note || "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(movement.occurredAt).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjustment Dialog */}
      <Dialog open={adjustmentDialog.isOpen} onOpenChange={(open) => !open && closeAdjustmentDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {adjustmentDialog.type === "add" && "Add Stock"}
              {adjustmentDialog.type === "remove" && "Remove Stock"}
              {adjustmentDialog.type === "adjust" && "Adjust Inventory"}
            </DialogTitle>
            <DialogDescription>
              {adjustmentDialog.level && (
                <>
                  SKU: <span className="font-mono">{adjustmentDialog.level.sku || "N/A"}</span>
                  <br />
                  Current stock: {adjustmentDialog.level.stockedQuantity}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">
                {adjustmentDialog.type === "adjust" ? "New Quantity" : "Quantity"}
              </Label>
              <Input
                id="quantity"
                type="number"
                min={adjustmentDialog.type === "adjust" ? 0 : 1}
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
              />
              {adjustmentDialog.type === "adjust" && adjustmentDialog.level && (
                <p className="text-xs text-muted-foreground">
                  Change: {adjustmentQuantity - adjustmentDialog.level.stockedQuantity > 0 ? "+" : ""}
                  {adjustmentQuantity - adjustmentDialog.level.stockedQuantity}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Select value={adjustmentReason} onValueChange={setAdjustmentReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      <span className="font-medium">{reason.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{reason.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this adjustment..."
                value={adjustmentNote}
                onChange={(e) => setAdjustmentNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAdjustmentDialog} disabled={isAdjusting}>
              Cancel
            </Button>
            <Button onClick={handleAdjustment} disabled={isAdjusting || adjustmentQuantity < 0}>
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
