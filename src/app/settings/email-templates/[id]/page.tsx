"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, Save, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  subject: string;
  htmlBody: string;
  isSystem: boolean;
  isActive: boolean;
  sampleData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ── API ───────────────────────────────────────────────────────────────

async function fetchTemplate(id: string) {
  return apiFetch<{ emailTemplate: EmailTemplate }>(
    `/admin/email-templates/${id}`
  );
}

async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    subject?: string;
    htmlBody?: string;
    isActive?: boolean;
    sampleData?: Record<string, unknown>;
  }
) {
  return apiFetch<{ emailTemplate: EmailTemplate }>(
    `/admin/email-templates/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function EmailTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["email-template", id],
    queryFn: () => fetchTemplate(id),
  });

  const template = data?.emailTemplate;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sampleDataJson, setSampleDataJson] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  // Populate form when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description ?? "");
      setSubject(template.subject);
      setHtmlBody(template.htmlBody);
      setIsActive(template.isActive);
      setSampleDataJson(
        template.sampleData
          ? JSON.stringify(template.sampleData, null, 2)
          : "{}"
      );
      setDirty(false);
    }
  }, [template]);

  const markDirty = useCallback(() => setDirty(true), []);

  const saveMutation = useMutation({
    mutationFn: () => {
      let sampleData: Record<string, unknown> | undefined;
      try {
        sampleData = JSON.parse(sampleDataJson);
      } catch {
        // ignore invalid JSON for sample data
      }
      return updateTemplate(id, {
        name,
        description: description || undefined,
        subject,
        htmlBody,
        isActive,
        sampleData,
      });
    },
    onSuccess: () => {
      toast.success("Template saved");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["email-template", id] });
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch(`/admin/email-templates/${id}/preview`, {
        credentials: "include",
      });
      const text = await res.text();
      setPreviewHtml(text);
    } catch {
      toast.error("Failed to load preview");
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Template not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/settings/email-templates")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings/email-templates">
              Email Templates
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{template.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{template.name}</h1>
          <Badge variant="outline">
            {template.isSystem ? "System" : "Custom"}
          </Badge>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !dirty}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview" onClick={loadPreview}>
            Preview
          </TabsTrigger>
          <TabsTrigger value="sample-data">Sample Data</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Template ID:{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {template.templateId}
                </code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    markDirty();
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => {
                    setIsActive(checked);
                    markDirty();
                  }}
                />
                <Label>Active</Label>
                <span className="text-xs text-muted-foreground">
                  Inactive templates fall back to the built-in default
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>HTML Body</CardTitle>
              <CardDescription>
                Use {"{{variable}}"} placeholders for dynamic content. Brand
                theme variables (bgColor, headingFont, etc.) are injected
                automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="font-mono text-sm min-h-[400px]"
                value={htmlBody}
                onChange={(e) => {
                  setHtmlBody(e.target.value);
                  markDirty();
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardContent className="p-0">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[70vh] border-0"
                  title="Email preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sample Data Tab */}
        <TabsContent value="sample-data">
          <Card>
            <CardHeader>
              <CardTitle>Sample Data</CardTitle>
              <CardDescription>
                JSON data used for previewing this template. These values
                replace {"{{variable}}"} placeholders in the preview.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="font-mono text-sm min-h-[300px]"
                value={sampleDataJson}
                onChange={(e) => {
                  setSampleDataJson(e.target.value);
                  markDirty();
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
