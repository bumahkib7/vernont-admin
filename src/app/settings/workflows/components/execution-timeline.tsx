"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle2, XCircle, Loader2, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowExecution, WorkflowStep } from "@/hooks/use-workflow-events";

interface ExecutionTimelineProps {
  execution: WorkflowExecution;
  onStepClick?: (stepName: string) => void;
  selectedStep?: string | null;
}

const statusConfig = {
  PENDING: {
    color: "bg-zinc-500/20",
    borderColor: "border-zinc-500/30",
    textColor: "text-zinc-500",
    icon: Clock,
    label: "Pending",
  },
  RUNNING: {
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    textColor: "text-blue-500",
    icon: Loader2,
    label: "Running",
  },
  COMPLETED: {
    color: "bg-emerald-500",
    borderColor: "border-emerald-500",
    textColor: "text-emerald-500",
    icon: CheckCircle2,
    label: "Completed",
  },
  FAILED: {
    color: "bg-red-500",
    borderColor: "border-red-500",
    textColor: "text-red-500",
    icon: XCircle,
    label: "Failed",
  },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function ExecutionTimeline({
  execution,
  onStepClick,
  selectedStep,
}: ExecutionTimelineProps) {
  const timelineData = useMemo(() => {
    if (!execution.steps.length) return null;

    // Find the total duration and earliest start time
    const stepsWithTiming = execution.steps.filter((s) => s.startedAt);
    if (!stepsWithTiming.length) return null;

    const startTimes = stepsWithTiming.map((s) => new Date(s.startedAt!).getTime());
    const earliestStart = Math.min(...startTimes);

    // Calculate end time (either from completedAt or estimate from duration)
    let latestEnd = earliestStart;
    stepsWithTiming.forEach((s) => {
      if (s.completedAt) {
        latestEnd = Math.max(latestEnd, new Date(s.completedAt).getTime());
      } else if (s.startedAt && s.durationMs) {
        latestEnd = Math.max(
          latestEnd,
          new Date(s.startedAt).getTime() + s.durationMs
        );
      } else if (s.startedAt && s.status === "RUNNING") {
        // For running steps, use current time
        latestEnd = Math.max(latestEnd, Date.now());
      }
    });

    const totalDuration = latestEnd - earliestStart;
    if (totalDuration <= 0) return null;

    // Calculate position and width for each step
    const bars = execution.steps.map((step, index) => {
      if (!step.startedAt) {
        return {
          step,
          index,
          left: 0,
          width: 0,
          startOffset: 0,
          duration: 0,
        };
      }

      const stepStart = new Date(step.startedAt).getTime();
      const startOffset = stepStart - earliestStart;
      const left = (startOffset / totalDuration) * 100;

      let duration: number;
      if (step.completedAt) {
        duration = new Date(step.completedAt).getTime() - stepStart;
      } else if (step.durationMs) {
        duration = step.durationMs;
      } else if (step.status === "RUNNING") {
        duration = Date.now() - stepStart;
      } else {
        duration = 0;
      }

      const width = Math.max((duration / totalDuration) * 100, 2); // Min 2% width for visibility

      return {
        step,
        index,
        left,
        width,
        startOffset,
        duration,
      };
    });

    return {
      bars,
      totalDuration,
      earliestStart,
    };
  }, [execution.steps]);

  if (!timelineData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Execution Timeline</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No timing data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-base">Execution Timeline</CardTitle>
              <CardDescription className="text-xs">
                Gantt view of step execution
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {formatDuration(timelineData.totalDuration)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time axis */}
        <div className="relative h-6 border-b border-border/50">
          <div className="absolute left-28 right-0 h-full flex justify-between items-end pb-1 px-1">
            {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
              <span key={fraction} className="text-[10px] text-muted-foreground font-mono">
                {formatDuration(timelineData.totalDuration * fraction)}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline rows */}
        <TooltipProvider delayDuration={100}>
          <div className="space-y-2">
            {timelineData.bars.map(({ step, left, width, duration }) => {
              const config = statusConfig[step.status];
              const StatusIcon = config.icon;
              const isSelected = selectedStep === step.name;

              return (
                <div
                  key={step.name}
                  className="flex items-center gap-3 group"
                >
                  {/* Step name */}
                  <div className="w-28 flex-shrink-0 flex items-center gap-2">
                    <StatusIcon
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        config.textColor,
                        step.status === "RUNNING" && "animate-spin"
                      )}
                    />
                    <span
                      className="text-xs truncate font-medium"
                      title={step.name}
                    >
                      {step.name}
                    </span>
                  </div>

                  {/* Timeline bar container */}
                  <div className="flex-1 h-8 bg-muted/30 rounded-md relative overflow-hidden">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {[0.25, 0.5, 0.75].map((fraction) => (
                        <div
                          key={fraction}
                          className="absolute top-0 bottom-0 w-px bg-border/30"
                          style={{ left: `${fraction * 100}%` }}
                        />
                      ))}
                    </div>

                    {/* Progress bar */}
                    {step.startedAt && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "absolute top-1 bottom-1 rounded transition-all duration-200",
                              config.color,
                              step.status === "RUNNING" && "animate-pulse",
                              isSelected
                                ? "ring-2 ring-ring ring-offset-2 ring-offset-background"
                                : "hover:brightness-110",
                              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            )}
                            style={{
                              left: `${left}%`,
                              width: `${Math.max(width, 1)}%`,
                            }}
                            onClick={() => onStepClick?.(step.name)}
                          >
                            {width > 10 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white truncate px-1">
                                {formatDuration(duration)}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs"
                        >
                          <div className="space-y-2">
                            <div className="font-semibold">{step.name}</div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <span className="text-muted-foreground">Status:</span>
                              <span className={cn("font-medium", config.textColor)}>
                                {config.label}
                              </span>
                              <span className="text-muted-foreground">Duration:</span>
                              <span className="font-mono">
                                {duration > 0 ? formatDuration(duration) : "—"}
                              </span>
                              {step.startedAt && (
                                <>
                                  <span className="text-muted-foreground">Started:</span>
                                  <span className="font-mono text-[10px]">
                                    {new Date(step.startedAt).toLocaleTimeString()}
                                  </span>
                                </>
                              )}
                            </div>
                            {step.error && (
                              <div className="pt-2 border-t text-xs text-red-400">
                                {step.error.substring(0, 100)}
                                {step.error.length > 100 && "..."}
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Duration badge */}
                  <div className="w-16 flex-shrink-0 text-right">
                    <span className="text-xs font-mono text-muted-foreground">
                      {duration > 0 ? formatDuration(duration) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t">
          {Object.entries(statusConfig).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn("w-3 h-3 rounded-sm", config.color)} />
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
