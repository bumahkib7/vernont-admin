"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MoreHorizontal,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  MessageSquareText,
  Hash,
  BarChart3,
} from "lucide-react";
import {
  getCannedResponses,
  createCannedResponse,
  updateCannedResponse,
  deleteCannedResponse,
  ApiError,
  type CannedResponse,
  type CreateCannedResponseInput,
  type UpdateCannedResponseInput,
} from "@/lib/api";

const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "ORDER", label: "Order" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "RETURN", label: "Return" },
  { value: "REFUND", label: "Refund" },
  { value: "PRODUCT", label: "Product" },
  { value: "BILLING", label: "Billing" },
  { value: "ACCOUNT", label: "Account" },
  { value: "TECHNICAL", label: "Technical" },
];

export default function CannedResponsesPage() {
  const queryClient = useQueryClient();

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Create dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createBody, setCreateBody] = useState("");
  const [createCategory, setCreateCategory] = useState("GENERAL");
  const [createShortcut, setCreateShortcut] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editCategory, setEditCategory] = useState("GENERAL");
  const [editShortcut, setEditShortcut] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingResponse, setDeletingResponse] = useState<CannedResponse | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "An unexpected error occurred";
  };

  // Fetch canned responses
  const responsesQuery = useQuery({
    queryKey: ["canned-responses"],
    queryFn: async () => {
      const response = await getCannedResponses();
      return response.items || [];
    },
    staleTime: 30_000,
  });

  const allResponses = responsesQuery.data ?? [];
  const isLoading = responsesQuery.isLoading;
  const error = responsesQuery.error ? getErrorMessage(responsesQuery.error) : null;

  // Filter and sort responses
  const filteredResponses = useMemo(() => {
    let results = allResponses;

    if (filterCategory !== "ALL") {
      results = results.filter((r) => r.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q) ||
          (r.shortcut && r.shortcut.toLowerCase().includes(q))
      );
    }

    // Sort by usage count descending (most used first)
    return [...results].sort((a, b) => b.usageCount - a.usageCount);
  }, [allResponses, filterCategory, searchQuery]);

  const invalidateResponses = () => {
    queryClient.invalidateQueries({ queryKey: ["canned-responses"] });
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCannedResponseInput) => createCannedResponse(data),
    onSuccess: () => {
      setIsCreateOpen(false);
      resetCreateForm();
      invalidateResponses();
    },
    onError: (err) => {
      setCreateError(getErrorMessage(err));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCannedResponseInput }) =>
      updateCannedResponse(id, data),
    onSuccess: () => {
      setIsEditOpen(false);
      setEditingResponse(null);
      invalidateResponses();
    },
    onError: (err) => {
      setEditError(getErrorMessage(err));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCannedResponse(id),
    onSuccess: () => {
      setIsDeleteOpen(false);
      setDeletingResponse(null);
      invalidateResponses();
    },
    onError: (err) => {
      console.error("Failed to delete canned response:", err);
    },
  });

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // Handle create
  const handleCreate = () => {
    if (!createTitle.trim() || !createBody.trim()) {
      setCreateError("Title and body are required");
      return;
    }

    setCreateError(null);
    createMutation.mutate({
      title: createTitle.trim(),
      body: createBody,
      category: createCategory,
      shortcut: createShortcut.trim() || undefined,
    });
  };

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateBody("");
    setCreateCategory("GENERAL");
    setCreateShortcut("");
    setCreateError(null);
  };

  // Handle edit
  const openEditDialog = (response: CannedResponse) => {
    setEditingResponse(response);
    setEditTitle(response.title);
    setEditBody(response.body);
    setEditCategory(response.category);
    setEditShortcut(response.shortcut || "");
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingResponse || !editTitle.trim() || !editBody.trim()) {
      setEditError("Title and body are required");
      return;
    }

    setEditError(null);
    updateMutation.mutate({
      id: editingResponse.id,
      data: {
        title: editTitle.trim(),
        body: editBody,
        category: editCategory,
        shortcut: editShortcut.trim() || undefined,
      },
    });
  };

  // Handle delete
  const openDeleteConfirm = (response: CannedResponse) => {
    setDeletingResponse(response);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingResponse) return;
    deleteMutation.mutate(deletingResponse.id);
  };

  const getCategoryLabel = (value: string) =>
    CATEGORIES.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/support">Customer Support</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Canned Responses</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Canned Responses Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              Canned Responses
            </CardTitle>
            <CardDescription>
              Pre-written responses for common support scenarios
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Response
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search responses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => responsesQuery.refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {allResponses.length === 0
                ? "No canned responses yet. Create your first response to get started."
                : "No responses match your filters."}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResponses.map((response) => (
                  <Card key={response.id} className="relative group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-snug line-clamp-2">
                          {response.title}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(response)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteConfirm(response)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {response.body}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{getCategoryLabel(response.category)}</Badge>
                        {response.shortcut && (
                          <Badge variant="outline" className="gap-1 font-mono text-xs">
                            <Hash className="h-3 w-3" />
                            {response.shortcut}
                          </Badge>
                        )}
                        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <BarChart3 className="h-3 w-3" />
                          {response.usageCount} uses
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                {filteredResponses.length} response{filteredResponses.length === 1 ? "" : "s"}
                {filterCategory !== "ALL" || searchQuery
                  ? ` (${allResponses.length} total)`
                  : ""}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5" />
              Create Canned Response
            </DialogTitle>
            <DialogDescription>
              Create a reusable response template for common support scenarios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-title">Title *</Label>
              <Input
                id="create-title"
                placeholder="e.g., Refund Confirmation"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-body">Body *</Label>
              <Textarea
                id="create-body"
                placeholder="Write the response template..."
                value={createBody}
                onChange={(e) => setCreateBody(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{customer_name}}"}, {"{{order_number}}"}, etc. for dynamic placeholders
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-category">Category *</Label>
                <Select value={createCategory} onValueChange={setCreateCategory}>
                  <SelectTrigger id="create-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="create-shortcut">Shortcut</Label>
                <Input
                  id="create-shortcut"
                  placeholder="e.g., /refund"
                  value={createShortcut}
                  onChange={(e) => setCreateShortcut(e.target.value)}
                />
              </div>
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
                "Create Response"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Canned Response
            </DialogTitle>
            <DialogDescription>
              Update the response template details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-body">Body *</Label>
              <Textarea
                id="edit-body"
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category *</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-shortcut">Shortcut</Label>
                <Input
                  id="edit-shortcut"
                  value={editShortcut}
                  onChange={(e) => setEditShortcut(e.target.value)}
                />
              </div>
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
              Delete Canned Response
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deletingResponse?.title}</strong>? This action cannot be
              undone.
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
                "Delete Response"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
