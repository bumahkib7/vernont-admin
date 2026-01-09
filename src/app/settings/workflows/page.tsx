"use client";

import { useState, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Activity,
  Workflow,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronLeft,
  Clock,
  Search,
  BarChart3,
  RotateCcw,
  GitBranch,
  Timer,
} from "lucide-react";
import { useWorkflowEvents, WorkflowExecution } from "@/hooks/use-workflow-events";
import { ReactFlowProvider } from "@xyflow/react";
import { formatDistanceToNow } from "date-fns";

import { WorkflowFlow } from "./components/workflow-flow";
import { NodeDetailPanel } from "./components/node-detail-panel";
import { WorkflowStats } from "./components/workflow-stats";
import { ExecutionTimeline } from "./components/execution-timeline";

function StatusBadge({ status }: { status: WorkflowExecution["status"] }) {
  switch (status) {
    case "RUNNING":
      return (
        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Running
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
  }
}

function ExecutionListView({
  executions,
  onSelect,
  activeCount,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  executions: WorkflowExecution[];
  onSelect: (execution: WorkflowExecution) => void;
  activeCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workflow Executions</CardTitle>
          {activeCount > 0 && (
            <Badge className="bg-blue-500/10 text-blue-600 gap-1">
              <Activity className="h-3 w-3" />
              {activeCount} running
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 pt-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {executions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No workflow executions yet</p>
            <p className="text-sm">Executions will appear here when workflows run</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Steps</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution) => (
                  <TableRow
                    key={execution.executionId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelect(execution)}
                  >
                    <TableCell className="font-medium">
                      {execution.workflowName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={execution.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {execution.durationMs
                        ? `${(execution.durationMs / 1000).toFixed(1)}s`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {execution.steps.slice(0, 6).map((step, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              step.status === "COMPLETED"
                                ? "bg-green-500"
                                : step.status === "RUNNING"
                                ? "bg-blue-500 animate-pulse"
                                : step.status === "FAILED"
                                ? "bg-red-500"
                                : "bg-muted-foreground/30"
                            }`}
                            title={step.name}
                          />
                        ))}
                        {execution.steps.length > 6 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{execution.steps.length - 6}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExecutionDetailView({
  execution,
  onBack,
  selectedStep,
  onStepSelect,
  onStepClose,
  onRetry,
  isRetrying,
}: {
  execution: WorkflowExecution;
  onBack: () => void;
  selectedStep: string | null;
  onStepSelect: (step: string | null) => void;
  onStepClose: () => void;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const [detailTab, setDetailTab] = useState("flow");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to list
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{execution.workflowName}</h2>
          <StatusBadge status={execution.status} />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
          <Clock className="h-4 w-4" />
          {formatDistanceToNow(new Date(execution.startedAt), { addSuffix: true })}
          {execution.durationMs && (
            <span className="font-mono">• {(execution.durationMs / 1000).toFixed(1)}s</span>
          )}
          {execution.status === "FAILED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="ml-2"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-1" />
              )}
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Flow / Timeline */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList>
          <TabsTrigger value="flow" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Flow Diagram
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Timer className="h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="mt-4">
          <Card className="overflow-hidden">
            <div className="flex h-[500px]">
              <div className={`flex-1 ${selectedStep ? 'border-r' : ''}`}>
                <ReactFlowProvider>
                  <WorkflowFlow
                    execution={execution}
                    onNodeSelect={onStepSelect}
                    selectedNode={selectedStep}
                  />
                </ReactFlowProvider>
              </div>

              {/* Step Details Panel */}
              {selectedStep && (
                <div className="w-96 overflow-hidden">
                  <NodeDetailPanel
                    execution={execution}
                    selectedStep={selectedStep}
                    onClose={onStepClose}
                  />
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ExecutionTimeline
            execution={execution}
            onStepClick={onStepSelect}
            selectedStep={selectedStep}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function WorkflowsSettingsPage() {
  const {
    executions,
    activeCount,
    connectionStatus,
    refresh,
  } = useWorkflowEvents({ pollingInterval: 5000 });

  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("executions");
  const [isRetrying, setIsRetrying] = useState(false);

  // Filter executions based on search and status
  const filteredExecutions = useMemo(() => {
    return executions.filter((execution) => {
      const matchesSearch = execution.workflowName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || execution.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [executions, searchQuery, statusFilter]);

  const handleExecutionSelect = useCallback((execution: WorkflowExecution) => {
    setSelectedExecution(execution);
    setSelectedStep(null);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedExecution(null);
    setSelectedStep(null);
  }, []);

  const handleStepSelect = useCallback((stepName: string | null) => {
    setSelectedStep(stepName);
  }, []);

  const handleStepClose = useCallback(() => {
    setSelectedStep(null);
  }, []);

  const handleRetry = useCallback(async () => {
    if (!selectedExecution) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    setIsRetrying(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/admin/workflows/executions/${selectedExecution.executionId}/retry`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        refresh();
        handleBack();
      }
    } catch (error) {
      console.error("Failed to retry workflow:", error);
    } finally {
      setIsRetrying(false);
    }
  }, [selectedExecution, refresh, handleBack]);

  // Keep selected execution in sync with updates
  const currentExecution = selectedExecution
    ? executions.find((e) => e.executionId === selectedExecution.executionId) ?? selectedExecution
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Workflow Monitor</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {connectionStatus === "live" ? (
            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
              <Wifi className="h-3 w-3" />
              Live
            </Badge>
          ) : connectionStatus === "polling" ? (
            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
              <Activity className="h-3 w-3" />
              Polling
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      {currentExecution ? (
        <ExecutionDetailView
          execution={currentExecution}
          onBack={handleBack}
          selectedStep={selectedStep}
          onStepSelect={handleStepSelect}
          onStepClose={handleStepClose}
          onRetry={handleRetry}
          isRetrying={isRetrying}
        />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="executions" className="gap-2">
              <Activity className="h-4 w-4" />
              Executions
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="mt-4">
            <ExecutionListView
              executions={filteredExecutions}
              onSelect={handleExecutionSelect}
              activeCount={activeCount}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </TabsContent>

          <TabsContent value="statistics" className="mt-4">
            <WorkflowStats executions={executions} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
