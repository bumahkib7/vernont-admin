"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Glasses,
  Ruler,
  Sparkles,
  Package,
  Loader2,
  Save,
  Trash2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProductSpecifications,
  setEyewearSpecifications,
  deleteProductSpecifications,
  type EyewearSpecification,
} from "@/lib/api/products";

interface SpecificationsEditorProps {
  productId: string;
}

const EMPTY_SPEC: EyewearSpecification = {
  frame: {},
  lens: {},
  measurements: {},
  fit: {},
  model: {},
  includedItems: [],
  careInstructions: [],
  features: [],
};

const FRAME_SHAPES = [
  "Aviator", "Browline", "Cat-Eye", "Geometric", "Oval",
  "Oversized", "Pilot", "Rectangle", "Round", "Shield",
  "Square", "Wayfarer", "Wrap",
];

const FRAME_MATERIALS = [
  "Acetate", "Beta-Titanium", "Carbon Fiber", "Combination",
  "Metal", "Nylon", "Stainless Steel", "Titanium", "Wood",
];

const FRAME_STYLES = [
  "Full-rim", "Semi-rimless", "Rimless",
];

const LENS_MATERIALS = [
  "CR39", "Glass", "Mineral Glass", "Polycarbonate", "Trivex",
];

const HINGE_TYPES = [
  "Barrel", "Flex", "Spring", "Standard",
];

const NOSEPAD_TYPES = [
  "Adjustable", "Integrated", "Keyhole", "Saddle", "Universal Fit",
];

const FACE_SHAPES = [
  "Diamond", "Heart", "Oblong", "Oval", "Round", "Square", "Triangle",
];

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    const trimmed = newItem.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem("");
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="pr-1">
            {item}
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder || `Add ${label.toLowerCase()}...`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SpecificationsEditor({ productId }: SpecificationsEditorProps) {
  const [spec, setSpec] = useState<EyewearSpecification>(EMPTY_SPEC);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchSpecs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductSpecifications(productId);
      if (data?.data) {
        const d = data.data as unknown as EyewearSpecification;
        setSpec({
          frame: d.frame || {},
          lens: d.lens || {},
          measurements: d.measurements || {},
          fit: d.fit || {},
          model: d.model || {},
          includedItems: d.includedItems || [],
          careInstructions: d.careInstructions || [],
          features: d.features || [],
        });
        setHasExisting(true);
      }
    } catch {
      // No specs yet — that's fine
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  const updateFrame = (field: string, value: string | null) => {
    setSpec((prev) => ({ ...prev, frame: { ...prev.frame, [field]: value || null } }));
    setHasChanges(true);
  };

  const updateLens = (field: string, value: string | boolean | null) => {
    setSpec((prev) => ({ ...prev, lens: { ...prev.lens, [field]: value } }));
    setHasChanges(true);
  };

  const updateMeasurements = (field: string, value: string) => {
    const num = value ? parseInt(value, 10) : null;
    setSpec((prev) => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: num },
    }));
    setHasChanges(true);
  };

  const updateFit = (field: string, value: string | string[] | null) => {
    setSpec((prev) => ({ ...prev, fit: { ...prev.fit, [field]: value || null } }));
    setHasChanges(true);
  };

  const updateModel = (field: string, value: string | null) => {
    setSpec((prev) => ({ ...prev, model: { ...prev.model, [field]: value || null } }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setEyewearSpecifications(productId, spec);
      setHasExisting(true);
      setHasChanges(false);
      toast.success("Specifications saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save specifications");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProductSpecifications(productId);
      setSpec(EMPTY_SPEC);
      setHasExisting(false);
      setHasChanges(false);
      toast.success("Specifications deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete specifications");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Glasses className="h-5 w-5" />
                Eyewear Specifications
              </CardTitle>
              <CardDescription className="mt-1">
                {hasExisting ? (
                  <span className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    Specifications saved
                  </span>
                ) : (
                  "No specifications set — fill in details below"
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasExisting && (
                <Button variant="outline" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                Save Specs
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Frame Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Frame Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Material</Label>
              <Select
                value={spec.frame.material || ""}
                onValueChange={(v) => updateFrame("material", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                value={spec.frame.color || ""}
                onChange={(e) => updateFrame("color", e.target.value)}
                placeholder="e.g., Black, Havana, Gold"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Shape</Label>
              <Select
                value={spec.frame.shape || ""}
                onValueChange={(v) => updateFrame("shape", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shape" />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_SHAPES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select
                value={spec.frame.style || ""}
                onValueChange={(v) => updateFrame("style", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hinge Type</Label>
              <Select
                value={spec.frame.hingeType || ""}
                onValueChange={(v) => updateFrame("hingeType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hinge type" />
                </SelectTrigger>
                <SelectContent>
                  {HINGE_TYPES.map((h) => (
                    <SelectItem key={h} value={h}>{h}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Temple Design</Label>
              <Input
                value={spec.frame.templeDesign || ""}
                onChange={(e) => updateFrame("templeDesign", e.target.value)}
                placeholder="e.g., Straight, Curved"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lens Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Lens Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Material</Label>
              <Select
                value={spec.lens.material || ""}
                onValueChange={(v) => updateLens("material", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lens material" />
                </SelectTrigger>
                <SelectContent>
                  {LENS_MATERIALS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <Input
                value={spec.lens.color || ""}
                onChange={(e) => updateLens("color", e.target.value)}
                placeholder="e.g., Green, Grey, Brown"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Technology</Label>
              <Input
                value={spec.lens.technology || ""}
                onChange={(e) => updateLens("technology", e.target.value)}
                placeholder="e.g., Gradient, Polarized, Photochromic"
              />
            </div>
            <div className="space-y-2">
              <Label>Coating</Label>
              <Input
                value={spec.lens.coating || ""}
                onChange={(e) => updateLens("coating", e.target.value)}
                placeholder="e.g., Anti-reflective, Mirror"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>UV Protection</Label>
              <Input
                value={spec.lens.uvProtection || ""}
                onChange={(e) => updateLens("uvProtection", e.target.value)}
                placeholder="e.g., UV400"
              />
            </div>
            <div className="space-y-2">
              <Label>Category (0-4)</Label>
              <Input
                value={spec.lens.category || ""}
                onChange={(e) => updateLens("category", e.target.value)}
                placeholder="e.g., 3"
              />
            </div>
            <div className="space-y-2">
              <Label>Polarized</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={spec.lens.polarized || false}
                  onCheckedChange={(checked) => updateLens("polarized", checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {spec.lens.polarized ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Ruler className="h-4 w-4" />
            Measurements (mm)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Lens Width</Label>
              <Input
                type="number"
                value={spec.measurements.lensWidth ?? ""}
                onChange={(e) => updateMeasurements("lensWidth", e.target.value)}
                placeholder="e.g., 52"
              />
            </div>
            <div className="space-y-2">
              <Label>Bridge Width</Label>
              <Input
                type="number"
                value={spec.measurements.bridgeWidth ?? ""}
                onChange={(e) => updateMeasurements("bridgeWidth", e.target.value)}
                placeholder="e.g., 18"
              />
            </div>
            <div className="space-y-2">
              <Label>Temple Length</Label>
              <Input
                type="number"
                value={spec.measurements.templeLength ?? ""}
                onChange={(e) => updateMeasurements("templeLength", e.target.value)}
                placeholder="e.g., 145"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Width</Label>
              <Input
                type="number"
                value={spec.measurements.totalWidth ?? ""}
                onChange={(e) => updateMeasurements("totalWidth", e.target.value)}
                placeholder="e.g., 140"
              />
            </div>
            <div className="space-y-2">
              <Label>Lens Height</Label>
              <Input
                type="number"
                value={spec.measurements.lensHeight ?? ""}
                onChange={(e) => updateMeasurements("lensHeight", e.target.value)}
                placeholder="e.g., 42"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fit & Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Fit & Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Size</Label>
              <Input
                value={spec.fit.size || ""}
                onChange={(e) => updateFit("size", e.target.value)}
                placeholder="e.g., Medium, 48-18-145"
              />
            </div>
            <div className="space-y-2">
              <Label>Fit Type</Label>
              <Select
                value={spec.fit.fitType || ""}
                onValueChange={(v) => updateFit("fitType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Wide">Wide</SelectItem>
                  <SelectItem value="Narrow">Narrow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nosepad Type</Label>
              <Select
                value={spec.fit.nosepadType || ""}
                onValueChange={(v) => updateFit("nosepadType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nosepad" />
                </SelectTrigger>
                <SelectContent>
                  {NOSEPAD_TYPES.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Production Note</Label>
              <Input
                value={spec.fit.productionNote || ""}
                onChange={(e) => updateFit("productionNote", e.target.value)}
                placeholder="e.g., Produced in one size only"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Recommended Face Shapes</Label>
            <div className="flex flex-wrap gap-2">
              {FACE_SHAPES.map((shape) => {
                const selected = (spec.fit.faceShapes || []).includes(shape);
                return (
                  <Badge
                    key={shape}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = spec.fit.faceShapes || [];
                      const next = selected
                        ? current.filter((s) => s !== shape)
                        : [...current, shape];
                      updateFit("faceShapes", next);
                    }}
                  >
                    {selected && <Check className="mr-1 h-3 w-3" />}
                    {shape}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Model Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Style Code</Label>
              <Input
                value={spec.model.styleCode || ""}
                onChange={(e) => updateModel("styleCode", e.target.value)}
                placeholder="e.g., MK2277U Grenada"
              />
            </div>
            <div className="space-y-2">
              <Label>Model Code</Label>
              <Input
                value={spec.model.modelCode || ""}
                onChange={(e) => updateModel("modelCode", e.target.value)}
                placeholder="e.g., MK2277U 404087 56-15"
              />
            </div>
            <div className="space-y-2">
              <Label>Color Code</Label>
              <Input
                value={spec.model.colorCode || ""}
                onChange={(e) => updateModel("colorCode", e.target.value)}
                placeholder="e.g., 404087"
              />
            </div>
            <div className="space-y-2">
              <Label>UPC</Label>
              <Input
                value={spec.model.upc || ""}
                onChange={(e) => updateModel("upc", e.target.value)}
                placeholder="e.g., 725125385022"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            <Package className="h-4 w-4" />
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ListEditor
            label="What's Included"
            items={spec.includedItems || []}
            onChange={(items) => {
              setSpec((prev) => ({ ...prev, includedItems: items }));
              setHasChanges(true);
            }}
            placeholder="e.g., Original case, Cleaning cloth"
          />
          <Separator />
          <ListEditor
            label="Care Instructions"
            items={spec.careInstructions || []}
            onChange={(items) => {
              setSpec((prev) => ({ ...prev, careInstructions: items }));
              setHasChanges(true);
            }}
            placeholder="e.g., Clean with microfiber cloth"
          />
          <Separator />
          <ListEditor
            label="Features"
            items={spec.features || []}
            onChange={(items) => {
              setSpec((prev) => ({ ...prev, features: items }));
              setHasChanges(true);
            }}
            placeholder="e.g., Lightweight, Hypoallergenic"
          />
        </CardContent>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end gap-2">
        {hasExisting && (
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Delete Specifications
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Save Specifications
        </Button>
      </div>
    </div>
  );
}
