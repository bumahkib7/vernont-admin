"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MoreHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Eye,
  AlertTriangle,
} from "lucide-react";
import {
  getInterventions,
  getInterventionStats,
  resolveIntervention,
  ignoreIntervention,
  retryIntervention,
  getInterventionSeverityDisplay,
  getInterventionStatusDisplay,
  type HumanInterventionItem,
  type InterventionSeverity,
  type InterventionStatus,
  type InterventionStats,
} from "@/lib/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function SeverityBadge({ severity }: { severity: InterventionSeverity }) {
  const { label, color } = getInterventionSeverityDisplay(severity);
  return <Badge className={color}>{label}</Badge>;
}

function StatusBadge({ status }: { status: InterventionStatus }) {
  const { label, color } = getInterventionStatusDisplay(status);
  return <Badge className={color}>{label}</Badge>;
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<HumanInterventionItem[]>([]);
  const [stats, setStats] = useState<InterventionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    count: 0,
  });

  // Dialog state
  const [selectedIntervention, setSelectedIntervention] = useState<HumanInterventionItem | null>(null);
  const [actionType, setActionType] = useState<"resolve" | "ignore" | "view" | null>(null);
  const [resolution, setResolution] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [interventionsRes, statsRes] = await Promise.all([
        getInterventions({
          offset: pagination.offset,
          limit: pagination.limit,
          status: statusFilter !== "all" ? (statusFilter as InterventionStatus) : undefined,
          severity: severityFilter !== "all" ? (severityFilter as InterventionSeverity) : undefined,
        }),
        getInterventionStats(),
      ]);
      setInterventions(interventionsRes.interventions || []);
      setPagination((prev) => ({ ...prev, count: interventionsRes.count }));
      setStats(statsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interventions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, severityFilter, pagination.offset]);

  const handleResolve = async () => {
    if (!selectedIntervention || !resolution.trim()) return;
    setActionLoading(true);
    try {
      await resolveIntervention(selectedIntervention.id, resolution);
      setSelectedIntervention(null);
      setActionType(null);
      setResolution("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve intervention");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIgnore = async () => {
    if (!selectedIntervention) return;
    setActionLoading(true);
    try {
      await ignoreIntervention(selectedIntervention.id, resolution || undefined);
      setSelectedIntervention(null);
      setActionType(null);
      setResolution("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to ignore intervention");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async (intervention: HumanInterventionItem) => {
    try {
      await retryIntervention(intervention.id);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry intervention");
    }
  };

  const openAction = (intervention: HumanInterventionItem, action: "resolve" | "ignore" | "view") => {
    setSelectedIntervention(intervention);
    setActionType(action);
    setResolution("");
  };

  const closeDialog = () => {
    setSelectedIntervention(null);
    setActionType(null);
    setResolution("");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Human Interventions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                {stats.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Critical</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {stats.bySeverity.critical}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In Progress</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <RotateCw className="h-5 w-5 text-blue-500" />
                {stats.inProgress}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved Today</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                {stats.resolved}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Interventions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Intervention Queue</CardTitle>
            <CardDescription>
              Items requiring manual review or action
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="IGNORED">Ignored</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchData} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && interventions.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interventions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No interventions found
                    </TableCell>
                  </TableRow>
                ) : (
                  interventions.map((intervention) => (
                    <TableRow key={intervention.id}>
                      <TableCell>
                        <SeverityBadge severity={intervention.severity} />
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {intervention.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{intervention.interventionType}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {intervention.entityType}: {intervention.entityId.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={intervention.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(intervention.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openAction(intervention, "view")}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {intervention.status === "PENDING" && (
                              <>
                                <DropdownMenuItem onClick={() => openAction(intervention, "resolve")}>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Resolve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openAction(intervention, "ignore")}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Ignore
                                </DropdownMenuItem>
                                {intervention.maxAutoRetries > intervention.autoRetryCount && (
                                  <DropdownMenuItem onClick={() => handleRetry(intervention)}>
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    Retry Now
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.count > pagination.limit && (
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span>
                {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.count)} of {pagination.count}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.offset === 0}
                  onClick={() => setPagination((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pagination.offset + pagination.limit >= pagination.count}
                  onClick={() => setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={actionType === "view" && !!selectedIntervention} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntervention && <SeverityBadge severity={selectedIntervention.severity} />}
              {selectedIntervention?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedIntervention?.interventionType} - {selectedIntervention?.entityType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedIntervention?.description}
              </p>
            </div>
            {selectedIntervention?.errorMessage && (
              <div>
                <h4 className="text-sm font-medium mb-1">Error Message</h4>
                <pre className="text-sm text-red-600 bg-red-50 p-2 rounded overflow-x-auto">
                  {selectedIntervention.errorMessage}
                </pre>
              </div>
            )}
            {selectedIntervention?.contextData && Object.keys(selectedIntervention.contextData).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Context Data</h4>
                <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(selectedIntervention.contextData, null, 2)}
                </pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                {selectedIntervention && <StatusBadge status={selectedIntervention.status} />}
              </div>
              <div>
                <span className="text-muted-foreground">Auto Retries:</span>{" "}
                {selectedIntervention?.autoRetryCount} / {selectedIntervention?.maxAutoRetries}
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>{" "}
                {selectedIntervention && formatDate(selectedIntervention.createdAt)}
              </div>
              {selectedIntervention?.resolvedAt && (
                <div>
                  <span className="text-muted-foreground">Resolved:</span>{" "}
                  {formatDate(selectedIntervention.resolvedAt)}
                </div>
              )}
            </div>
            {selectedIntervention?.resolution && (
              <div>
                <h4 className="text-sm font-medium mb-1">Resolution</h4>
                <p className="text-sm text-muted-foreground">{selectedIntervention.resolution}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Close</Button>
            {selectedIntervention?.status === "PENDING" && (
              <>
                <Button variant="outline" onClick={() => setActionType("ignore")}>Ignore</Button>
                <Button onClick={() => setActionType("resolve")}>Resolve</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={actionType === "resolve" && !!selectedIntervention} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Intervention</DialogTitle>
            <DialogDescription>
              Provide a resolution for: {selectedIntervention?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Describe how this was resolved..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleResolve} disabled={actionLoading || !resolution.trim()}>
              {actionLoading ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ignore Dialog */}
      <Dialog open={actionType === "ignore" && !!selectedIntervention} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ignore Intervention</DialogTitle>
            <DialogDescription>
              Are you sure you want to ignore: {selectedIntervention?.title}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Optional: Provide a reason for ignoring..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button variant="destructive" onClick={handleIgnore} disabled={actionLoading}>
              {actionLoading ? "Ignoring..." : "Ignore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
