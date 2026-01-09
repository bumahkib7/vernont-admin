"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "./use-websocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Event types matching backend
export type WorkflowEventType =
  | "WORKFLOW_STARTED"
  | "WORKFLOW_COMPLETED"
  | "WORKFLOW_FAILED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "STEP_FAILED";

export type ExecutionStatus = "RUNNING" | "COMPLETED" | "FAILED";

export interface WorkflowExecutionEvent {
  eventType: WorkflowEventType;
  executionId: string;
  workflowName: string;
  stepName?: string;
  stepIndex?: number;
  totalSteps?: number;
  status: ExecutionStatus;
  input?: string;
  output?: string;
  error?: string;
  errorType?: string;
  durationMs?: number;
  timestamp: string;
  correlationId?: string;
  parentExecutionId?: string;
}

export interface WorkflowStep {
  name: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  input?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface WorkflowExecution {
  executionId: string;
  workflowName: string;
  status: ExecutionStatus;
  steps: WorkflowStep[];
  input?: string;
  output?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  correlationId?: string;
}

interface UseWorkflowEventsOptions {
  pollingInterval?: number; // Default: 5000ms (5 seconds)
  maxExecutions?: number; // Default: 50
  onEvent?: (event: WorkflowExecutionEvent) => void;
}

export function useWorkflowEvents(options: UseWorkflowEventsOptions = {}) {
  const {
    pollingInterval = 5000,
    maxExecutions = 50,
    onEvent,
  } = options;

  const [executions, setExecutions] = useState<Map<string, WorkflowExecution>>(new Map());
  const [activeCount, setActiveCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"live" | "polling" | "disconnected">("disconnected");

  const lastEventTime = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isConnected, subscribe, unsubscribe } = useWebSocket();

  // Process incoming event
  const processEvent = useCallback((event: WorkflowExecutionEvent) => {
    setExecutions((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(event.executionId);

      if (event.eventType === "WORKFLOW_STARTED") {
        // Create new execution
        newMap.set(event.executionId, {
          executionId: event.executionId,
          workflowName: event.workflowName,
          status: "RUNNING",
          steps: [],
          input: event.input,
          startedAt: event.timestamp,
          correlationId: event.correlationId,
        });
      } else if (event.eventType === "WORKFLOW_COMPLETED") {
        if (existing) {
          newMap.set(event.executionId, {
            ...existing,
            status: "COMPLETED",
            output: event.output,
            completedAt: event.timestamp,
            durationMs: event.durationMs,
          });
        }
      } else if (event.eventType === "WORKFLOW_FAILED") {
        if (existing) {
          newMap.set(event.executionId, {
            ...existing,
            status: "FAILED",
            error: event.error,
            completedAt: event.timestamp,
            durationMs: event.durationMs,
          });
        }
      } else if (event.eventType === "STEP_STARTED" && existing) {
        const steps = [...existing.steps];
        // Check if step already exists (update) or is new
        const stepIndex = steps.findIndex((s) => s.name === event.stepName);
        if (stepIndex === -1) {
          steps.push({
            name: event.stepName!,
            status: "RUNNING",
            input: event.input,
            startedAt: event.timestamp,
          });
        } else {
          steps[stepIndex] = {
            ...steps[stepIndex],
            status: "RUNNING",
            input: event.input,
            startedAt: event.timestamp,
          };
        }
        newMap.set(event.executionId, { ...existing, steps });
      } else if (event.eventType === "STEP_COMPLETED" && existing) {
        const steps = existing.steps.map((s) =>
          s.name === event.stepName
            ? {
                ...s,
                status: "COMPLETED" as const,
                output: event.output,
                durationMs: event.durationMs,
                completedAt: event.timestamp,
              }
            : s
        );
        newMap.set(event.executionId, { ...existing, steps });
      } else if (event.eventType === "STEP_FAILED" && existing) {
        const steps = existing.steps.map((s) =>
          s.name === event.stepName
            ? {
                ...s,
                status: "FAILED" as const,
                error: event.error,
                durationMs: event.durationMs,
                completedAt: event.timestamp,
              }
            : s
        );
        newMap.set(event.executionId, { ...existing, steps });
      }

      // Keep only the most recent executions
      if (newMap.size > maxExecutions) {
        const sortedEntries = Array.from(newMap.entries())
          .sort((a, b) => new Date(b[1].startedAt).getTime() - new Date(a[1].startedAt).getTime())
          .slice(0, maxExecutions);
        return new Map(sortedEntries);
      }

      return newMap;
    });

    // Update active count
    setActiveCount((prev) => {
      if (event.eventType === "WORKFLOW_STARTED") return prev + 1;
      if (event.eventType === "WORKFLOW_COMPLETED" || event.eventType === "WORKFLOW_FAILED") {
        return Math.max(0, prev - 1);
      }
      return prev;
    });

    // Track last event time
    lastEventTime.current = event.timestamp;

    // Call user callback
    onEvent?.(event);
  }, [maxExecutions, onEvent]);

  // Poll for executions (fallback)
  const pollExecutions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/workflows/executions/active`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const activeExecutions = (await response.json()) as Array<{
        id: string;
        workflowName: string;
        status: string;
        createdAt: string;
        completedAt?: string;
        durationMs?: number;
        correlationId?: string;
        inputData?: string;
        outputData?: string;
        errorMessage?: string;
        steps?: Array<{
          stepName: string;
          status: string;
          inputData?: string;
          outputData?: string;
          errorMessage?: string;
          durationMs?: number;
          startedAt?: string;
          completedAt?: string;
        }>;
      }>;

      setExecutions((prev) => {
        const newMap = new Map(prev);

        activeExecutions.forEach((exec) => {
          // Map step events to the frontend format
          const steps: WorkflowStep[] = (exec.steps || []).map((step) => ({
            name: step.stepName,
            status: step.status as WorkflowStep["status"],
            input: step.inputData,
            output: step.outputData,
            error: step.errorMessage,
            durationMs: step.durationMs,
            startedAt: step.startedAt,
            completedAt: step.completedAt,
          }));

          // Always update with latest data from server
          newMap.set(exec.id, {
            executionId: exec.id,
            workflowName: exec.workflowName,
            status: exec.status as ExecutionStatus,
            steps,
            input: exec.inputData,
            output: exec.outputData,
            error: exec.errorMessage,
            startedAt: exec.createdAt,
            completedAt: exec.completedAt,
            durationMs: exec.durationMs,
            correlationId: exec.correlationId,
          });
        });

        return newMap;
      });

      setActiveCount(activeExecutions.filter((e) => e.status === "RUNNING").length);

      // Also fetch recent completed/failed executions
      const recentResponse = await fetch(`${API_BASE_URL}/admin/workflows/executions/recent?limit=50`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (recentResponse.ok) {
        const recentExecutions = (await recentResponse.json()) as Array<{
          id: string;
          workflowName: string;
          status: string;
          createdAt: string;
          completedAt?: string;
          durationMs?: number;
          correlationId?: string;
          inputData?: string;
          outputData?: string;
          errorMessage?: string;
          steps?: Array<{
            stepName: string;
            status: string;
            inputData?: string;
            outputData?: string;
            errorMessage?: string;
            durationMs?: number;
            startedAt?: string;
            completedAt?: string;
          }>;
        }>;

        setExecutions((prev) => {
          const newMap = new Map(prev);

          recentExecutions.forEach((exec) => {
            const steps: WorkflowStep[] = (exec.steps || []).map((step) => ({
              name: step.stepName,
              status: step.status as WorkflowStep["status"],
              input: step.inputData,
              output: step.outputData,
              error: step.errorMessage,
              durationMs: step.durationMs,
              startedAt: step.startedAt,
              completedAt: step.completedAt,
            }));

            newMap.set(exec.id, {
              executionId: exec.id,
              workflowName: exec.workflowName,
              status: exec.status as ExecutionStatus,
              steps,
              input: exec.inputData,
              output: exec.outputData,
              error: exec.errorMessage,
              startedAt: exec.createdAt,
              completedAt: exec.completedAt,
              durationMs: exec.durationMs,
              correlationId: exec.correlationId,
            });
          });

          return newMap;
        });
      }
    } catch (error) {
      console.error("Failed to poll workflow executions:", error);
    }
  }, []);

  // WebSocket subscription
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("live");
      setIsPolling(false);

      // Clear polling if we reconnect
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const subscription = subscribe("/topic/workflows", (message) => {
        const event = message as WorkflowExecutionEvent;
        processEvent(event);
      });

      return () => {
        if (subscription) {
          unsubscribe(subscription);
        }
      };
    } else {
      // Start polling as fallback
      setConnectionStatus("polling");
      setIsPolling(true);

      // Initial poll
      pollExecutions();

      // Set up polling interval
      pollingIntervalRef.current = setInterval(pollExecutions, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, subscribe, unsubscribe, processEvent, pollExecutions, pollingInterval]);

  // Initial load
  useEffect(() => {
    pollExecutions();
  }, [pollExecutions]);

  // Convert Map to array for easy rendering
  const executionsList = Array.from(executions.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const activeExecutions = executionsList.filter((e) => e.status === "RUNNING");
  const completedExecutions = executionsList.filter((e) => e.status !== "RUNNING");

  return {
    executions: executionsList,
    activeExecutions,
    completedExecutions,
    activeCount,
    isConnected,
    isPolling,
    connectionStatus,
    refresh: pollExecutions,
  };
}
