"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  Eye,
  Copy,
  Archive,
  Package,
  DollarSign,
  Tag,
  Layers,
  ImageIcon,
  AlertCircle,
  Loader2,
  X,
  Check,
  Star,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  createVariant,
  updateVariant,
  deleteVariant,
  addOption,
  updateOption,
  deleteOption,
  uploadProductImage,
  addProductImage,
  deleteProductImage,
  reorderProductImages,
  setProductThumbnail,
  type Product,
  type ProductVariant,
  type ProductStatus,
  type ProductCategory,
  type UpdateProductInput,
  type CreateVariantInput,
  type UpdateVariantInput,
  type CreateOptionInput,
  type UpdateOptionInput,
} from "@/lib/api";
import { useRef } from "react";
import { FragranceMetadataEditor, type FragranceMetadata } from "@/components/products/FragranceMetadataEditor";

function getStatusBadge(status: ProductStatus) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    case "proposed":
      return <Badge className="bg-yellow-100 text-yellow-800">Proposed</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag and drop state for images
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Variant modal state
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);

  // New variant form state
  const [variantForm, setVariantForm] = useState({
    title: "",
    sku: "",
    barcode: "",
    price: "",
    compareAtPrice: "",
    currencyCode: "GBP",
    manageInventory: true,
    allowBackorder: false,
    weight: "",
  });

  // Option modal state
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [showEditOptionModal, setShowEditOptionModal] = useState(false);
  const [editingOption, setEditingOption] = useState<{ id: string; title: string; values: string[] } | null>(null);
  const [optionSaving, setOptionSaving] = useState(false);
  const [optionError, setOptionError] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState({
    title: "",
    values: "",
  });

  // Form state - all editable fields
  const [formData, setFormData] = useState({
    title: "",
    handle: "",
    subtitle: "",
    description: "",
    status: "draft" as ProductStatus,
    material: "",
    weight: "",
    originCountry: "",
    tags: [] as string[],
    categoryId: "",
  });

  // Fragrance metadata state
  const [fragranceMetadata, setFragranceMetadata] = useState<FragranceMetadata>({});

  // New tag input
  const [newTag, setNewTag] = useState("");

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProduct(productId);
      setProduct(data);
      setFormData({
        title: data.title || "",
        handle: data.handle || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        status: data.status,
        material: data.material || "",
        weight: data.weight || "",
        originCountry: data.originCountry || "",
        tags: data.tags || [],
        categoryId: data.categories?.[0] || "",
      });
      // Load fragrance metadata from product.metadata.fragrance
      const metadata = data.metadata as Record<string, unknown> | undefined;
      if (metadata?.fragrance) {
        setFragranceMetadata(metadata.fragrance as FragranceMetadata);
      } else {
        setFragranceMetadata({});
      }
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories({ limit: 100 });
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateFragranceMetadata = (metadata: FragranceMetadata) => {
    setFragranceMetadata(metadata);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Build metadata with fragrance data
      const existingMetadata = (product.metadata as Record<string, unknown>) || {};
      const hasFragranceData = Object.keys(fragranceMetadata).some(
        (key) => fragranceMetadata[key as keyof FragranceMetadata] !== undefined
      );

      const updateData: UpdateProductInput = {
        title: formData.title,
        handle: formData.handle,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        status: formData.status,
        material: formData.material || undefined,
        originCountry: formData.originCountry || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        categories: formData.categoryId ? [formData.categoryId] : undefined,
        metadata: hasFragranceData
          ? { ...existingMetadata, fragrance: fragranceMetadata }
          : existingMetadata,
      };

      await updateProduct(product.id, updateData);
      setSuccess("Product saved successfully");
      setHasChanges(false);
      await fetchProduct(); // Refresh data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(product.id);
      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateField("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateField("tags", formData.tags.filter((t) => t !== tagToRemove));
  };

  // Variant handlers
  const resetVariantForm = () => {
    setVariantForm({
      title: "",
      sku: "",
      barcode: "",
      price: "",
      compareAtPrice: "",
      currencyCode: "GBP",
      manageInventory: true,
      allowBackorder: false,
      weight: "",
    });
    setVariantError(null);
  };

  const openAddVariantModal = () => {
    resetVariantForm();
    setShowAddVariantModal(true);
  };

  const openEditVariantModal = (variant: ProductVariant) => {
    setEditingVariant(variant);
    const mainPrice = variant.prices[0];
    setVariantForm({
      title: variant.title,
      sku: variant.sku || "",
      barcode: variant.barcode || "",
      price: mainPrice?.amount?.toString() || "",
      compareAtPrice: mainPrice?.compareAtPrice?.toString() || "",
      currencyCode: mainPrice?.currencyCode || "GBP",
      manageInventory: variant.manageInventory,
      allowBackorder: variant.allowBackorder,
      weight: variant.weight || "",
    });
    setVariantError(null);
    setShowEditVariantModal(true);
  };

  const handleAddVariant = async () => {
    if (!product || !variantForm.title.trim()) {
      setVariantError("Title is required");
      return;
    }
    setVariantSaving(true);
    setVariantError(null);

    try {
      const input: CreateVariantInput = {
        title: variantForm.title.trim(),
        sku: variantForm.sku || undefined,
        barcode: variantForm.barcode || undefined,
        manageInventory: variantForm.manageInventory,
        allowBackorder: variantForm.allowBackorder,
        weight: variantForm.weight || undefined,
        prices: variantForm.price
          ? [
              {
                currencyCode: variantForm.currencyCode,
                amount: parseFloat(variantForm.price),
                compareAtPrice: variantForm.compareAtPrice
                  ? parseFloat(variantForm.compareAtPrice)
                  : undefined,
              },
            ]
          : undefined,
      };

      await createVariant(product.id, input);
      setShowAddVariantModal(false);
      resetVariantForm();
      setSuccess("Variant added successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : "Failed to add variant");
    } finally {
      setVariantSaving(false);
    }
  };

  const handleUpdateVariant = async () => {
    if (!editingVariant || !variantForm.title.trim()) {
      setVariantError("Title is required");
      return;
    }
    setVariantSaving(true);
    setVariantError(null);

    try {
      const input: UpdateVariantInput = {
        title: variantForm.title.trim(),
        sku: variantForm.sku || undefined,
        barcode: variantForm.barcode || undefined,
        manageInventory: variantForm.manageInventory,
        allowBackorder: variantForm.allowBackorder,
        weight: variantForm.weight || undefined,
        prices: [
          {
            currencyCode: variantForm.currencyCode,
            amount: parseFloat(variantForm.price) || 0,
            compareAtPrice: variantForm.compareAtPrice
              ? parseFloat(variantForm.compareAtPrice)
              : undefined,
          },
        ],
      };

      await updateVariant(editingVariant.id, input);
      setShowEditVariantModal(false);
      setEditingVariant(null);
      resetVariantForm();
      setSuccess("Variant updated successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : "Failed to update variant");
    } finally {
      setVariantSaving(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) return;

    try {
      await deleteVariant(variantId);
      setSuccess("Variant deleted successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete variant");
    }
  };

  // Option handlers
  const resetOptionForm = () => {
    setOptionForm({ title: "", values: "" });
    setOptionError(null);
  };

  const openAddOptionModal = () => {
    resetOptionForm();
    setShowAddOptionModal(true);
  };

  const openEditOptionModal = (option: { id: string; title: string; values: string[] }) => {
    setEditingOption(option);
    setOptionForm({
      title: option.title,
      values: option.values.join(", "),
    });
    setOptionError(null);
    setShowEditOptionModal(true);
  };

  const handleAddOption = async () => {
    if (!product || !optionForm.title.trim()) {
      setOptionError("Title is required");
      return;
    }
    if (!optionForm.values.trim()) {
      setOptionError("At least one value is required");
      return;
    }
    setOptionSaving(true);
    setOptionError(null);

    try {
      const values = optionForm.values.split(",").map((v) => v.trim()).filter(Boolean);
      const input: CreateOptionInput = {
        title: optionForm.title.trim(),
        values,
      };

      await addOption(product.id, input);
      setShowAddOptionModal(false);
      resetOptionForm();
      setSuccess("Option added successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setOptionError(err instanceof Error ? err.message : "Failed to add option");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleUpdateOption = async () => {
    if (!product || !editingOption || !optionForm.title.trim()) {
      setOptionError("Title is required");
      return;
    }
    setOptionSaving(true);
    setOptionError(null);

    try {
      const values = optionForm.values.split(",").map((v) => v.trim()).filter(Boolean);
      const input: UpdateOptionInput = {
        title: optionForm.title.trim(),
        values: values.length > 0 ? values : undefined,
      };

      await updateOption(product.id, editingOption.id, input);
      setShowEditOptionModal(false);
      setEditingOption(null);
      resetOptionForm();
      setSuccess("Option updated successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setOptionError(err instanceof Error ? err.message : "Failed to update option");
    } finally {
      setOptionSaving(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!product || !confirm("Are you sure you want to delete this option?")) return;

    try {
      await deleteOption(product.id, optionId);
      setSuccess("Option deleted successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete option");
    }
  };

  // Image handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 25MB for high-resolution images)
    if (file.size > 25 * 1024 * 1024) {
      setError("Image must be less than 25MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Upload to storage (MinIO/S3) - backend saves to product if productId provided
      const uploadResult = await uploadProductImage(file, product.id);

      // Only add image separately if backend didn't save it to product
      if (!uploadResult.savedToProduct) {
        await addProductImage(product.id, {
          url: uploadResult.url,
          position: product.images.length,
        });
      }

      setSuccess("Image uploaded successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!product || !confirm("Are you sure you want to delete this image?")) return;

    try {
      await deleteProductImage(product.id, imageId);
      setSuccess("Image deleted successfully");
      setSelectedImage(0); // Reset to first image
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || !product || draggedImageIndex === dropIndex) {
      setDraggedImageIndex(null);
      return;
    }

    setReordering(true);
    try {
      // Create new order by moving dragged item to drop position
      const newImages = [...product.images];
      const [draggedImage] = newImages.splice(draggedImageIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);

      // Send new order to backend
      const imageIds = newImages.map((img) => img.id);
      await reorderProductImages(product.id, imageIds);
      setSuccess("Images reordered successfully");
      await fetchProduct();
      setSelectedImage(0); // Reset to first image (new thumbnail)
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder images");
    } finally {
      setDraggedImageIndex(null);
      setReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
  };

  // Set image as thumbnail
  const handleSetThumbnail = async (imageId: string) => {
    if (!product) return;

    setReordering(true);
    try {
      await setProductThumbnail(product.id, imageId);
      setSuccess("Thumbnail updated successfully");
      await fetchProduct();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set thumbnail");
    } finally {
      setReordering(false);
    }
  };

  // Get first variant price for display
  const getMainPrice = () => {
    if (!product?.variants?.[0]?.prices?.[0]) return null;
    return product.variants[0].prices[0];
  };

  // Get image URL - handle both absolute and relative URLs
  const getImageUrl = (url: string | undefined) => {
    if (!url) return null;
    // If it's already an absolute URL, use it directly
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If it's a relative URL, prepend the API base
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load product</h2>
        <p className="text-muted-foreground">{error}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/products")}>
            Back to Products
          </Button>
          <Button onClick={fetchProduct}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const mainPrice = getMainPrice();
  const thumbnailUrl = getImageUrl(product.thumbnail) || getImageUrl(product.images[0]?.url);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{product.title}</h1>
              {getStatusBadge(product.status)}
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.id.slice(0, 8)} · Last updated {new Date(product.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive Product
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
          <Check className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Name</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input
                    id="handle"
                    value={formData.handle}
                    onChange={(e) => updateField("handle", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="Optional short description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={product.brandName || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Brand is set at product creation</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => updateField("categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => updateField("material", e.target.value)}
                    placeholder="e.g., Leather, Cotton"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media
              </CardTitle>
              <CardDescription>
                Drag and drop to reorder images. First image is the thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Main Image */}
                {thumbnailUrl ? (
                  <div className="relative aspect-square max-w-md overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        product.images[selectedImage]
                          ? getImageUrl(product.images[selectedImage].url) || ""
                          : thumbnailUrl
                      }
                      alt={product.images[selectedImage]?.altText || product.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder on error
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square max-w-md items-center justify-center rounded-lg border bg-muted">
                    <div className="text-center">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No images</p>
                    </div>
                  </div>
                )}
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                {/* Thumbnails - Drag to reorder */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => {
                    const imgUrl = getImageUrl(image.url);
                    const isThumbnail = product.thumbnail === image.url;
                    const isDragging = draggedImageIndex === index;
                    return (
                      <div
                        key={image.id}
                        draggable={!reordering}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`group relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 cursor-grab active:cursor-grabbing transition-all ${
                          selectedImage === index ? "border-primary" : "border-transparent"
                        } ${isDragging ? "opacity-50 scale-95" : ""} ${reordering ? "pointer-events-none" : ""}`}
                      >
                        {/* Drag handle indicator */}
                        <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <GripVertical className="h-3 w-3 text-white" />
                        </div>
                        {/* Thumbnail badge */}
                        {isThumbnail && (
                          <div className="absolute top-1 left-1 z-10">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                        <button
                          onClick={() => setSelectedImage(index)}
                          className="h-full w-full"
                        >
                          {imgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imgUrl}
                              alt={image.altText || `Image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </button>
                        {/* Action buttons overlay */}
                        <div className="absolute bottom-1 left-1 right-1 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {/* Set as thumbnail button */}
                          {!isThumbnail && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetThumbnail(image.id);
                              }}
                              disabled={reordering}
                              className="h-5 w-5 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 disabled:opacity-50"
                              title="Set as thumbnail"
                            >
                              <Star className="h-3 w-3" />
                            </button>
                          )}
                          {isThumbnail && <div />}
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(image.id);
                            }}
                            disabled={reordering}
                            className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
                            title="Delete image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || reordering}
                    className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed hover:border-primary hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImage || reordering ? (
                      <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
              <CardDescription>
                Prices are managed per variant. Edit variants to change pricing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      value={mainPrice?.amount || 0}
                      className="pl-7 bg-muted"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Compare at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      value={mainPrice?.compareAtPrice || ""}
                      className="pl-7 bg-muted"
                      disabled
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={mainPrice?.currencyCode || "GBP"} disabled className="bg-muted" />
                </div>
              </div>
              {mainPrice && mainPrice.compareAtPrice && mainPrice.compareAtPrice > mainPrice.amount && (
                <div className="mt-4 rounded-lg bg-green-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-green-600">
                      £{(mainPrice.compareAtPrice - mainPrice.amount).toFixed(2)} ({Math.round(((mainPrice.compareAtPrice - mainPrice.amount) / mainPrice.compareAtPrice) * 100)}% off)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Variants
                </CardTitle>
                <CardDescription>
                  Manage product options and variants
                </CardDescription>
              </div>
              <Button size="sm" onClick={openAddVariantModal}>
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="variants">
                <TabsList>
                  <TabsTrigger value="variants">Variants ({product.variants.length})</TabsTrigger>
                  <TabsTrigger value="options">Options ({product.options.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="variants" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Inventory</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{variant.title}</TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm">
                            {variant.sku || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {variant.prices[0] ? `£${variant.prices[0].amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={variant.manageInventory ? "secondary" : "outline"}>
                              {variant.manageInventory ? "Tracked" : "Not tracked"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditVariantModal(variant)}>
                                  Edit Variant
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteVariant(variant.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {product.variants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No variants defined
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="options" className="mt-4 space-y-4">
                  {product.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-medium">{option.title}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {option.values.map((value) => (
                            <Badge key={value} variant="outline">{value}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditOptionModal(option)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {product.options.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No options defined
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={openAddOptionModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Fragrance Details */}
          <FragranceMetadataEditor
            value={fragranceMetadata}
            onChange={updateFragranceMetadata}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField("status", value as ProductStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.categoryId ? (
                    <Badge variant="secondary">
                      {categories.find((c) => c.id === formData.categoryId)?.name || formData.categoryId}
                    </Badge>
                  ) : product.categories.length > 0 ? (
                    product.categories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {categories.find((c) => c.id === category)?.name || category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories</span>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="pr-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" value={product.brandName || ""} disabled className="bg-muted" />
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={product.variants[0]?.sku || ""}
                    disabled
                    className="bg-muted font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Barcode</Label>
                  <Input
                    value={product.variants[0]?.barcode || ""}
                    disabled
                    className="bg-muted font-mono text-sm"
                  />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Variants</span>
                  <span className="font-medium">
                    {product.variants.length} variant{product.variants.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => updateField("weight", e.target.value)}
                    placeholder="e.g., 0.5 kg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originCountry">Origin Country</Label>
                  <Input
                    id="originCountry"
                    value={formData.originCountry}
                    onChange={(e) => updateField("originCountry", e.target.value)}
                    placeholder="e.g., GB"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Variant Modal */}
      <Dialog open={showAddVariantModal} onOpenChange={setShowAddVariantModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Variant</DialogTitle>
            <DialogDescription>
              Add a new variant to this product with pricing and inventory settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {variantError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {variantError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="variant-title">Title *</Label>
              <Input
                id="variant-title"
                value={variantForm.title}
                onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                placeholder="e.g., Small / Black"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="variant-sku">SKU</Label>
                <Input
                  id="variant-sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-barcode">Barcode</Label>
                <Input
                  id="variant-barcode"
                  value={variantForm.barcode}
                  onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="variant-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="variant-price"
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-compare">Compare at</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="variant-compare"
                    type="number"
                    step="0.01"
                    value={variantForm.compareAtPrice}
                    onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="variant-currency">Currency</Label>
                <Select
                  value={variantForm.currencyCode}
                  onValueChange={(value) => setVariantForm({ ...variantForm, currencyCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="variant-weight">Weight</Label>
              <Input
                id="variant-weight"
                value={variantForm.weight}
                onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                placeholder="e.g., 0.5 kg"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.manageInventory}
                  onChange={(e) => setVariantForm({ ...variantForm, manageInventory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Track inventory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.allowBackorder}
                  onChange={(e) => setVariantForm({ ...variantForm, allowBackorder: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow backorder</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddVariantModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVariant} disabled={variantSaving}>
              {variantSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Modal */}
      <Dialog open={showEditVariantModal} onOpenChange={setShowEditVariantModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <DialogDescription>
              Update variant details and pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {variantError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {variantError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-variant-title">Title *</Label>
              <Input
                id="edit-variant-title"
                value={variantForm.title}
                onChange={(e) => setVariantForm({ ...variantForm, title: e.target.value })}
                placeholder="e.g., Small / Black"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-variant-sku">SKU</Label>
                <Input
                  id="edit-variant-sku"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-barcode">Barcode</Label>
                <Input
                  id="edit-variant-barcode"
                  value={variantForm.barcode}
                  onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-variant-price">Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="edit-variant-price"
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-compare">Compare at</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="edit-variant-compare"
                    type="number"
                    step="0.01"
                    value={variantForm.compareAtPrice}
                    onChange={(e) => setVariantForm({ ...variantForm, compareAtPrice: e.target.value })}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-variant-currency">Currency</Label>
                <Select
                  value={variantForm.currencyCode}
                  onValueChange={(value) => setVariantForm({ ...variantForm, currencyCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="edit-variant-weight">Weight</Label>
              <Input
                id="edit-variant-weight"
                value={variantForm.weight}
                onChange={(e) => setVariantForm({ ...variantForm, weight: e.target.value })}
                placeholder="e.g., 0.5 kg"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.manageInventory}
                  onChange={(e) => setVariantForm({ ...variantForm, manageInventory: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Track inventory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={variantForm.allowBackorder}
                  onChange={(e) => setVariantForm({ ...variantForm, allowBackorder: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Allow backorder</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditVariantModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateVariant} disabled={variantSaving}>
              {variantSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Option Modal */}
      <Dialog open={showAddOptionModal} onOpenChange={setShowAddOptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Option</DialogTitle>
            <DialogDescription>
              Add a new option like Size, Color, or Material.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {optionError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {optionError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="option-title">Option Name *</Label>
              <Input
                id="option-title"
                value={optionForm.title}
                onChange={(e) => setOptionForm({ ...optionForm, title: e.target.value })}
                placeholder="e.g., Size, Color, Material"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option-values">Values *</Label>
              <Input
                id="option-values"
                value={optionForm.values}
                onChange={(e) => setOptionForm({ ...optionForm, values: e.target.value })}
                placeholder="e.g., Small, Medium, Large (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Enter values separated by commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOptionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOption} disabled={optionSaving}>
              {optionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Option Modal */}
      <Dialog open={showEditOptionModal} onOpenChange={setShowEditOptionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Option</DialogTitle>
            <DialogDescription>
              Update option name and values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {optionError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {optionError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-option-title">Option Name *</Label>
              <Input
                id="edit-option-title"
                value={optionForm.title}
                onChange={(e) => setOptionForm({ ...optionForm, title: e.target.value })}
                placeholder="e.g., Size, Color, Material"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-option-values">Values</Label>
              <Input
                id="edit-option-values"
                value={optionForm.values}
                onChange={(e) => setOptionForm({ ...optionForm, values: e.target.value })}
                placeholder="e.g., Small, Medium, Large (comma-separated)"
              />
              <p className="text-xs text-muted-foreground">
                Enter values separated by commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditOptionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOption} disabled={optionSaving}>
              {optionSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
