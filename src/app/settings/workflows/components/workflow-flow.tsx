"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionMode,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { WorkflowNode, type WorkflowNodeData, type StepStatus } from "./workflow-node";
import { WorkflowEdge } from "./workflow-edge";
import type { WorkflowExecution, WorkflowStep } from "@/hooks/use-workflow-events";

const nodeTypes: NodeTypes = {
  workflowStep: WorkflowNode,
};

const edgeTypes: EdgeTypes = {
  workflowEdge: WorkflowEdge,
};

interface WorkflowFlowProps {
  execution: WorkflowExecution | null;
  onNodeSelect?: (stepName: string | null) => void;
  selectedNode?: string | null;
}

// Convert workflow steps to React Flow nodes
function stepsToNodes(steps: WorkflowStep[], totalSteps: number): Node[] {
  if (steps.length === 0) return [];

  const nodeSpacing = 200;
  const startX = 50;
  const centerY = 150;

  // Add a "Start" node
  const nodes: Node[] = [
    {
      id: "start",
      type: "workflowStep",
      position: { x: startX, y: centerY },
      data: {
        label: "Start",
        status: "COMPLETED" as StepStatus,
        isFirst: true,
        isLast: false,
        stepIndex: -1,
        totalSteps: totalSteps,
      },
    },
  ];

  // Add step nodes
  steps.forEach((step, index) => {
    nodes.push({
      id: step.name,
      type: "workflowStep",
      position: { x: startX + (index + 1) * nodeSpacing, y: centerY },
      data: {
        label: step.name,
        status: step.status as StepStatus,
        durationMs: step.durationMs,
        isFirst: false,
        isLast: index === steps.length - 1,
        stepIndex: index,
        totalSteps: totalSteps,
      },
    });
  });

  return nodes;
}

// Convert workflow steps to React Flow edges
function stepsToEdges(steps: WorkflowStep[]): Edge[] {
  if (steps.length === 0) return [];

  const edges: Edge[] = [];

  // Edge from Start to first step
  edges.push({
    id: "start-to-0",
    source: "start",
    target: steps[0].name,
    type: "workflowEdge",
    data: {
      status: steps[0].status as StepStatus,
    },
  });

  // Edges between steps
  for (let i = 0; i < steps.length - 1; i++) {
    const currentStep = steps[i];
    const nextStep = steps[i + 1];

    // Edge status based on current step completion
    let edgeStatus: StepStatus = "PENDING";
    if (currentStep.status === "COMPLETED") {
      edgeStatus = nextStep.status === "PENDING" ? "RUNNING" : nextStep.status as StepStatus;
    } else if (currentStep.status === "RUNNING") {
      edgeStatus = "PENDING";
    } else if (currentStep.status === "FAILED") {
      edgeStatus = "FAILED";
    }

    edges.push({
      id: `${i}-to-${i + 1}`,
      source: currentStep.name,
      target: nextStep.name,
      type: "workflowEdge",
      data: {
        status: edgeStatus,
      },
    });
  }

  return edges;
}

export function WorkflowFlow({ execution, onNodeSelect, selectedNode }: WorkflowFlowProps) {
  const steps = execution?.steps ?? [];
  const totalSteps = steps.length;
  const executionId = execution?.executionId;

  // Create a stable key string that only changes when actual data changes
  const stepsSignature = steps.map(s => `${s.name}:${s.status}`).join("|");
  const dataKey = `${executionId ?? "none"}-${stepsSignature}`;

  // Store steps data in ref to access in effect without triggering it
  const stepsRef = useRef({ steps, totalSteps });
  stepsRef.current = { steps, totalSteps };

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update only when dataKey changes (primitive string comparison)
  useEffect(() => {
    const { steps: currentSteps, totalSteps: currentTotal } = stepsRef.current;
    setNodes(stepsToNodes(currentSteps, currentTotal));
    setEdges(stepsToEdges(currentSteps));
  }, [dataKey, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id !== "start") {
        onNodeSelect?.(node.id);
      }
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  if (!execution) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Execution Selected</div>
          <div className="text-sm">Select an execution from the list to view its flow</div>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No Steps Yet</div>
          <div className="text-sm">Workflow is starting...</div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      connectionMode={ConnectionMode.Loose}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.5}
      maxZoom={2}
      defaultEdgeOptions={{
        type: "workflowEdge",
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="bg-muted/30" />
      <Controls className="bg-background border rounded-lg shadow-sm" />
      <MiniMap
        className="bg-background border rounded-lg shadow-sm"
        nodeColor={(node) => {
          const data = node.data as unknown as WorkflowNodeData | undefined;
          const status = data?.status;
          switch (status) {
            case "COMPLETED":
              return "#22c55e";
            case "RUNNING":
              return "#3b82f6";
            case "FAILED":
              return "#ef4444";
            default:
              return "#a1a1aa";
          }
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
      />
    </ReactFlow>
  );
}
