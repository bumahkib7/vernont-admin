"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
  X,
  Terminal,
} from "lucide-react";
import type { WorkflowStep, WorkflowExecution } from "@/hooks/use-workflow-events";

interface NodeDetailPanelProps {
  execution: WorkflowExecution | null;
  selectedStep: string | null;
  onClose: () => void;
  onRetry?: (executionId: string) => void;
}

function StatusBadge({ status }: { status: WorkflowStep["status"] }) {
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
    case "PENDING":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    default:
      return null;
  }
}

function JsonViewer({ data, label }: { data: string; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  let formatted = data;
  try {
    formatted = JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    // Keep original if not valid JSON
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-muted/30">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard();
            }}
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-[200px] border-t">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
              {formatted}
            </pre>
          </ScrollArea>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function LiveOutputStream({ output }: { output?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [output, autoScroll]);

  if (!output) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-center text-muted-foreground text-sm">
          <Terminal className="h-4 w-4 mr-2" />
          Waiting for output...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-black/90 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black/50 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-green-400" />
          <span className="text-xs text-white/70">Live Output</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => setAutoScroll(!autoScroll)}
        >
          {autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
        </Button>
      </div>
      <ScrollArea
        className="h-[200px]"
        ref={scrollRef}
        onMouseEnter={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
      >
        <pre className="p-3 text-xs font-mono text-green-400 whitespace-pre-wrap break-all">
          {output}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function NodeDetailPanel({
  execution,
  selectedStep,
  onClose,
  onRetry,
}: NodeDetailPanelProps) {
  const step = execution?.steps.find((s) => s.name === selectedStep);

  if (!execution || !selectedStep || !step) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground p-4">
        <div className="text-center">
          <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">Click a step to view details</div>
        </div>
      </div>
    );
  }

  const stepIndex = execution.steps.findIndex((s) => s.name === selectedStep);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold">{step.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {execution.steps.length}
              </span>
              {step.durationMs && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {step.durationMs}ms
                  </span>
                </>
              )}
            </div>
          </div>
          <StatusBadge status={step.status} />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Live output for running steps */}
          {step.status === "RUNNING" && (
            <div>
              <h4 className="text-sm font-medium mb-2">Live Output</h4>
              <LiveOutputStream output={step.output} />
            </div>
          )}

          {/* Error message for failed steps */}
          {step.status === "FAILED" && step.error && (
            <div>
              <h4 className="text-sm font-medium mb-2 text-red-600">Error</h4>
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 p-3">
                <pre className="text-xs font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap">
                  {step.error}
                </pre>
              </div>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onRetry(execution.executionId)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Workflow
                </Button>
              )}
            </div>
          )}

          {/* Input data */}
          {step.input && (
            <div>
              <h4 className="text-sm font-medium mb-2">Input</h4>
              <JsonViewer data={step.input} label="Input Data" />
            </div>
          )}

          {/* Output data (for completed steps) */}
          {step.status === "COMPLETED" && step.output && (
            <div>
              <h4 className="text-sm font-medium mb-2">Output</h4>
              <JsonViewer data={step.output} label="Output Data" />
            </div>
          )}

          {/* Timing info */}
          {step.startedAt && (
            <div>
              <h4 className="text-sm font-medium mb-2">Timing</h4>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span className="font-mono text-xs">
                    {new Date(step.startedAt).toLocaleTimeString()}
                  </span>
                </div>
                {step.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-mono text-xs">
                      {new Date(step.completedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {step.durationMs && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-mono text-xs">{step.durationMs}ms</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
