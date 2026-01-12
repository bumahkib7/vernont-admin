"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Store,
} from "lucide-react";
import { useSalesChannelsPage } from "@/hooks/use-sales-channels";
import { ApiError } from "@/lib/api";

export default function SalesChannelsSettingsPage() {
  const {
    // Data
    channels,
    totalCount,

    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,

    // Errors
    error,
    createError,
    updateError,

    // Actions
    refetch,
    createChannel,
    updateChannel,
    deleteChannel,

    // UI State
    searchQuery,
    setSearchQuery,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isEditModalOpen,
    editingChannel,
    openEditModal,
    closeEditModal,
    isDeleteModalOpen,
    deletingChannel,
    openDeleteModal,
    closeDeleteModal,
  } = useSalesChannelsPage();

  // Form state for create
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  // Form state for edit
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "An unexpected error occurred";
  };

  const resetCreateForm = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateIsActive(true);
  };

  const handleCreate = () => {
    if (!createName.trim()) return;
    createChannel({
      name: createName.trim(),
      description: createDescription.trim() || undefined,
      is_active: createIsActive,
    });
    resetCreateForm();
  };

  const handleOpenEdit = (channel: typeof editingChannel) => {
    if (!channel) return;
    setEditName(channel.name);
    setEditDescription(channel.description || "");
    setEditIsActive(channel.is_active);
    openEditModal(channel);
  };

  const handleUpdate = () => {
    if (!editingChannel || !editName.trim()) return;
    updateChannel(editingChannel.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      is_active: editIsActive,
    });
  };

  const handleDelete = () => {
    if (!deletingChannel) return;
    deleteChannel(deletingChannel.id);
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
            <BreadcrumbPage>Sales Channels</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Sales Channels Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Sales Channels
            </CardTitle>
            <CardDescription>
              Control which products are available in which channels
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Channel
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search channels..."
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
              <span>{getErrorMessage(error)}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
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
              {/* Channels Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No channels match your search" : "No sales channels found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    channels.map((channel) => (
                      <TableRow key={channel.id}>
                        <TableCell className="font-medium">{channel.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[300px] truncate">
                          {channel.description || "-"}
                        </TableCell>
                        <TableCell>
                          {channel.is_disabled ? (
                            <Badge variant="destructive">Disabled</Badge>
                          ) : channel.is_active ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(channel.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEdit(channel)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteModal(channel)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
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
                {channels.length} channel{channels.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Sales Channel Dialog */}
      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateModal();
            resetCreateForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Create Sales Channel
            </DialogTitle>
            <DialogDescription>
              Add a new sales channel to control product availability.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {getErrorMessage(createError)}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                placeholder="e.g., Mobile App"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                placeholder="Optional description for this channel"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="create-active">Active</Label>
                <p className="text-sm text-muted-foreground">Enable this channel immediately</p>
              </div>
              <Switch
                id="create-active"
                checked={createIsActive}
                onCheckedChange={setCreateIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !createName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sales Channel Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Sales Channel
            </DialogTitle>
            <DialogDescription>Update sales channel details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {updateError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {getErrorMessage(updateError)}
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="edit-active">Active</Label>
                <p className="text-sm text-muted-foreground">Enable or disable this channel</p>
              </div>
              <Switch id="edit-active" checked={editIsActive} onCheckedChange={setEditIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating || !editName.trim()}>
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
      <AlertDialog open={isDeleteModalOpen} onOpenChange={(open) => !open && closeDeleteModal()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Sales Channel
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingChannel?.name}</strong>? This action
              cannot be undone.
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
