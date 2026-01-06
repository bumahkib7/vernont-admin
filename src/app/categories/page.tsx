"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Eye,
  EyeOff,
  Package,
  Layers,
  Loader2,
  AlertCircle,
  Check,
  GripVertical,
  Move,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  activateCategory,
  deactivateCategory,
  getCategoryProducts,
  moveProductToCategory,
  type ProductCategory,
  type CreateCategoryInput,
  type CategoryProductItem,
} from "@/lib/api";

type CategoryWithChildren = ProductCategory & {
  children: CategoryWithChildren[];
  loadedProducts?: CategoryProductItem[];
};

type CategoryFormData = {
  name: string;
  handle: string;
  description: string;
  parent_category_id: string;
};

const initialFormData: CategoryFormData = {
  name: "",
  handle: "",
  description: "",
  parent_category_id: "",
};

function buildCategoryTree(categories: ProductCategory[]): CategoryWithChildren[] {
  const categoryMap = new Map<string, CategoryWithChildren>();
  const rootCategories: CategoryWithChildren[] = [];

  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const categoryWithChildren = categoryMap.get(cat.id)!;
    if (cat.parent_category_id && categoryMap.has(cat.parent_category_id)) {
      const parent = categoryMap.get(cat.parent_category_id)!;
      parent.children.push(categoryWithChildren);
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  const sortByPosition = (a: CategoryWithChildren, b: CategoryWithChildren) =>
    a.position - b.position;

  rootCategories.sort(sortByPosition);
  const sortRecursively = (cats: CategoryWithChildren[]) => {
    cats.sort(sortByPosition);
    cats.forEach((cat) => sortRecursively(cat.children));
  };
  sortRecursively(rootCategories);

  return rootCategories;
}

// Draggable category row component
function DraggableCategoryRow({
  category,
  level = 0,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
  onAddSubcategory,
  dragOverId,
}: {
  category: CategoryWithChildren;
  level?: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  onToggleActive: (category: ProductCategory) => void;
  onAddSubcategory: (parentId: string) => void;
  dragOverId: string | null;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expanded.has(category.id);
  const isDragOver = dragOverId === category.id;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `category-${category.id}`,
    data: { type: "category", category },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-category-${category.id}`,
    data: { type: "category", category },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <>
      <TableRow
        ref={(node) => {
          setDragRef(node);
          setDropRef(node);
        }}
        className={`group transition-colors ${
          isDragging ? "opacity-50" : ""
        } ${isOver || isDragOver ? "bg-blue-50 border-blue-300" : ""}`}
        style={style}
      >
        <TableCell>
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${level * 24}px` }}
          >
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            {hasChildren ? (
              <button
                onClick={() => onToggle(category.id)}
                className="flex items-center justify-center p-1 rounded hover:bg-muted"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            {category.image && level === 0 ? (
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                {hasChildren ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="font-medium">{category.name}</span>
              {category.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
            /{category.handle}
          </code>
        </TableCell>
        <TableCell className="text-center">{category.product_count}</TableCell>
        <TableCell>
          {category.is_active ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubcategory(category.id)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(category)}>
                {category.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {/* Show products when expanded */}
      {isExpanded && category.loadedProducts && category.loadedProducts.length > 0 && (
        category.loadedProducts.map((product) => (
          <DraggableProduct
            key={product.id}
            product={product}
            categoryId={category.id}
            level={level}
          />
        ))
      )}
      {hasChildren &&
        isExpanded &&
        category.children.map((child) => (
          <DraggableCategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleActive={onToggleActive}
            onAddSubcategory={onAddSubcategory}
            dragOverId={dragOverId}
          />
        ))}
    </>
  );
}

// Drag overlay component
function CategoryDragOverlay({ category }: { category: CategoryWithChildren }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white border rounded-lg shadow-lg">
      <Move className="h-4 w-4 text-muted-foreground" />
      <Folder className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium">{category.name}</span>
    </div>
  );
}

// Draggable product component
function DraggableProduct({
  product,
  categoryId,
  level,
}: {
  product: CategoryProductItem;
  categoryId: string;
  level: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `product-${product.id}`,
    data: { type: "product", product, categoryId },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <TableRow
      ref={setNodeRef}
      className={`${isDragging ? "opacity-50" : ""}`}
      style={style}
    >
      <TableCell>
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${(level + 1) * 24 + 8}px` }}
        >
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.title}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm">{product.title}</span>
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          /{product.handle}
        </code>
      </TableCell>
      <TableCell className="text-center">-</TableCell>
      <TableCell>
        <Badge
          variant={product.status === "PUBLISHED" ? "default" : "secondary"}
          className="text-xs"
        >
          {product.status.toLowerCase()}
        </Badge>
      </TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}

// Product drag overlay
function ProductDragOverlay({ product }: { product: CategoryProductItem }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white border rounded-lg shadow-lg">
      <Move className="h-4 w-4 text-muted-foreground" />
      <Package className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{product.title}</span>
    </div>
  );
}

// Root drop zone for making categories root-level
function RootDropZone({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: "drop-root",
    data: { type: "root" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50 text-blue-600"
          : "border-muted text-muted-foreground"
      }`}
    >
      <Move className="h-5 w-5 mx-auto mb-1" />
      <span className="text-sm">Drop here to make root category</span>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<ProductCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Drag state
  const [activeCategory, setActiveCategory] = useState<CategoryWithChildren | null>(null);
  const [activeProduct, setActiveProduct] = useState<{ product: CategoryProductItem; categoryId: string } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isOverRoot, setIsOverRoot] = useState(false);

  // Products state per category
  const [categoryProducts, setCategoryProducts] = useState<Record<string, CategoryProductItem[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategories({ limit: 500 });
      setCategories(response.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpanded = async (id: string) => {
    const isCurrentlyExpanded = expanded.has(id);

    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // Load products if expanding and not already loaded
    if (!isCurrentlyExpanded && !categoryProducts[id]) {
      try {
        const response = await getCategoryProducts(id, { limit: 50 });
        setCategoryProducts((prev) => ({
          ...prev,
          [id]: response.products,
        }));
      } catch (err) {
        console.error("Failed to load products for category", id, err);
      }
    }
  };

  const generateHandle = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleOpenAdd = (parentId?: string) => {
    setFormData({
      ...initialFormData,
      parent_category_id: parentId || "",
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (category: ProductCategory) => {
    setCategoryToEdit(category);
    setFormData({
      name: category.name,
      handle: category.handle,
      description: category.description || "",
      parent_category_id: category.parent_category_id || "",
    });
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditModalOpen(false);
    setCategoryToEdit(null);
    setFormData(initialFormData);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const data: CreateCategoryInput = {
        name: formData.name,
        handle: formData.handle || generateHandle(formData.name),
        description: formData.description || undefined,
        parent_category_id: formData.parent_category_id || undefined,
      };
      await createCategory(data);
      setSuccess("Category created successfully");
      handleCloseModal();
      await fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!categoryToEdit || !formData.name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      await updateCategory(categoryToEdit.id, {
        name: formData.name,
        handle: formData.handle || undefined,
        description: formData.description || undefined,
        parent_category_id: formData.parent_category_id || undefined,
      });
      setSuccess("Category updated successfully");
      handleCloseModal();
      await fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteCategory(categoryToDelete.id);
      setSuccess("Category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      await fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (category: ProductCategory) => {
    setError(null);

    try {
      if (category.is_active) {
        await deactivateCategory(category.id);
        setSuccess(`"${category.name}" deactivated`);
      } else {
        await activateCategory(category.id);
        setSuccess(`"${category.name}" activated`);
      }
      await fetchCategories();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const openDeleteDialog = (category: ProductCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "category") {
      setActiveCategory(active.data.current.category);
      setActiveProduct(null);
    } else if (active.data.current?.type === "product") {
      setActiveProduct({
        product: active.data.current.product,
        categoryId: active.data.current.categoryId,
      });
      setActiveCategory(null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      if (over.id === "drop-root") {
        setIsOverRoot(true);
        setDragOverId(null);
      } else if (over.data.current?.type === "category") {
        setIsOverRoot(false);
        setDragOverId(over.data.current.category.id);
      }
    } else {
      setIsOverRoot(false);
      setDragOverId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const wasProduct = activeProduct !== null;
    setActiveCategory(null);
    setActiveProduct(null);
    setDragOverId(null);
    setIsOverRoot(false);

    if (!over || !active.data.current) return;

    // Handle product drag
    if (active.data.current.type === "product") {
      const { product, categoryId: fromCategoryId } = active.data.current;

      // Can only drop products on categories
      if (over.data.current?.type === "category") {
        const targetCategory = over.data.current.category as CategoryWithChildren;

        // Don't move if already in target category
        if (fromCategoryId === targetCategory.id) return;

        try {
          await moveProductToCategory(targetCategory.id, product.id, fromCategoryId);
          setSuccess(`"${product.title}" moved to "${targetCategory.name}"`);

          // Update local state: remove from source, add to target
          setCategoryProducts((prev) => {
            const updated = { ...prev };
            // Remove from source
            if (updated[fromCategoryId]) {
              updated[fromCategoryId] = updated[fromCategoryId].filter(
                (p) => p.id !== product.id
              );
            }
            // Add to target if loaded
            if (updated[targetCategory.id]) {
              updated[targetCategory.id] = [...updated[targetCategory.id], product];
            }
            return updated;
          });

          // Expand target category to show the product
          setExpanded((prev) => new Set([...prev, targetCategory.id]));

          // Reload to get updated counts
          await fetchCategories();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to move product");
        }
      }
      return;
    }

    // Handle category drag
    const draggedCategory = active.data.current.category as CategoryWithChildren;

    // Dropping on root zone
    if (over.id === "drop-root") {
      if (draggedCategory.parent_category_id) {
        try {
          await updateCategory(draggedCategory.id, {
            parent_category_id: undefined,
          });
          setSuccess(`"${draggedCategory.name}" moved to root level`);
          await fetchCategories();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to move category");
        }
      }
      return;
    }

    // Dropping on another category
    if (over.data.current?.type === "category") {
      const targetCategory = over.data.current.category as CategoryWithChildren;

      // Don't drop on self
      if (draggedCategory.id === targetCategory.id) return;

      // Don't drop on own children (would create circular reference)
      const isDescendant = (
        parent: CategoryWithChildren,
        childId: string
      ): boolean => {
        if (parent.id === childId) return true;
        return parent.children.some((c) => isDescendant(c, childId));
      };
      if (isDescendant(draggedCategory, targetCategory.id)) return;

      // Don't move if already a child of target
      if (draggedCategory.parent_category_id === targetCategory.id) return;

      try {
        await updateCategory(draggedCategory.id, {
          parent_category_id: targetCategory.id,
        });
        setSuccess(`"${draggedCategory.name}" moved under "${targetCategory.name}"`);
        // Expand the target to show the moved category
        setExpanded((prev) => new Set([...prev, targetCategory.id]));
        await fetchCategories();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move category");
      }
    }
  };

  const handleDragCancel = () => {
    setActiveCategory(null);
    setActiveProduct(null);
    setDragOverId(null);
    setIsOverRoot(false);
  };

  // Build tree and filter, including loaded products
  const categoryTree = buildCategoryTree(categories).map((cat) => {
    const addProductsRecursively = (c: CategoryWithChildren): CategoryWithChildren => ({
      ...c,
      loadedProducts: categoryProducts[c.id] || [],
      children: c.children.map(addProductsRecursively),
    });
    return addProductsRecursively(cat);
  });

  const filterCategories = (
    cats: CategoryWithChildren[],
    query: string
  ): CategoryWithChildren[] => {
    if (!query) return cats;

    const lowerQuery = query.toLowerCase();
    return cats
      .map((cat) => ({
        ...cat,
        children: filterCategories(cat.children, query),
      }))
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(lowerQuery) ||
          cat.handle.toLowerCase().includes(lowerQuery) ||
          cat.children.length > 0
      );
  };

  const filteredCategories = filterCategories(categoryTree, searchQuery);

  // Get root categories for parent selection
  const rootCategories = categories.filter((c) => !c.parent_category_id);

  // Stats
  const totalProducts = categories.reduce((acc, cat) => acc + cat.product_count, 0);
  const activeCategories = categories.filter((c) => c.is_active).length;

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-64" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
              {categoryToDelete && categoryToDelete.subcategory_count > 0 && (
                <span className="block mt-2 text-red-600">
                  This category has {categoryToDelete.subcategory_count} subcategories
                  that will also be affected.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Modal */}
      <Dialog open={addModalOpen || editModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editModalOpen ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editModalOpen
                ? "Update category details"
                : "Add a new category to organize your products"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    handle: formData.handle || generateHandle(e.target.value),
                  });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle">Handle</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                  /categories/
                </span>
                <Input
                  id="handle"
                  placeholder="category-handle"
                  className="rounded-l-none"
                  value={formData.handle}
                  onChange={(e) =>
                    setFormData({ ...formData, handle: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Category description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parent_category_id}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    parent_category_id: value === "none" ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root category)</SelectItem>
                  {rootCategories
                    .filter((c) => c.id !== categoryToEdit?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={editModalOpen ? handleUpdate : handleCreate}
              disabled={!formData.name.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editModalOpen ? "Saving..." : "Creating..."}
                </>
              ) : editModalOpen ? (
                "Save Changes"
              ) : (
                "Create Category"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Drag categories to reorganize hierarchy
          </p>
        </div>
        <Button className="gap-2" onClick={() => handleOpenAdd()}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-2">
              <Folder className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Categories</p>
              <p className="text-2xl font-bold">{activeCategories}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
            <CardDescription>
              Drag and drop categories to reorganize. Drop on another category to
              make it a subcategory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Root drop zone */}
            {activeCategory && activeCategory.parent_category_id && (
              <RootDropZone isOver={isOverRoot} />
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Category</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <DraggableCategoryRow
                      key={category.id}
                      category={category}
                      expanded={expanded}
                      onToggle={toggleExpanded}
                      onEdit={handleOpenEdit}
                      onDelete={openDeleteDialog}
                      onToggleActive={handleToggleActive}
                      onAddSubcategory={handleOpenAdd}
                      dragOverId={dragOverId}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Folder className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchQuery ? "No categories found" : "No categories yet"}
                        </p>
                        {!searchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAdd()}
                          >
                            Create your first category
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Drag overlay */}
        <DragOverlay>
          {activeCategory ? (
            <CategoryDragOverlay category={activeCategory} />
          ) : activeProduct ? (
            <ProductDragOverlay product={activeProduct.product} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
