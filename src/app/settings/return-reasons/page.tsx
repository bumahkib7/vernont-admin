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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Undo2,
  Wifi,
  WifiOff,
  Sparkles,
} from "lucide-react";
import {
  getReturnReasons,
  createReturnReason,
  updateReturnReason,
  deleteReturnReason,
  seedReturnReasons,
  ApiError,
  type ReturnReason,
  type CreateReturnReasonInput,
  type UpdateReturnReasonInput,
} from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function ReturnReasonsSettingsPage() {
  const [reasons, setReasons] = useState<ReturnReason[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const { isConnected, subscribe } = useWebSocket();

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createDisplayOrder, setCreateDisplayOrder] = useState("0");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createRequiresNote, setCreateRequiresNote] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<ReturnReason | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRequiresNote, setEditRequiresNote] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingReason, setDeletingReason] = useState<ReturnReason | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seed dialog state
  const [isSeeding, setIsSeeding] = useState(false);

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

  // Fetch return reasons
  const fetchReasons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getReturnReasons({ limit: 100 });
      setReasons(response.return_reasons || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReasons();
  }, [fetchReasons]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe("/topic/auditlog", (message) => {
      const auditLog = message as {
        entityType?: string;
        action?: string;
      };

      // Refetch on ReturnReasonConfig changes
      if (auditLog.entityType === "ReturnReasonConfig") {
        fetchReasons();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, fetchReasons]);

  // Handle create
  const handleCreate = async () => {
    if (!createValue || !createLabel) {
      setCreateError("Value and label are required");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);

      const data: CreateReturnReasonInput = {
        value: createValue,
        label: createLabel,
        description: createDescription || undefined,
        displayOrder: createDisplayOrder ? parseInt(createDisplayOrder) : 0,
        isActive: createIsActive,
        requiresNote: createRequiresNote,
      };

      await createReturnReason(data);
      setIsCreateOpen(false);
      resetCreateForm();
      fetchReasons();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateValue("");
    setCreateLabel("");
    setCreateDescription("");
    setCreateDisplayOrder("0");
    setCreateIsActive(true);
    setCreateRequiresNote(false);
    setCreateError(null);
  };

  // Handle edit
  const openEditDialog = (reason: ReturnReason) => {
    setEditingReason(reason);
    setEditValue(reason.value);
    setEditLabel(reason.label);
    setEditDescription(reason.description || "");
    setEditDisplayOrder(reason.display_order.toString());
    setEditIsActive(reason.is_active);
    setEditRequiresNote(reason.requires_note);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingReason || !editLabel) {
      setEditError("Label is required");
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);

      const data: UpdateReturnReasonInput = {
        value: editValue !== editingReason.value ? editValue : undefined,
        label: editLabel,
        description: editDescription || undefined,
        displayOrder: editDisplayOrder ? parseInt(editDisplayOrder) : undefined,
        isActive: editIsActive,
        requiresNote: editRequiresNote,
      };

      await updateReturnReason(editingReason.id, data);
      setIsEditOpen(false);
      setEditingReason(null);
      fetchReasons();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete
  const openDeleteConfirm = (reason: ReturnReason) => {
    setDeletingReason(reason);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingReason) return;

    try {
      setIsDeleting(true);
      await deleteReturnReason(deletingReason.id);
      setIsDeleteOpen(false);
      setDeletingReason(null);
      fetchReasons();
    } catch (err) {
      console.error("Failed to delete return reason:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle seed
  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      await seedReturnReasons();
      fetchReasons();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSeeding(false);
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
            <BreadcrumbPage>Return Reasons</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Return Reasons Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Return Reasons
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
            <CardDescription>Manage reasons for returned items</CardDescription>
          </div>
          <div className="flex gap-2">
            {reasons.length === 0 && !isLoading && (
              <Button variant="outline" onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Seed Defaults
                  </>
                )}
              </Button>
            )}
            <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Reason
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchReasons} className="ml-auto">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reasons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No return reasons found. Click &quot;Seed Defaults&quot; to add standard reasons.
                      </TableCell>
                    </TableRow>
                  ) : (
                    reasons.map((reason) => (
                      <TableRow key={reason.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Undo2 className="h-4 w-4 text-muted-foreground" />
                            {reason.label}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {reason.value}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {reason.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{reason.display_order}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {reason.is_active ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {reason.requires_note && (
                              <Badge variant="outline" className="text-xs">Note Required</Badge>
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
                              <DropdownMenuItem onClick={() => openEditDialog(reason)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Reason
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteConfirm(reason)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Reason
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {reasons.length} return reason{reasons.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
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
              <Undo2 className="h-5 w-5" />
              Create Return Reason
            </DialogTitle>
            <DialogDescription>
              Add a new reason that customers can select when returning items.
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
              <Label htmlFor="create-label">Label *</Label>
              <Input
                id="create-label"
                placeholder="e.g., Wrong Item"
                value={createLabel}
                onChange={(e) => setCreateLabel(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-value">Value *</Label>
              <Input
                id="create-value"
                placeholder="e.g., wrong_item"
                value={createValue}
                onChange={(e) => setCreateValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Machine-readable identifier (will be converted to snake_case)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Customer received the wrong item"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-order">Display Order</Label>
              <Input
                id="create-order"
                type="number"
                placeholder="0"
                value={createDisplayOrder}
                onChange={(e) => setCreateDisplayOrder(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="create-active" className="font-medium">
                  Active
                </Label>
                <span className="text-xs text-muted-foreground">
                  Show this reason to customers
                </span>
              </div>
              <Switch
                id="create-active"
                checked={createIsActive}
                onCheckedChange={setCreateIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="create-requires-note" className="font-medium">
                  Requires Note
                </Label>
                <span className="text-xs text-muted-foreground">
                  Customer must provide additional details
                </span>
              </div>
              <Switch
                id="create-requires-note"
                checked={createRequiresNote}
                onCheckedChange={setCreateRequiresNote}
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
                "Create Reason"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Return Reason
            </DialogTitle>
            <DialogDescription>Update return reason details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-label">Label *</Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-order">Display Order</Label>
              <Input
                id="edit-order"
                type="number"
                value={editDisplayOrder}
                onChange={(e) => setEditDisplayOrder(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-active" className="font-medium">
                  Active
                </Label>
                <span className="text-xs text-muted-foreground">
                  Show this reason to customers
                </span>
              </div>
              <Switch
                id="edit-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-requires-note" className="font-medium">
                  Requires Note
                </Label>
                <span className="text-xs text-muted-foreground">
                  Customer must provide additional details
                </span>
              </div>
              <Switch
                id="edit-requires-note"
                checked={editRequiresNote}
                onCheckedChange={setEditRequiresNote}
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
              Delete Return Reason
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingReason?.label}</strong>? This action
              cannot be undone. Returns that used this reason will retain their original data.
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
                "Delete Reason"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
