"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Loader2,
  FormInput,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CheckoutField {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  placeholder?: string;
  options?: string[];
  required: boolean;
  enabled: boolean;
  displayOrder: number;
  appliesTo: string;
}

interface FieldForm {
  name: string;
  label: string;
  fieldType: string;
  placeholder: string;
  options: string;
  required: boolean;
  enabled: boolean;
  appliesTo: string;
}

const EMPTY_FORM: FieldForm = {
  name: "",
  label: "",
  fieldType: "TEXT",
  placeholder: "",
  options: "",
  required: false,
  enabled: true,
  appliesTo: "ORDER",
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: "Text",
  TEXTAREA: "Textarea",
  SELECT: "Dropdown",
  CHECKBOX: "Checkbox",
  DATE: "Date",
};

export default function CheckoutFieldsPage() {
  const [fields, setFields] = useState<CheckoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/checkout-fields") as { fields?: CheckoutField[] };
      setFields(data.fields ?? []);
    } catch (err) {
      console.error("Failed to fetch checkout fields:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (field: CheckoutField) => {
    setEditingId(field.id);
    setForm({
      name: field.name,
      label: field.label,
      fieldType: field.fieldType,
      placeholder: field.placeholder ?? "",
      options: field.options?.join(", ") ?? "",
      required: field.required,
      enabled: field.enabled,
      appliesTo: field.appliesTo,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.label.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        label: form.label.trim(),
        fieldType: form.fieldType,
        placeholder: form.placeholder.trim() || null,
        options: form.fieldType === "SELECT" ? form.options.split(",").map((o) => o.trim()).filter(Boolean) : null,
        required: form.required,
        enabled: form.enabled,
        appliesTo: form.appliesTo,
      };
      if (editingId) {
        await apiFetch(`/admin/checkout-fields/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
      } else {
        await apiFetch("/admin/checkout-fields", { method: "POST", body: JSON.stringify(body) });
      }
      setDialogOpen(false);
      await fetchFields();
    } catch (err) {
      console.error("Failed to save field:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiFetch(`/admin/checkout-fields/${id}`, { method: "DELETE" });
      await fetchFields();
    } catch (err) {
      console.error("Failed to delete field:", err);
    } finally {
      setDeleting(null);
    }
  };

  const toggleEnabled = async (field: CheckoutField) => {
    try {
      await apiFetch(`/admin/checkout-fields/${field.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...field, enabled: !field.enabled }),
      });
      await fetchFields();
    } catch (err) {
      console.error("Failed to toggle field:", err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Checkout Custom Fields</h1>
          <p className="text-muted-foreground mt-1">
            Add custom fields to your checkout for gift messages, delivery instructions, and more.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Field
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FormInput className="h-5 w-5" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FormInput className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p>No custom fields yet. Add your first field to enhance the checkout experience.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{field.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{FIELD_TYPE_LABELS[field.fieldType] ?? field.fieldType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{field.appliesTo}</TableCell>
                    <TableCell>
                      {field.required ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">Required</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Optional</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={field.enabled} onCheckedChange={() => toggleEnabled(field)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(field)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(field.id)}
                          disabled={deleting === field.id}
                        >
                          {deleting === field.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Field" : "Add Custom Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Field Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., gift_message"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Internal identifier (no spaces)</p>
            </div>
            <div>
              <label className="text-sm font-medium">Label *</label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g., Gift Message"
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Field Type</label>
              <Select value={form.fieldType} onValueChange={(v) => setForm((f) => ({ ...f, fieldType: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="TEXTAREA">Textarea</SelectItem>
                  <SelectItem value="SELECT">Dropdown</SelectItem>
                  <SelectItem value="CHECKBOX">Checkbox</SelectItem>
                  <SelectItem value="DATE">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.fieldType === "SELECT" && (
              <div>
                <label className="text-sm font-medium">Options (comma-separated)</label>
                <Input
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="Option A, Option B, Option C"
                  className="mt-1.5"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Placeholder</label>
              <Input
                value={form.placeholder}
                onChange={(e) => setForm((f) => ({ ...f, placeholder: e.target.value }))}
                placeholder="Placeholder text..."
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Applies To</label>
              <Select value={form.appliesTo} onValueChange={(v) => setForm((f) => ({ ...f, appliesTo: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORDER">Order</SelectItem>
                  <SelectItem value="SHIPPING">Shipping</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.required} onCheckedChange={(v) => setForm((f) => ({ ...f, required: v }))} />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))} />
                Enabled
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.label.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingId ? "Save Changes" : "Create Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
