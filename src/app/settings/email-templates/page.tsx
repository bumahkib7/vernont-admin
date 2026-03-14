"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Eye,
  Copy,
  Pencil,
  Trash2,
  Mail,
  Loader2,
} from "lucide-react";
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

interface EmailTemplatesResponse {
  emailTemplates: EmailTemplate[];
  count: number;
  offset: number;
  limit: number;
}

// ── API ───────────────────────────────────────────────────────────────

async function fetchTemplates() {
  return apiFetch<EmailTemplatesResponse>("/admin/email-templates?limit=100");
}

async function deleteTemplate(id: string) {
  return apiFetch<{ id: string; deleted: boolean }>(
    `/admin/email-templates/${id}`,
    { method: "DELETE" }
  );
}

async function duplicateTemplate(id: string) {
  return apiFetch<{ emailTemplate: EmailTemplate }>(
    `/admin/email-templates/${id}/duplicate`,
    { method: "POST" }
  );
}

async function createTemplate(data: {
  templateId: string;
  name: string;
  subject: string;
  htmlBody: string;
  description?: string;
}) {
  return apiFetch<{ emailTemplate: EmailTemplate }>("/admin/email-templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Page ──────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: fetchTemplates,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success("Template deleted");
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: () => {
      toast.success("Template duplicated");
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const templates = data?.emailTemplates ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Email Templates</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Manage email templates sent to customers and team members
            </CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No email templates found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Template ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/settings/email-templates/${template.id}`}
                        className="hover:underline"
                      >
                        {template.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {template.templateId}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={template.isActive ? "default" : "secondary"}
                      >
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.isSystem ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/settings/email-templates/${template.id}`}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPreviewId(template.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              duplicateMutation.mutate(template.id)
                            }
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!template.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  deleteMutation.mutate(template.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {previewId && (
        <PreviewDialog
          templateId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}

      {/* Create Dialog */}
      {createOpen && (
        <CreateTemplateDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            queryClient.invalidateQueries({ queryKey: ["email-templates"] });
          }}
        />
      )}
    </div>
  );
}

// ── Preview Dialog ────────────────────────────────────────────────────

function PreviewDialog({
  templateId,
  onClose,
}: {
  templateId: string;
  onClose: () => void;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`/admin/email-templates/${templateId}/preview`, {
      credentials: "include",
    })
      .then((r) => r.text())
      .then((text) => {
        setHtml(text);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load preview");
        setLoading(false);
      });
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <DialogDescription>
            Preview of the rendered email template
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : html ? (
            <iframe
              srcDoc={html}
              className="w-full h-[60vh] border-0"
              title="Email preview"
              sandbox="allow-same-origin"
            />
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              Failed to load preview
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Template Dialog ────────────────────────────────────────────

function CreateTemplateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!templateId || !name || !subject) {
      toast.error("Template ID, name, and subject are required");
      return;
    }

    setSubmitting(true);
    try {
      await createTemplate({
        templateId,
        name,
        subject,
        description: description || undefined,
        htmlBody:
          "<p>Edit this template to add your email content with {{variable}} placeholders.</p>",
      });
      toast.success("Template created");
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Email Template</DialogTitle>
          <DialogDescription>
            Create a new email template. You can edit the HTML after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateId">Template ID</Label>
            <Input
              id="templateId"
              placeholder="e.g. welcome-vip"
              value={templateId}
              onChange={(e) =>
                setTemplateId(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. VIP Welcome Email"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder='e.g. Welcome to {{brand}}, {{name}}!'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What is this template used for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
