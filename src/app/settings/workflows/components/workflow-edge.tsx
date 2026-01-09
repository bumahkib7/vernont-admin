"use client";

import { memo } from "react";
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  type Position,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { StepStatus } from "./workflow-node";

export interface WorkflowEdgeData {
  status: StepStatus;
  animated?: boolean;
}

interface WorkflowEdgeComponentProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data?: WorkflowEdgeData;
  markerEnd?: string;
}

const edgeColors: Record<StepStatus, string> = {
  PENDING: "stroke-muted-foreground/40",
  RUNNING: "stroke-blue-500",
  COMPLETED: "stroke-green-500",
  FAILED: "stroke-red-500",
  SKIPPED: "stroke-muted-foreground/50",
};

function WorkflowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: WorkflowEdgeComponentProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const status = data?.status ?? "PENDING";
  const isActive = status === "RUNNING";
  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";

  return (
    <>
      {/* Background path for pending/dashed */}
      {status === "PENDING" && (
        <path
          id={`${id}-bg`}
          className="fill-none stroke-muted-foreground/20"
          strokeWidth={2}
          strokeDasharray="5,5"
          d={edgePath}
        />
      )}

      {/* Main edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "!stroke-2 transition-colors duration-300",
          edgeColors[status],
          status === "PENDING" && "!stroke-dasharray-[5,5]"
        )}
        style={{
          strokeWidth: isActive ? 3 : 2,
          strokeDasharray: status === "PENDING" ? "5,5" : undefined,
        }}
        markerEnd={markerEnd}
      />

      {/* Animated flow dots for running edges */}
      {isActive && (
        <circle r="4" className="fill-blue-500">
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Success checkmark at midpoint for completed */}
      {isCompleted && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Failure X at midpoint for failed */}
      {isFailed && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const WorkflowEdge = memo(WorkflowEdgeComponent);
