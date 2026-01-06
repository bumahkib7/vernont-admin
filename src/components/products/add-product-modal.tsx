"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Upload,
  Info,
  Check,
  Circle,
  Plus,
  Trash2,
  GripVertical,
  ImageIcon,
  Loader2,
} from "lucide-react";
import {
  getCategories,
  getCollections,
  createProduct,
  type ProductCategory,
  type ProductCollection,
  type CreateProductInput,
} from "@/lib/api";

type Step = {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
};

type VariantPricing = {
  optionValues: Record<string, string>; // e.g., { "Size": "M", "Color": "Red" }
  price: string;
  sku: string;
  quantity: string;
};

type ProductFormData = {
  // Details
  title: string;
  subtitle: string;
  handle: string;
  description: string;
  hasVariants: boolean;
  // Media
  images: File[];
  // Organize
  category: string;
  collection: string;
  tags: string[];
  // Variants
  options: { name: string; values: string[] }[];
  variantPrices: VariantPricing[]; // Pricing for each variant combination
  // Pricing (for simple product)
  price: string;
  compareAtPrice: string;
  costPerItem: string;
  // Inventory
  sku: string;
  barcode: string;
  quantity: string;
  trackQuantity: boolean;
};

const initialFormData: ProductFormData = {
  title: "",
  subtitle: "",
  handle: "",
  description: "",
  hasVariants: false,
  images: [],
  category: "",
  collection: "",
  tags: [],
  options: [],
  variantPrices: [],
  price: "",
  compareAtPrice: "",
  costPerItem: "",
  sku: "",
  barcode: "",
  quantity: "",
  trackQuantity: true,
};

// Helper: Generate all variant combinations from options (cartesian product)
function generateVariantCombinations(
  options: { name: string; values: string[] }[]
): Record<string, string>[] {
  const validOptions = options.filter(o => o.name && o.values.some(v => v));
  if (validOptions.length === 0) return [];

  const cartesian = (arrays: string[][]): string[][] => {
    if (arrays.length === 0) return [[]];
    const [first, ...rest] = arrays;
    const restCombinations = cartesian(rest);
    return first.flatMap(val => restCombinations.map(combo => [val, ...combo]));
  };

  const optionNames = validOptions.map(o => o.name);
  const optionValues = validOptions.map(o => o.values.filter(v => v));
  const combinations = cartesian(optionValues);

  return combinations.map(combo => {
    const result: Record<string, string> = {};
    optionNames.forEach((name, idx) => {
      result[name] = combo[idx];
    });
    return result;
  });
}

// Helper: Get display name for variant (e.g., "M / Red")
function getVariantDisplayName(optionValues: Record<string, string>): string {
  return Object.values(optionValues).join(" / ");
}

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: ProductFormData, isDraft: boolean) => void;
};

export function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState<ProductFormData>(initialFormData);
  const [dragActive, setDragActive] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Backend data
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [collections, setCollections] = React.useState<ProductCollection[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch categories and collections on mount
  React.useEffect(() => {
    if (isOpen) {
      fetchBackendData();
    }
  }, [isOpen]);

  const fetchBackendData = async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [categoriesRes, collectionsRes] = await Promise.allSettled([
        getCategories({ limit: 100 }),
        getCollections({ limit: 100 }),
      ]);

      if (categoriesRes.status === "fulfilled") {
        setCategories(categoriesRes.value.categories || []);
      } else {
        console.error("Failed to fetch categories:", categoriesRes.reason);
      }

      if (collectionsRes.status === "fulfilled") {
        setCollections(collectionsRes.value.collections || []);
      } else {
        console.error("Failed to fetch collections:", collectionsRes.reason);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const steps: Step[] = [
    { id: "details", label: "Details", status: currentStep === 0 ? "current" : currentStep > 0 ? "complete" : "upcoming" },
    { id: "organize", label: "Organize", status: currentStep === 1 ? "current" : currentStep > 1 ? "complete" : "upcoming" },
    { id: "variants", label: "Variants", status: currentStep === 2 ? "current" : "upcoming" },
  ];

  const handleClose = () => {
    setCurrentStep(0);
    setFormData(initialFormData);
    onClose();
  };

  const handleContinue = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save product
      await saveProduct(false);
    }
  };

  const handleSaveAsDraft = async () => {
    await saveProduct(true);
  };

  const saveProduct = async (isDraft: boolean) => {
    setSaving(true);
    setError(null);

    try {
      // Build the product input
      const productInput: CreateProductInput = {
        title: formData.title,
        description: formData.description || undefined,
        handle: formData.handle || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        status: isDraft ? "draft" : "published",
        shippingProfileId: "default", // TODO: Get from backend
        categoryIds: formData.category ? [formData.category] : [],
        options: formData.hasVariants
          ? formData.options.filter(o => o.name && o.values.some(v => v)).map(o => ({
              title: o.name,
              values: o.values.filter(v => v),
            }))
          : [],
        variants: formData.hasVariants
          ? formData.variantPrices.map((vp) => ({
              title: getVariantDisplayName(vp.optionValues),
              sku: vp.sku || undefined,
              barcode: undefined,
              ean: undefined,
              inventoryQuantity: parseInt(vp.quantity) || 0,
              manageInventory: true,
              allowBackorder: false,
              options: vp.optionValues,
              prices: [
                {
                  currencyCode: "GBP",
                  amount: parseFloat(vp.price) || 0,
                },
              ],
            }))
          : [
              {
                title: formData.title,
                sku: formData.sku || undefined,
                barcode: formData.barcode || undefined,
                ean: formData.barcode || undefined,
                inventoryQuantity: parseInt(formData.quantity) || 0,
                manageInventory: formData.trackQuantity,
                allowBackorder: false,
                options: {},
                prices: [
                  {
                    currencyCode: "GBP",
                    amount: parseFloat(formData.price) || 0,
                  },
                ],
              },
            ],
      };

      const product = await createProduct(productInput);
      onSave?.(formData, isDraft);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      console.error("Failed to create product:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Generate handle from title
  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle file drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      updateFormData("images", [...formData.images, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      updateFormData("images", [...formData.images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    updateFormData(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData("tags", [...formData.tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    updateFormData(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const addOption = () => {
    updateFormData("options", [
      ...formData.options,
      { name: "", values: [""] },
    ]);
  };

  const updateOption = (index: number, field: "name" | "values", value: string | string[]) => {
    const newOptions = [...formData.options];
    if (field === "name") {
      newOptions[index].name = value as string;
    } else {
      newOptions[index].values = value as string[];
    }
    updateFormData("options", newOptions);
  };

  const removeOption = (index: number) => {
    updateFormData(
      "options",
      formData.options.filter((_, i) => i !== index)
    );
  };

  const addOptionValue = (optionIndex: number) => {
    const newOptions = [...formData.options];
    newOptions[optionIndex].values.push("");
    updateFormData("options", newOptions);
  };

  const updateOptionValue = (optionIndex: number, valueIndex: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[optionIndex].values[valueIndex] = value;
    updateFormData("options", newOptions);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const newOptions = [...formData.options];
    newOptions[optionIndex].values = newOptions[optionIndex].values.filter(
      (_, i) => i !== valueIndex
    );
    updateFormData("options", newOptions);
  };

  // Generate variant combinations from current options
  const variantCombinations = React.useMemo(
    () => generateVariantCombinations(formData.options),
    [formData.options]
  );

  // Sync variantPrices when options change
  React.useEffect(() => {
    if (!formData.hasVariants) return;

    const newVariantPrices: VariantPricing[] = variantCombinations.map(combo => {
      // Try to find existing pricing for this combination
      const existing = formData.variantPrices.find(vp =>
        JSON.stringify(vp.optionValues) === JSON.stringify(combo)
      );
      return existing || {
        optionValues: combo,
        price: "",
        sku: "",
        quantity: "0",
      };
    });

    // Only update if actually changed
    if (JSON.stringify(newVariantPrices) !== JSON.stringify(formData.variantPrices)) {
      updateFormData("variantPrices", newVariantPrices);
    }
  }, [variantCombinations, formData.hasVariants]);

  // Update a specific variant's pricing
  const updateVariantPrice = (
    index: number,
    field: keyof VariantPricing,
    value: string
  ) => {
    const newPrices = [...formData.variantPrices];
    if (newPrices[index]) {
      newPrices[index] = { ...newPrices[index], [field]: value };
      updateFormData("variantPrices", newPrices);
    }
  };

  // Set same price for all variants
  const setAllVariantPrices = (price: string) => {
    const newPrices = formData.variantPrices.map(vp => ({
      ...vp,
      price,
    }));
    updateFormData("variantPrices", newPrices);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-4 z-[100] mx-auto my-auto",
            "flex flex-col bg-background shadow-2xl rounded-lg",
            "max-w-6xl w-full max-h-[90vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          {/* Accessible title for screen readers */}
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>Create Product</DialogPrimitive.Title>
            <DialogPrimitive.Description>
              Multi-step form to create a new product
            </DialogPrimitive.Description>
          </VisuallyHidden.Root>

          {/* Header with tabs */}
          <div className="flex items-center border-b px-6 py-4">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="text-xs border rounded px-1.5 py-0.5 bg-muted">esc</span>
            </button>

            {/* Step tabs */}
            <div className="flex items-center ml-8 gap-0">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    if (step.status === "complete" || step.status === "current") {
                      setCurrentStep(index);
                    }
                  }}
                  disabled={step.status === "upcoming"}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2 border-b-2 transition-colors",
                    step.status === "current"
                      ? "border-primary text-foreground"
                      : step.status === "complete"
                      ? "border-transparent text-muted-foreground hover:text-foreground"
                      : "border-transparent text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      step.status === "complete"
                        ? "bg-primary text-primary-foreground"
                        : step.status === "current"
                        ? "border-2 border-primary text-primary"
                        : "border border-muted-foreground/30 text-muted-foreground/50"
                    )}
                  >
                    {step.status === "complete" ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Circle className="h-2 w-2 fill-current" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Step 1: Details */}
              {currentStep === 0 && (
                <div className="space-y-8">
                  {/* General */}
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">General</h2>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          placeholder="Winter jacket"
                          value={formData.title}
                          onChange={(e) => {
                            updateFormData("title", e.target.value);
                            if (!formData.handle) {
                              updateFormData("handle", generateHandle(e.target.value));
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtitle" className="text-muted-foreground">
                          Subtitle <span className="text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="subtitle"
                          placeholder="Warm and cosy"
                          value={formData.subtitle}
                          onChange={(e) => updateFormData("subtitle", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="handle" className="flex items-center gap-1 text-muted-foreground">
                          Handle
                          <Info className="h-3 w-3" />
                          <span className="text-xs">(Optional)</span>
                        </Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                            /
                          </span>
                          <Input
                            id="handle"
                            placeholder="winter-jacket"
                            className="rounded-l-none"
                            value={formData.handle}
                            onChange={(e) => updateFormData("handle", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-muted-foreground">
                        Description <span className="text-xs">(Optional)</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="A warm and cozy jacket"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => updateFormData("description", e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Media */}
                  <div className="space-y-4">
                    <Label className="text-muted-foreground">
                      Media <span className="text-xs">(Optional)</span>
                    </Label>

                    <div
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                        "hover:border-muted-foreground/50"
                      )}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-2 w-full"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">Upload images</span>
                        <span className="text-sm text-muted-foreground">
                          Drag and drop images here or click to upload.
                        </span>
                      </button>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.images.map((file, index) => (
                          <div
                            key={index}
                            className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {index === 0 && (
                              <Badge className="absolute bottom-2 left-2 text-xs">
                                Thumbnail
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Variants toggle */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Variants</h2>

                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <Switch
                        checked={formData.hasVariants}
                        onCheckedChange={(checked) => updateFormData("hasVariants", checked)}
                      />
                      <div className="space-y-1">
                        <p className="font-medium">Yes, this is a product with variants</p>
                        <p className="text-sm text-muted-foreground">
                          When unchecked, we will create a default variant for you
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Organize */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Organize Product</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateFormData("category", value)}
                          disabled={loadingData}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingData ? "Loading..." : "Select a category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length === 0 && !loadingData && (
                              <SelectItem value="_none" disabled>No categories available</SelectItem>
                            )}
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Collection</Label>
                        <Select
                          value={formData.collection}
                          onValueChange={(value) => updateFormData("collection", value)}
                          disabled={loadingData}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingData ? "Loading..." : "Select a collection"} />
                          </SelectTrigger>
                          <SelectContent>
                            {collections.length === 0 && !loadingData && (
                              <SelectItem value="_none" disabled>No collections available</SelectItem>
                            )}
                            {collections.map((col) => (
                              <SelectItem key={col.id} value={col.id}>
                                {col.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTag}>
                        Add
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {!formData.hasVariants && (
                    <>
                      <Separator />

                      {/* Pricing for simple product */}
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Pricing</h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={formData.price}
                                onChange={(e) => updateFormData("price", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Compare at price <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={formData.compareAtPrice}
                                onChange={(e) => updateFormData("compareAtPrice", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Cost per item <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                £
                              </span>
                              <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-7"
                                value={formData.costPerItem}
                                onChange={(e) => updateFormData("costPerItem", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Inventory for simple product */}
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Inventory</h2>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              SKU <span className="text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                              placeholder="Auto-generated"
                              value={formData.sku}
                              onChange={(e) => updateFormData("sku", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Barcode (EAN-13) <span className="text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                              placeholder="Auto-generated"
                              value={formData.barcode}
                              onChange={(e) => updateFormData("barcode", e.target.value)}
                              maxLength={13}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={formData.quantity}
                              onChange={(e) => updateFormData("quantity", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Variants */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  {formData.hasVariants ? (
                    <>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Product Options</h2>
                          <Button type="button" variant="outline" size="sm" onClick={addOption}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add option
                          </Button>
                        </div>

                        {formData.options.length === 0 ? (
                          <div className="text-center py-12 border rounded-lg">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                              No options defined yet
                            </p>
                            <Button type="button" variant="outline" onClick={addOption}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add your first option
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {formData.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-4">
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                  <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">Option name</Label>
                                    <Input
                                      placeholder="Size, Color, Material..."
                                      value={option.name}
                                      onChange={(e) =>
                                        updateOption(optionIndex, "name", e.target.value)
                                      }
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeOption(optionIndex)}
                                  >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </div>

                                <div className="ml-8 space-y-2">
                                  <Label className="text-xs text-muted-foreground">Values</Label>
                                  {option.values.map((value, valueIndex) => (
                                    <div key={valueIndex} className="flex items-center gap-2">
                                      <Input
                                        placeholder="Value"
                                        value={value}
                                        onChange={(e) =>
                                          updateOptionValue(optionIndex, valueIndex, e.target.value)
                                        }
                                      />
                                      {option.values.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeOptionValue(optionIndex, valueIndex)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary"
                                    onClick={() => addOptionValue(optionIndex)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add value
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Variant Pricing Table */}
                      {variantCombinations.length > 0 && (
                        <>
                          <Separator />

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-semibold">
                                Variant Pricing ({variantCombinations.length} variants)
                              </h2>
                              <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground">Set all prices:</Label>
                                <div className="relative w-32">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    £
                                  </span>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-7 h-8 text-sm"
                                    onChange={(e) => setAllVariantPrices(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-4 py-2 font-medium">Variant</th>
                                    <th className="text-left px-4 py-2 font-medium w-32">Price (£)</th>
                                    <th className="text-left px-4 py-2 font-medium w-32">SKU</th>
                                    <th className="text-left px-4 py-2 font-medium w-24">Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {formData.variantPrices.map((variant, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                      <td className="px-4 py-2 font-medium">
                                        {getVariantDisplayName(variant.optionValues)}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                            £
                                          </span>
                                          <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-8 pl-5 text-sm"
                                            value={variant.price}
                                            onChange={(e) => updateVariantPrice(idx, "price", e.target.value)}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Input
                                          placeholder="Auto"
                                          className="h-8 text-sm"
                                          value={variant.sku}
                                          onChange={(e) => updateVariantPrice(idx, "sku", e.target.value)}
                                        />
                                      </td>
                                      <td className="px-4 py-2">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          className="h-8 text-sm"
                                          value={variant.quantity}
                                          onChange={(e) => updateVariantPrice(idx, "quantity", e.target.value)}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              SKU and barcodes will be auto-generated if left empty.
                            </p>
                          </div>
                        </>
                      )}

                      {variantCombinations.length === 0 && formData.options.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Add option values above to generate variant combinations.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Simple Product</h3>
                      <p className="text-muted-foreground">
                        This product doesn't have variants. A default variant will be created for
                        you with the pricing and inventory settings from the previous step.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col border-t">
            {error && (
              <div className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-700 text-sm">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                {currentStep > 0 && (
                  <Button type="button" variant="ghost" onClick={handleBack} disabled={saving}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as draft"
                  )}
                </Button>
                <Button type="button" onClick={handleContinue} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    "Create product"
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
