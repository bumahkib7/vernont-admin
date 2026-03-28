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
import { Autocomplete } from "@/components/ui/autocomplete";
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
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAgentActionsStore } from "@/stores/agent-actions";
import {
  getCategories,
  getCollections,
  createProduct,
  uploadProductImage,
  type ProductCategory,
  type ProductCollection,
  type CreateProductInput,
  type ImageInput,
} from "@/lib/api";
import {
  useProductFormStore,
  getVariantDisplayName,
} from "@/stores/product-form-store";

type Step = {
  id: string;
  label: string;
  status: "complete" | "current" | "upcoming";
};

const CURRENCY_SYMBOL = "\u00a3"; // Centralized — change here for multi-currency support

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (isDraft: boolean) => void;
};

export function AddProductModal({ isOpen, onClose, onSave }: AddProductModalProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Backend data (kept local — not form state)
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [collections, setCollections] = React.useState<ProductCollection[]>([]);
  const [loadingData, setLoadingData] = React.useState(false);

  // WebSocket for progress tracking
  const { isConnected, subscribe, unsubscribe } = useWebSocket({ autoConnect: true });

  // --- Zustand store ---
  const store = useProductFormStore();

  const steps: Step[] = [
    { id: "details", label: "Details", status: store.currentStep === 0 ? "current" : store.currentStep > 0 ? "complete" : "upcoming" },
    { id: "organize", label: "Organize", status: store.currentStep === 1 ? "current" : store.currentStep > 1 ? "complete" : "upcoming" },
    { id: "variants", label: "Variants", status: store.currentStep === 2 ? "current" : "upcoming" },
  ];

  // Variant combinations — computed from store, no useEffect needed
  const variantCombinations = store.getVariantCombinations();

  // Fetch categories and collections on mount
  React.useEffect(() => {
    if (isOpen) {
      fetchBackendData();
    }
  }, [isOpen]);

  // Agent actions: consume pre-fill data when modal opens
  const consumeFormData = useAgentActionsStore((s) => s.consumeFormData);
  React.useEffect(() => {
    if (!isOpen) return;
    const prefill = consumeFormData("add-product");
    if (prefill) {
      store.applyPrefill(prefill);
    }
  }, [isOpen, consumeFormData]);

  // Subscribe to workflow events when we have an execution ID
  React.useEffect(() => {
    if (!store.executionId || !isConnected) return;

    const topic = `/topic/workflow/${store.executionId}`;
    const subscription = subscribe(topic, (message: any) => {
      if (message.type === "STEP_PROGRESS") {
        const totalSteps = message.totalSteps || 3;
        const stepIndex = message.stepIndex || 0;
        const progressCurrent = message.progressCurrent || 0;
        const progressTotal = message.progressTotal || 1;

        const stepWeight = 100 / totalSteps;
        const stepProgress = (progressCurrent / progressTotal) * stepWeight;
        const overallPercent = Math.round(stepIndex * stepWeight + stepProgress);

        store.setProgress({
          stepName: message.stepName || "Processing",
          current: progressCurrent,
          total: progressTotal,
          message: message.progressMessage || `Step ${stepIndex + 1} of ${totalSteps}`,
          percent: Math.min(overallPercent, 99),
        });
      } else if (message.type === "WORKFLOW_COMPLETED") {
        store.setProgress(
          store.progress
            ? { ...store.progress, percent: 100, message: "Complete!" }
            : null
        );
      } else if (message.type === "WORKFLOW_FAILED") {
        store.setError(message.error || "Product creation failed");
        store.setSaving(false);
        store.setProgress(null);
      }
    });

    return () => {
      if (subscription) {
        unsubscribe(subscription);
      }
    };
  }, [store.executionId, isConnected, subscribe, unsubscribe]);

  const fetchBackendData = async () => {
    setLoadingData(true);
    store.setError(null);
    try {
      const [categoriesRes, collectionsRes] = await Promise.allSettled([
        getCategories({ limit: 100 }),
        getCollections({ limit: 100 }),
      ]);

      if (categoriesRes.status === "fulfilled") {
        setCategories(categoriesRes.value?.categories || []);
      } else {
        console.error("Failed to fetch categories:", categoriesRes.reason);
      }

      if (collectionsRes.status === "fulfilled") {
        setCollections(collectionsRes.value?.collections || []);
      } else {
        console.error("Failed to fetch collections:", collectionsRes.reason);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleClose = () => {
    store.reset();
    setNewTag("");
    onClose();
  };

  const handleContinue = async () => {
    if (store.currentStep < steps.length - 1) {
      store.nextStep();
    } else {
      await saveProduct(false);
    }
  };

  const handleSaveAsDraft = async () => {
    await saveProduct(true);
  };

  const saveProduct = async (isDraft: boolean) => {
    store.setSaving(true);
    store.setError(null);
    store.setProgress({ stepName: "Starting", current: 0, total: 1, message: "Initializing...", percent: 0 });

    try {
      // Step 1: Upload images first (if any)
      const uploadedImages: ImageInput[] = [];
      if (store.images.length > 0) {
        store.setProgress({
          stepName: "Uploading",
          current: 0,
          total: store.images.length,
          message: `Uploading ${store.images.length} image(s)...`,
          percent: 5,
        });

        for (let i = 0; i < store.images.length; i++) {
          const file = store.images[i];
          store.setProgress({
            stepName: "Uploading",
            current: i + 1,
            total: store.images.length,
            message: `Uploading image ${i + 1} of ${store.images.length}...`,
            percent: 5 + Math.floor((i / store.images.length) * 20),
          });

          try {
            const uploadResult = await uploadProductImage(file);
            uploadedImages.push({
              url: uploadResult.url,
              position: i,
            });
          } catch (uploadError) {
            console.warn(`Image ${i + 1} upload failed, skipping:`, uploadError);
            // Continue creating product without this image
          }
        }
      }

      store.setProgress({ stepName: "Creating", current: 0, total: 1, message: "Creating product...", percent: 30 });

      // Step 2: Build the product input with uploaded image URLs
      const productInput: CreateProductInput = {
        title: store.title,
        description: store.description || undefined,
        handle: store.handle || store.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        status: isDraft ? "draft" : "published",
        shippingProfileId: "default",
        categoryIds: store.category ? [store.category] : [],
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        options: store.hasVariants
          ? store.options
              .filter((o) => o.name && o.values.some((v) => v))
              .map((o) => ({
                title: o.name,
                values: o.values.filter((v) => v),
              }))
          : [],
        variants: store.hasVariants
          ? store.variantPrices.map((vp) => ({
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
                title: store.title,
                sku: store.sku || undefined,
                barcode: store.barcode || undefined,
                ean: store.barcode || undefined,
                inventoryQuantity: parseInt(store.quantity) || 0,
                manageInventory: store.trackQuantity,
                allowBackorder: false,
                options: {},
                prices: [
                  {
                    currencyCode: "GBP",
                    amount: parseFloat(store.price) || 0,
                  },
                ],
              },
            ],
      };

      const response = await createProduct(productInput);

      // Set execution ID to subscribe to progress events
      if (response.executionId) {
        store.setExecutionId(response.executionId);
      }

      // Wait a brief moment for progress to complete, then close
      setTimeout(() => {
        store.setProgress({ stepName: "Complete", current: 1, total: 1, message: "Product created!", percent: 100 });
        setTimeout(() => {
          onSave?.(isDraft);
          handleClose();
        }, 500);
      }, 300);
    } catch (err) {
      store.setError(err instanceof Error ? err.message : "Failed to create product");
      store.setProgress(null);
      console.error("Failed to create product:", err);
      store.setSaving(false);
    }
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
      store.addImages(newFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      store.addImages(newFiles);
    }
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
                      store.goToStep(index);
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
              {store.currentStep === 0 && (
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
                          value={store.title}
                          onChange={(e) => store.setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtitle" className="text-muted-foreground">
                          Subtitle <span className="text-xs">(Optional)</span>
                        </Label>
                        <Input
                          id="subtitle"
                          placeholder="Warm and cosy"
                          value={store.subtitle}
                          onChange={(e) => store.setField("subtitle", e.target.value)}
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
                            value={store.handle}
                            onChange={(e) => store.setField("handle", e.target.value)}
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
                        value={store.description}
                        onChange={(e) => store.setField("description", e.target.value)}
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

                    {store.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {store.images.map((file, index) => (
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
                              onClick={() => store.removeImage(index)}
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
                        checked={store.hasVariants}
                        onCheckedChange={(checked) => store.setField("hasVariants", checked)}
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
              {store.currentStep === 1 && (
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold">Organize Product</h2>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Autocomplete
                          options={categories.map((cat) => ({
                            value: cat.id,
                            label: cat.name,
                          }))}
                          value={store.category}
                          onValueChange={(value) => store.setField("category", value)}
                          placeholder="Select a category"
                          searchPlaceholder="Search categories..."
                          emptyMessage="No categories found."
                          loading={loadingData}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Collection</Label>
                        <Autocomplete
                          options={collections.map((col) => ({
                            value: col.id,
                            label: col.title,
                          }))}
                          value={store.collection}
                          onValueChange={(value) => store.setField("collection", value)}
                          placeholder="Select a collection"
                          searchPlaceholder="Search collections..."
                          emptyMessage="No collections found."
                          loading={loadingData}
                        />
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
                            store.addTag(newTag);
                            setNewTag("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          store.addTag(newTag);
                          setNewTag("");
                        }}
                      >
                        Add
                      </Button>
                    </div>
                    {store.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {store.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              onClick={() => store.removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {!store.hasVariants && (
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
                                {CURRENCY_SYMBOL}
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.price}
                                onChange={(e) => store.setField("price", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Compare at price <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {CURRENCY_SYMBOL}
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.compareAtPrice}
                                onChange={(e) => store.setField("compareAtPrice", e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Cost per item <span className="text-xs">(Optional)</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                {CURRENCY_SYMBOL}
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="pl-7"
                                value={store.costPerItem}
                                onChange={(e) => store.setField("costPerItem", e.target.value)}
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
                              value={store.sku}
                              onChange={(e) => store.setField("sku", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-muted-foreground">
                              Barcode (EAN-13) <span className="text-xs">(Auto-generated if empty)</span>
                            </Label>
                            <Input
                              placeholder="Auto-generated"
                              value={store.barcode}
                              onChange={(e) => store.setField("barcode", e.target.value)}
                              maxLength={13}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={store.quantity}
                              onChange={(e) => store.setField("quantity", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 3: Variants */}
              {store.currentStep === 2 && (
                <div className="space-y-8">
                  {store.hasVariants ? (
                    <>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold">Product Options</h2>
                          <Button type="button" variant="outline" size="sm" onClick={store.addOption}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add option
                          </Button>
                        </div>

                        {store.options.length === 0 ? (
                          <div className="text-center py-12 border rounded-lg">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground mb-4">
                              No options defined yet
                            </p>
                            <Button type="button" variant="outline" onClick={store.addOption}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add your first option
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {store.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-4">
                                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                  <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">Option name</Label>
                                    <Input
                                      placeholder="Size, Color, Material..."
                                      value={option.name}
                                      onChange={(e) =>
                                        store.updateOptionName(optionIndex, e.target.value)
                                      }
                                    />
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => store.removeOption(optionIndex)}
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
                                          store.updateOptionValue(optionIndex, valueIndex, e.target.value)
                                        }
                                      />
                                      {option.values.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => store.removeOptionValue(optionIndex, valueIndex)}
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
                                    onClick={() => store.addOptionValue(optionIndex)}
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
                                    {CURRENCY_SYMBOL}
                                  </span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    className="pl-7 h-8 text-sm"
                                    onChange={(e) => store.setAllVariantPrices(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left px-4 py-2 font-medium">Variant</th>
                                    <th className="text-left px-4 py-2 font-medium w-32">Price ({CURRENCY_SYMBOL})</th>
                                    <th className="text-left px-4 py-2 font-medium w-32">SKU</th>
                                    <th className="text-left px-4 py-2 font-medium w-24">Qty</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {store.variantPrices.map((variant, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30">
                                      <td className="px-4 py-2 font-medium">
                                        {getVariantDisplayName(variant.optionValues)}
                                      </td>
                                      <td className="px-4 py-2">
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                            {CURRENCY_SYMBOL}
                                          </span>
                                          <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            className="h-8 pl-5 text-sm"
                                            value={variant.price}
                                            onChange={(e) => store.updateVariantPrice(idx, "price", e.target.value)}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-2">
                                        <Input
                                          placeholder="Auto"
                                          className="h-8 text-sm"
                                          value={variant.sku}
                                          onChange={(e) => store.updateVariantPrice(idx, "sku", e.target.value)}
                                        />
                                      </td>
                                      <td className="px-4 py-2">
                                        <Input
                                          type="text"
                                          inputMode="numeric"
                                          placeholder="0"
                                          className="h-8 text-sm"
                                          value={variant.quantity}
                                          onChange={(e) => store.updateVariantPrice(idx, "quantity", e.target.value)}
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

                      {variantCombinations.length === 0 && store.options.length > 0 && (
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
            {/* Progress bar */}
            {store.saving && store.progress && (
              <div className="px-6 py-3 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{store.progress.message}</span>
                  <span className="font-medium">{store.progress.percent}%</span>
                </div>
                <Progress value={store.progress.percent} className="h-2" />
              </div>
            )}
            {store.error && (
              <div className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{store.error}</span>
                <button
                  onClick={() => store.setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                {store.currentStep > 0 && (
                  <Button type="button" variant="ghost" onClick={store.prevStep} disabled={store.saving}>
                    Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleClose} disabled={store.saving}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={store.saving}>
                  {store.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save as draft"
                  )}
                </Button>
                <Button type="button" onClick={handleContinue} disabled={store.saving}>
                  {store.saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : store.currentStep === steps.length - 1 ? (
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
