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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Pencil,
  AlertCircle,
  Clock,
  Shield,
} from "lucide-react";
import {
  getSlaPolicies,
  updateSlaPolicy,
  ApiError,
  type SlaPolicy,
  type UpdateSlaPolicyInput,
} from "@/lib/api";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "URGENT":
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Urgent</Badge>;
    case "HIGH":
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">High</Badge>;
    case "MEDIUM":
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Medium</Badge>;
    case "LOW":
      return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Low</Badge>;
    default:
      return <Badge variant="secondary">{priority}</Badge>;
  }
}

export default function SlaPage() {
  const queryClient = useQueryClient();

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);
  const [editFirstResponseMinutes, setEditFirstResponseMinutes] = useState("");
  const [editResolutionMinutes, setEditResolutionMinutes] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return "An unexpected error occurred";
  };

  // Fetch SLA policies
  const policiesQuery = useQuery({
    queryKey: ["sla-policies"],
    queryFn: async () => {
      const response = await getSlaPolicies();
      return response.policies || [];
    },
    staleTime: 30_000,
  });

  const policies = policiesQuery.data ?? [];
  const isLoading = policiesQuery.isLoading;
  const fetchError = policiesQuery.error ? getErrorMessage(policiesQuery.error) : null;

  const invalidatePolicies = () => {
    queryClient.invalidateQueries({ queryKey: ["sla-policies"] });
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSlaPolicyInput }) =>
      updateSlaPolicy(id, data),
    onSuccess: () => {
      setIsEditOpen(false);
      setEditingPolicy(null);
      invalidatePolicies();
    },
    onError: (err) => {
      setEditError(getErrorMessage(err));
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateSlaPolicy(id, { active }),
    onSuccess: () => {
      invalidatePolicies();
    },
    onError: (err) => {
      console.error("Failed to toggle SLA policy:", err);
    },
  });

  const isUpdating = updateMutation.isPending;

  // Handle edit
  const openEditDialog = (policy: SlaPolicy) => {
    setEditingPolicy(policy);
    setEditFirstResponseMinutes(policy.firstResponseMinutes.toString());
    setEditResolutionMinutes(policy.resolutionMinutes.toString());
    setEditActive(policy.active);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPolicy) return;

    const firstResponse = parseInt(editFirstResponseMinutes);
    const resolution = parseInt(editResolutionMinutes);

    if (isNaN(firstResponse) || firstResponse <= 0) {
      setEditError("First response time must be a positive number");
      return;
    }
    if (isNaN(resolution) || resolution <= 0) {
      setEditError("Resolution time must be a positive number");
      return;
    }
    if (firstResponse >= resolution) {
      setEditError("First response time must be less than resolution time");
      return;
    }

    setEditError(null);
    updateMutation.mutate({
      id: editingPolicy.id,
      data: {
        firstResponseMinutes: firstResponse,
        resolutionMinutes: resolution,
        active: editActive,
      },
    });
  };

  const handleToggleActive = (policy: SlaPolicy) => {
    toggleMutation.mutate({ id: policy.id, active: !policy.active });
  };

  // Sort policies by priority order
  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedPolicies = [...policies].sort(
    (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/support">Customer Support</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SLA Policies</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* SLA Policies Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              SLA Policies
            </CardTitle>
            <CardDescription>
              Service Level Agreement policies define response and resolution time targets for each ticket priority level.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error state */}
          {fetchError && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{fetchError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => policiesQuery.refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        First Response
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Resolution
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPolicies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No SLA policies configured.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedPolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell>{getPriorityBadge(policy.priority)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDuration(policy.firstResponseMinutes)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDuration(policy.resolutionMinutes)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={policy.active}
                            onCheckedChange={() => handleToggleActive(policy)}
                            disabled={toggleMutation.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openEditDialog(policy)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {policies.filter((p) => p.active).length} of {policies.length} policies active
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit SLA Policy
            </DialogTitle>
            <DialogDescription>
              Update response and resolution time targets for{" "}
              <strong>{editingPolicy?.priority.toLowerCase()}</strong> priority tickets.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-first-response">First Response Time (minutes) *</Label>
              <Input
                id="edit-first-response"
                type="number"
                min="1"
                value={editFirstResponseMinutes}
                onChange={(e) => setEditFirstResponseMinutes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {editFirstResponseMinutes && !isNaN(parseInt(editFirstResponseMinutes))
                  ? `= ${formatDuration(parseInt(editFirstResponseMinutes))}`
                  : ""}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-resolution">Resolution Time (minutes) *</Label>
              <Input
                id="edit-resolution"
                type="number"
                min="1"
                value={editResolutionMinutes}
                onChange={(e) => setEditResolutionMinutes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {editResolutionMinutes && !isNaN(parseInt(editResolutionMinutes))
                  ? `= ${formatDuration(parseInt(editResolutionMinutes))}`
                  : ""}
              </p>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-active" className="font-medium">
                  Active
                </Label>
                <span className="text-xs text-muted-foreground">
                  Enable SLA enforcement for this priority
                </span>
              </div>
              <Switch
                id="edit-active"
                checked={editActive}
                onCheckedChange={setEditActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
