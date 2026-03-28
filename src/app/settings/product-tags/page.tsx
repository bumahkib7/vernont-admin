"use client";

import { useEffect, useRef, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Check, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  getProductTags,
  createProductTag,
  updateProductTag,
  deleteProductTag,
  type ProductTag,
} from "@/lib/api";

export default function ProductTagsSettingsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Add tag dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTagValue, setNewTagValue] = useState("");

  // Inline edit
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTag, setDeleteTag] = useState<ProductTag | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch tags via React Query
  const tagsQuery = useQuery({
    queryKey: ["product-tags", debouncedQuery],
    queryFn: () => getProductTags(debouncedQuery || undefined),
    staleTime: 30_000,
  });

  const tags = tagsQuery.data?.product_tags ?? [];
  const count = tagsQuery.data?.count ?? 0;
  const loading = tagsQuery.isLoading;

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingTagId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTagId]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (value: string) => createProductTag(value),
    onSuccess: (_data, value) => {
      toast.success(`Tag "${value}" created`);
      setNewTagValue("");
      setAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["product-tags"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create tag");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => updateProductTag(id, value),
    onSuccess: () => {
      toast.success("Tag updated");
      setEditingTagId(null);
      setEditValue("");
      queryClient.invalidateQueries({ queryKey: ["product-tags"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update tag");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductTag(id),
    onSuccess: () => {
      toast.success(`Tag "${deleteTag?.value}" deleted`);
      setDeleteTag(null);
      queryClient.invalidateQueries({ queryKey: ["product-tags"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete tag");
    },
  });

  const creating = createMutation.isPending;
  const saving = updateMutation.isPending;
  const deleting = deleteMutation.isPending;

  const handleCreate = () => {
    const trimmed = newTagValue.trim();
    if (!trimmed) return;
    createMutation.mutate(trimmed);
  };

  const handleStartEdit = (tag: ProductTag) => {
    setEditingTagId(tag.id);
    setEditValue(tag.value);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditValue("");
  };

  const handleSaveEdit = () => {
    if (!editingTagId) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;
    updateMutation.mutate({ id: editingTagId, value: trimmed });
  };

  const handleDelete = () => {
    if (!deleteTag) return;
    deleteMutation.mutate(deleteTag.id);
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
            <BreadcrumbPage>Product Tags</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Product Tags Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Tags</CardTitle>
            <CardDescription>
              Manage tags for organizing products
              {!loading && ` (${count})`}
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Tag
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tags"
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {debouncedQuery
                ? `No tags matching "${debouncedQuery}"`
                : "No product tags yet. Click \"Add Tag\" to create one."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      {editingTagId === tag.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="h-8 w-48"
                            disabled={saving}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleSaveEdit}
                            disabled={saving || !editValue.trim()}
                          >
                            {saving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancelEdit}
                            disabled={saving}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">{tag.value}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tag.product_count} {tag.product_count === 1 ? "product" : "products"}
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
                          <DropdownMenuItem onClick={() => handleStartEdit(tag)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTag(tag)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Tag Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for organizing products.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g. new-arrival"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTagValue.trim()) handleCreate();
              }}
              disabled={creating}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newTagValue.trim()}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTag} onOpenChange={(open) => !open && setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{deleteTag?.value}&quot;?
              This will remove the tag from all associated products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
