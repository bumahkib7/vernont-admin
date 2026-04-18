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
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Save, Trash2, Check, X, Plus, ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  useSpecificationTypes,
  useSpecificationSchema,
} from "@/hooks/use-specification-schema";
import {
  getProductSpecifications,
  setSpecification,
  deleteProductSpecifications,
  type SpecificationFieldSchema,
} from "@/lib/api/products";

interface DynamicSpecificationsEditorProps {
  productId: string;
}

// ── List editor (reused from original spec editor) ───────────────────────────

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

// ── Recursive field renderer ─────────────────────────────────────────────────

function SchemaField({
  field,
  value,
  onChange,
}: {
  field: SpecificationFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = field.name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  switch (field.type) {
    case "object":
      return (
        <SchemaObjectSection
          field={field}
          value={(value as Record<string, unknown>) ?? {}}
          onChange={onChange}
        />
      );

    case "string":
      if (field.options && field.options.length > 0) {
        return (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Select
              value={(value as string) ?? ""}
              onValueChange={(v) => onChange(v || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.description || `Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={field.description || label}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v ? Number(v) : null);
            }}
            placeholder={field.description || label}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between py-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
      );

    case "array<string>":
      return (
        <ListEditor
          label={label}
          items={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={field.description}
        />
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={field.description || label}
          />
        </div>
      );
  }
}

// ── Object section (collapsible card) ────────────────────────────────────────

function SchemaObjectSection({
  field,
  value,
  onChange,
}: {
  field: SpecificationFieldSchema;
  value: Record<string, unknown>;
  onChange: (value: unknown) => void;
}) {
  const [open, setOpen] = useState(true);

  const sectionLabel = field.name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  const filledCount = field.fields
    ? field.fields.filter((f) => {
        const v = value[f.name];
        return v != null && v !== "" && v !== false && (!Array.isArray(v) || v.length > 0);
      }).length
    : 0;

  const totalCount = field.fields?.length ?? 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 px-1 hover:bg-muted/50 rounded-md transition-colors">
          <span className="text-sm font-medium">{sectionLabel}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {filledCount}/{totalCount}
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid gap-3 pt-2 pb-4 pl-2 border-l-2 border-muted ml-1">
          {field.fields?.map((childField) => (
            <SchemaField
              key={childField.path}
              field={childField}
              value={value[childField.name]}
              onChange={(newVal) => {
                onChange({ ...value, [childField.name]: newVal });
              }}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Main editor component ────────────────────────────────────────────────────

export function DynamicSpecificationsEditor({
  productId,
}: DynamicSpecificationsEditorProps) {
  const [specType, setSpecType] = useState<string | null>(null);
  const [specData, setSpecData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: specTypes } = useSpecificationTypes();
  const { data: schema, isLoading: schemaLoading } = useSpecificationSchema(specType);

  // Fetch existing spec data
  const fetchSpecs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProductSpecifications(productId);
      if (data?.data && data?.type) {
        setSpecType(data.type);
        setSpecData(data.data as Record<string, unknown>);
        setHasExisting(true);
      }
    } catch {
      // No specs yet
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  const handleSave = async () => {
    if (!specType) return;
    setSaving(true);
    try {
      const result = await setSpecification(productId, specType, specData);
      setHasExisting(true);
      setHasChanges(false);
      toast.success(
        result.isComplete
          ? "Specifications saved (complete)"
          : "Specifications saved (incomplete — some fields missing)"
      );
    } catch (error) {
      toast.error("Failed to save specifications");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete all specifications for this product?")) return;
    try {
      await deleteProductSpecifications(productId);
      setSpecData({});
      setSpecType(null);
      setHasExisting(false);
      setHasChanges(false);
      toast.success("Specifications deleted");
    } catch (error) {
      toast.error("Failed to delete specifications");
      console.error(error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Type selector — shown when no spec type is set yet
  if (!specType) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Product Specifications
          </CardTitle>
          <CardDescription>
            Select a product type to configure specifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Product Type</Label>
            <Select onValueChange={(v) => { setSpecType(v); setHasChanges(true); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product type..." />
              </SelectTrigger>
              <SelectContent>
                {specTypes?.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    <span className="flex items-center gap-2">
                      {t.display_name}
                      <span className="text-xs text-muted-foreground">
                        ({t.field_count} fields)
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Schema loading
  if (schemaLoading || !schema) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading schema...</span>
        </CardContent>
      </Card>
    );
  }

  // Main editor — render form from schema
  const displayType = specTypes?.find((t) => t.type === specType)?.display_name ?? specType;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {displayType} Specifications
            </CardTitle>
            {hasExisting && (
              <Badge variant="outline" className="gap-1">
                <Check className="h-3 w-3" /> Saved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasExisting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
        <CardDescription>{schema.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schema.fields.map((field) => (
          <SchemaField
            key={field.path}
            field={field}
            value={field.type === "object" ? (specData[field.name] ?? {}) : specData[field.name]}
            onChange={(newVal) => {
              setSpecData((prev) => ({ ...prev, [field.name]: newVal }));
              setHasChanges(true);
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
