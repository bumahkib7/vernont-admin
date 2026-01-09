"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  SkipForward,
} from "lucide-react";

export type StepStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface WorkflowNodeData {
  label: string;
  status: StepStatus;
  durationMs?: number;
  isFirst?: boolean;
  isLast?: boolean;
  stepIndex: number;
  totalSteps: number;
}

interface WorkflowNodeComponentProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

const statusConfig: Record<
  StepStatus,
  {
    bg: string;
    border: string;
    icon: React.ReactNode;
    pulse?: boolean;
  }
> = {
  PENDING: {
    bg: "bg-muted",
    border: "border-muted-foreground/30 border-dashed",
    icon: <Clock className="h-4 w-4 text-muted-foreground" />,
  },
  RUNNING: {
    bg: "bg-blue-500/10",
    border: "border-blue-500",
    icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    pulse: true,
  },
  COMPLETED: {
    bg: "bg-green-500/10",
    border: "border-green-500",
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  FAILED: {
    bg: "bg-red-500/10",
    border: "border-red-500",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
  SKIPPED: {
    bg: "bg-muted",
    border: "border-muted-foreground/50",
    icon: <SkipForward className="h-4 w-4 text-muted-foreground" />,
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function WorkflowNodeComponent({ data, selected }: WorkflowNodeComponentProps) {
  const config = statusConfig[data.status];

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 min-w-[140px] max-w-[200px] transition-all duration-200",
        config.bg,
        config.border,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        config.pulse && "animate-pulse"
      )}
    >
      {/* Input handle (not for first node) */}
      {!data.isFirst && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-background"
        />
      )}

      {/* Node content */}
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex-shrink-0">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={data.label}>
            {data.label}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              Step {data.stepIndex + 1}/{data.totalSteps}
            </span>
            {data.durationMs !== undefined && data.status !== "PENDING" && (
              <span className="text-xs font-mono text-muted-foreground">
                {formatDuration(data.durationMs)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar for running steps */}
      {data.status === "RUNNING" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/20 rounded-b-lg overflow-hidden">
          <div className="h-full bg-blue-500 animate-progress-indeterminate" />
        </div>
      )}

      {/* Output handle (not for last node) */}
      {!data.isLast && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-background"
        />
      )}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
