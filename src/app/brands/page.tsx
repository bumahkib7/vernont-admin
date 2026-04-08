"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from "@/hooks/use-brands";
import type { Brand, BrandTier, CreateBrandInput, UpdateBrandInput } from "@/lib/api/brands";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function tierBadge(tier: BrandTier) {
  switch (tier) {
    case "LUXURY":
      return <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 hover:bg-amber-100">Luxury</Badge>;
    case "PREMIUM":
      return <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 hover:bg-blue-100">Premium</Badge>;
    case "STANDARD":
      return <Badge variant="secondary">Standard</Badge>;
  }
}

export default function BrandsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [deleteBrand, setDeleteBrand] = useState<Brand | null>(null);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(0);
      }, 300);
      setSearchTimeout(timeout);
    },
    [searchTimeout]
  );

  const { data, isLoading } = useBrands(page, 20, debouncedSearch || undefined);
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const brands = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  // --- Create ---
  const [createForm, setCreateForm] = useState<CreateBrandInput>({
    name: "",
    slug: "",
    tier: "STANDARD",
    active: true,
  });

  const handleCreateOpen = () => {
    setCreateForm({ name: "", slug: "", tier: "STANDARD", active: true });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug) {
      toast.error("Name and slug are required");
      return;
    }
    try {
      await createMutation.mutateAsync(createForm);
      toast.success("Brand created");
      setCreateOpen(false);
    } catch {
      toast.error("Failed to create brand");
    }
  };

  // --- Edit ---
  const [editForm, setEditForm] = useState<UpdateBrandInput>({});

  const handleEditOpen = (brand: Brand) => {
    setEditBrand(brand);
    setEditForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? "",
      logoUrl: brand.logoUrl ?? "",
      websiteUrl: brand.websiteUrl ?? "",
      tier: brand.tier,
      active: brand.active,
    });
  };

  const handleUpdate = async () => {
    if (!editBrand) return;
    try {
      await updateMutation.mutateAsync({ id: editBrand.id, input: editForm });
      toast.success("Brand updated");
      setEditBrand(null);
    } catch {
      toast.error("Failed to update brand");
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteBrand) return;
    try {
      await deleteMutation.mutateAsync(deleteBrand.id);
      toast.success("Brand deleted");
      setDeleteBrand(null);
    } catch {
      toast.error("Failed to delete brand");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground">
            Manage your product brands and their details
          </p>
        </div>
        <Button onClick={handleCreateOpen}>
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {debouncedSearch ? "No brands match your search" : "No brands yet. Create your first brand."}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((brand) => (
                    <TableRow key={brand.id}>
                      <TableCell className="font-medium">{brand.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {brand.slug}
                      </TableCell>
                      <TableCell>{tierBadge(brand.tier)}</TableCell>
                      <TableCell>
                        {brand.active ? (
                          <Badge className="bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 hover:bg-green-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.websiteUrl ? (
                          <a
                            href={brand.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
                          >
                            <Globe className="h-3 w-3" />
                            Visit
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOpen(brand)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteBrand(brand)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Brand</DialogTitle>
            <DialogDescription>Add a new brand to your catalogue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  }))
                }
                placeholder="e.g. Hugo Boss"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={createForm.slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. hugo-boss"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={createForm.description ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brand description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-tier">Tier</Label>
                <Select
                  value={createForm.tier}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, tier: v as BrandTier }))
                  }
                >
                  <SelectTrigger id="create-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LUXURY">Luxury</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-active">Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="create-active"
                    checked={createForm.active}
                    onCheckedChange={(checked) =>
                      setCreateForm((f) => ({ ...f, active: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {createForm.active ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-website">Website URL</Label>
              <Input
                id="create-website"
                value={createForm.websiteUrl ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                placeholder="https://www.hugoboss.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-logo">Logo URL</Label>
              <Input
                id="create-logo"
                value={createForm.logoUrl ?? ""}
                onChange={(e) => setCreateForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editBrand} onOpenChange={(open) => !open && setEditBrand(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Brand</DialogTitle>
            <DialogDescription>Update brand details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tier">Tier</Label>
                <Select
                  value={editForm.tier}
                  onValueChange={(v) =>
                    setEditForm((f) => ({ ...f, tier: v as BrandTier }))
                  }
                >
                  <SelectTrigger id="edit-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LUXURY">Luxury</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-active">Active</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="edit-active"
                    checked={editForm.active}
                    onCheckedChange={(checked) =>
                      setEditForm((f) => ({ ...f, active: checked }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {editForm.active ? "Visible" : "Hidden"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">Website URL</Label>
              <Input
                id="edit-website"
                value={editForm.websiteUrl ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-logo">Logo URL</Label>
              <Input
                id="edit-logo"
                value={editForm.logoUrl ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBrand(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBrand} onOpenChange={(open) => !open && setDeleteBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteBrand?.name}</strong>? Products
              using this brand will no longer have a brand assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
