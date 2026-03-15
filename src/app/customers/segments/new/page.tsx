"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { createCustomerSegment, previewCustomerSegment } from "@/lib/api";

interface Rule {
  field: string;
  operator: string;
  value: string;
}

const FIELDS = [
  { value: "total_spent", label: "Total Spent" },
  { value: "order_count", label: "Order Count" },
  { value: "last_order_date", label: "Last Order Date" },
  { value: "created_at", label: "Account Created" },
  { value: "country", label: "Country" },
  { value: "email_domain", label: "Email Domain" },
];

const OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater than or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less than or equal" },
  { value: "contains", label: "contains" },
];

export default function NewSegmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [rules, setRules] = useState<Rule[]>([{ field: "total_spent", operator: "gte", value: "" }]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const addRule = () => {
    setRules([...rules, { field: "total_spent", operator: "gte", value: "" }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: keyof Rule, value: string) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const buildCriteria = () => {
    const validRules = rules.filter((r) => r.value !== "");
    return {
      rules: validRules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: isNaN(Number(r.value)) ? r.value : Number(r.value),
      })),
    };
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const result = await previewCustomerSegment(buildCriteria());
      setPreviewCount(result.matchingCount);
    } catch (err: any) {
      toast.error(err?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      await createCustomerSegment({
        name: name.trim(),
        description: description.trim() || undefined,
        criteria: buildCriteria(),
        isDynamic,
      });
      toast.success("Segment created");
      router.push("/customers/segments");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create segment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/customers/segments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Segment</h1>
          <p className="text-muted-foreground mt-1">
            Define rules to automatically group customers.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. High-Value Customers"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isDynamic} onCheckedChange={setIsDynamic} id="dynamic" />
            <Label htmlFor="dynamic">Auto-update membership (dynamic segment)</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>
            Customers matching all rules will be included in this segment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select value={rule.field} onValueChange={(v) => updateRule(index, "field", v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rule.operator} onValueChange={(v) => updateRule(index, "operator", v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={rule.value}
                onChange={(e) => updateRule(index, "value", e.target.value)}
                className="flex-1"
              />
              {rules.length > 1 && (
                <Button size="icon" variant="ghost" onClick={() => removeRule(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={previewing}>
              {previewing ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              Preview
            </Button>
            {previewCount !== null && (
              <span className="text-sm text-muted-foreground self-center">
                {previewCount.toLocaleString()} customer{previewCount !== 1 ? "s" : ""} match
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => router.push("/customers/segments")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create Segment
        </Button>
      </div>
    </div>
  );
}
