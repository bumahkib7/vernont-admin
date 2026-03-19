"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Plus,
  Loader2,
  Mail,
  Play,
  Pause,
  XCircle,
  Trash2,
  BarChart3,
  Send,
  Activity,
  Target,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useConfirm } from "@/hooks/use-confirm";

// -- Types --------------------------------------------------------------------

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  emailSubject?: string;
  templateId?: string;
  preheader?: string;
  targetAllCustomers: boolean;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface CampaignsResponse {
  content: Campaign[];
  totalElements: number;
}

// -- API ----------------------------------------------------------------------

async function fetchCampaigns() {
  return apiFetch<CampaignsResponse>(
    "/admin/marketing/campaigns?page=0&size=50"
  );
}

async function createCampaign(data: {
  name: string;
  type: string;
  emailSubject: string;
  templateId: string;
  targetAllCustomers: boolean;
}) {
  return apiFetch<Campaign>("/admin/marketing/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

async function startCampaign(id: string) {
  return apiFetch<Campaign>(`/admin/marketing/campaigns/${id}/start`, {
    method: "POST",
  });
}

async function pauseCampaign(id: string) {
  return apiFetch<Campaign>(`/admin/marketing/campaigns/${id}/pause`, {
    method: "POST",
  });
}

async function cancelCampaign(id: string) {
  return apiFetch<Campaign>(`/admin/marketing/campaigns/${id}/cancel`, {
    method: "POST",
  });
}

async function deleteCampaign(id: string) {
  return apiFetch<{ id: string; deleted: boolean }>(
    `/admin/marketing/campaigns/${id}`,
    { method: "DELETE" }
  );
}

// -- Helpers ------------------------------------------------------------------

const CAMPAIGN_TYPES = [
  { value: "MANUAL", label: "Manual" },
  { value: "PRICE_DROP", label: "Price Drop" },
  { value: "NEW_ARRIVALS", label: "New Arrivals" },
  { value: "WIN_BACK", label: "Win-Back" },
  { value: "WEEKLY_DIGEST", label: "Weekly Digest" },
] as const;

function typeBadgeLabel(type: string): string {
  return (
    CAMPAIGN_TYPES.find((t) => t.value === type)?.label ?? type
  );
}

function statusBadgeVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "DRAFT":
      return "outline";
    case "SCHEDULED":
      return "secondary";
    case "RUNNING":
      return "default";
    case "PAUSED":
      return "secondary";
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

function statusBadgeClassName(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "RUNNING":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300";
    case "PAUSED":
      return "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300";
    default:
      return "";
  }
}

// -- Page ---------------------------------------------------------------------

export default function EmailCampaignsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm();

  const { data, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: fetchCampaigns,
  });

  const campaigns = data?.content ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["email-campaigns"] });

  const startMutation = useMutation({
    mutationFn: startCampaign,
    onSuccess: () => {
      toast.success("Campaign started");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pauseMutation = useMutation({
    mutationFn: pauseCampaign,
    onSuccess: () => {
      toast.success("Campaign paused");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelCampaign,
    onSuccess: () => {
      toast.success("Campaign cancelled");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      toast.success("Campaign deleted");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Stats
  const totalCampaigns = campaigns.length;
  const activeRunning = campaigns.filter((c) => c.status === "RUNNING").length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.totalSent, 0);

  const handleStart = async (campaign: Campaign) => {
    const ok = await confirm({
      title: "Start Campaign",
      description: `Start sending "${campaign.name}" to ${campaign.totalRecipients} recipients?`,
      confirmLabel: "Start",
    });
    if (ok) startMutation.mutate(campaign.id);
  };

  const handlePause = async (campaign: Campaign) => {
    const ok = await confirm({
      title: "Pause Campaign",
      description: `Pause "${campaign.name}"? You can resume it later.`,
      confirmLabel: "Pause",
    });
    if (ok) pauseMutation.mutate(campaign.id);
  };

  const handleCancel = async (campaign: Campaign) => {
    const ok = await confirm({
      title: "Cancel Campaign",
      description: `Cancel "${campaign.name}"? This action cannot be undone.`,
      confirmLabel: "Cancel Campaign",
      variant: "destructive",
    });
    if (ok) cancelMutation.mutate(campaign.id);
  };

  const handleDelete = async (campaign: Campaign) => {
    const ok = await confirm({
      title: "Delete Campaign",
      description: `Permanently delete "${campaign.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (ok) deleteMutation.mutate(campaign.id);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/marketing">Marketing</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Email Campaigns</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Email Campaigns
          </h1>
          <p className="text-muted-foreground">
            Create and manage email marketing campaigns
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCampaigns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active / Running
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRunning}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSent.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>All email marketing campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">
                No campaigns yet. Create your first email campaign to get
                started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-right">Recipients</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {typeBadgeLabel(campaign.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusBadgeVariant(campaign.status)}
                        className={statusBadgeClassName(campaign.status)}
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {campaign.templateId ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.totalRecipients.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.totalSent.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(
                        campaign.scheduledAt ??
                          campaign.startedAt ??
                          campaign.createdAt
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {(campaign.status === "DRAFT" ||
                            campaign.status === "PAUSED") && (
                            <DropdownMenuItem
                              onClick={() => handleStart(campaign)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {campaign.status === "RUNNING" && (
                            <DropdownMenuItem
                              onClick={() => handlePause(campaign)}
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          {(campaign.status === "RUNNING" ||
                            campaign.status === "PAUSED" ||
                            campaign.status === "SCHEDULED") && (
                            <DropdownMenuItem
                              onClick={() => handleCancel(campaign)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(campaign)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Create Campaign Dialog */}
      {createOpen && (
        <CreateCampaignDialog
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            invalidate();
          }}
        />
      )}

      <ConfirmDialog />
    </div>
  );
}

// -- Create Campaign Dialog ---------------------------------------------------

function CreateCampaignDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("MANUAL");
  const [emailSubject, setEmailSubject] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [targetAllCustomers, setTargetAllCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !emailSubject) {
      toast.error("Name and email subject are required");
      return;
    }

    setSubmitting(true);
    try {
      await createCampaign({
        name,
        type,
        emailSubject,
        templateId: templateId || undefined as unknown as string,
        targetAllCustomers,
      });
      toast.success("Campaign created");
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          <DialogDescription>
            Create a new email marketing campaign.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Name</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Summer Sale Blast"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="campaign-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-subject">Email Subject</Label>
            <Input
              id="campaign-subject"
              placeholder="e.g. Don't miss our summer deals!"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-template">Template ID</Label>
            <Input
              id="campaign-template"
              placeholder="e.g. order-confirmation"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="campaign-target-all"
              checked={targetAllCustomers}
              onCheckedChange={(checked) =>
                setTargetAllCustomers(checked === true)
              }
            />
            <Label htmlFor="campaign-target-all" className="font-normal">
              Target all customers
            </Label>
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
