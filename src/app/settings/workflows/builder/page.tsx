"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Save,
  Play,
  Zap,
  GitBranch,
  Mail,
  Tag,
  ShoppingCart,
  Package,
  Users,
  Clock,
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

// ====== Node Types ======

type TriggerType =
  | "order_placed"
  | "order_fulfilled"
  | "customer_created"
  | "product_low_stock"
  | "cart_abandoned"
  | "subscription_created"
  | "claim_opened"
  | "manual";

type ConditionOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "contains";

type ActionType =
  | "send_email"
  | "add_tag"
  | "remove_tag"
  | "create_discount"
  | "notify_admin"
  | "update_inventory"
  | "assign_to"
  | "wait";

interface TriggerNodeData {
  label: string;
  triggerType: TriggerType;
  [key: string]: unknown;
}

interface ConditionNodeData {
  label: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  [key: string]: unknown;
}

interface ActionNodeData {
  label: string;
  actionType: ActionType;
  config: Record<string, string>;
  [key: string]: unknown;
}

type BuilderNodeData = TriggerNodeData | ConditionNodeData | ActionNodeData;

const TRIGGER_OPTIONS: { value: TriggerType; label: string; icon: typeof ShoppingCart }[] = [
  { value: "order_placed", label: "Order Placed", icon: ShoppingCart },
  { value: "order_fulfilled", label: "Order Fulfilled", icon: Package },
  { value: "customer_created", label: "New Customer", icon: Users },
  { value: "product_low_stock", label: "Low Stock", icon: AlertTriangle },
  { value: "cart_abandoned", label: "Cart Abandoned", icon: ShoppingCart },
  { value: "subscription_created", label: "New Subscription", icon: Zap },
  { value: "claim_opened", label: "Claim Opened", icon: AlertTriangle },
  { value: "manual", label: "Manual Trigger", icon: Play },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: typeof Mail }[] = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "add_tag", label: "Add Tag", icon: Tag },
  { value: "remove_tag", label: "Remove Tag", icon: Tag },
  { value: "create_discount", label: "Create Discount", icon: Zap },
  { value: "notify_admin", label: "Notify Admin", icon: Mail },
  { value: "update_inventory", label: "Update Inventory", icon: Package },
  { value: "assign_to", label: "Assign To", icon: Users },
  { value: "wait", label: "Wait/Delay", icon: Clock },
];

// ====== Custom Nodes ======

function TriggerNode({ data }: { data: TriggerNodeData }) {
  const trigger = TRIGGER_OPTIONS.find((t) => t.value === data.triggerType);
  const Icon = trigger?.icon ?? Zap;
  return (
    <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 rounded-lg px-4 py-3 min-w-[180px] shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 dark:bg-blue-950/30 rounded p-1">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold text-blue-500 tracking-wider">Trigger</p>
          <p className="text-sm font-medium text-blue-900">{data.label}</p>
        </div>
      </div>
    </div>
  );
}

function ConditionNode({ data }: { data: ConditionNodeData }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 rounded-lg px-4 py-3 min-w-[180px] shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-amber-100 dark:bg-amber-950/30 rounded p-1">
          <GitBranch className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold text-amber-500 tracking-wider">Condition</p>
          <p className="text-sm font-medium text-amber-900">{data.label}</p>
        </div>
      </div>
      {data.field && (
        <p className="text-xs text-amber-700 mt-1 ml-8">
          {data.field} {data.operator} {data.value}
        </p>
      )}
    </div>
  );
}

function ActionNode({ data }: { data: ActionNodeData }) {
  const action = ACTION_OPTIONS.find((a) => a.value === data.actionType);
  const Icon = action?.icon ?? Zap;
  return (
    <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-300 rounded-lg px-4 py-3 min-w-[180px] shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-green-100 dark:bg-green-950/30 rounded p-1">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] uppercase font-semibold text-green-500 tracking-wider">Action</p>
          <p className="text-sm font-medium text-green-900">{data.label}</p>
        </div>
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode as unknown as NodeTypes[string],
  condition: ConditionNode as unknown as NodeTypes[string],
  action: ActionNode as unknown as NodeTypes[string],
};

// ====== Templates ======

interface WorkflowTemplate {
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
}

const TEMPLATES: WorkflowTemplate[] = [
  {
    name: "Tag VIP Customers",
    description: "Automatically tag customers who spend over $500",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Order Placed", triggerType: "order_placed" } },
      { id: "c1", type: "condition", position: { x: 250, y: 180 }, data: { label: "Order > $500", field: "order.total", operator: "greater_than", value: "500" } },
      { id: "a1", type: "action", position: { x: 250, y: 310 }, data: { label: 'Add "VIP" Tag', actionType: "add_tag", config: { tag: "VIP" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "c1", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e2", source: "c1", target: "a1", label: "Yes", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
  {
    name: "Low Stock Alert",
    description: "Notify admin when product stock drops below threshold",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Low Stock", triggerType: "product_low_stock" } },
      { id: "a1", type: "action", position: { x: 250, y: 180 }, data: { label: "Notify Admin", actionType: "notify_admin", config: { channel: "email" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
  {
    name: "Abandoned Cart Recovery",
    description: "Send recovery emails for abandoned carts",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Cart Abandoned", triggerType: "cart_abandoned" } },
      { id: "a1", type: "action", position: { x: 250, y: 180 }, data: { label: "Wait 1 Hour", actionType: "wait", config: { duration: "1h" } } },
      { id: "a2", type: "action", position: { x: 250, y: 310 }, data: { label: "Send Recovery Email", actionType: "send_email", config: { template: "cart_recovery" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e2", source: "a1", target: "a2", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
  {
    name: "Auto-fulfill Digital Orders",
    description: "Automatically fulfill orders with only digital products",
    nodes: [
      { id: "t1", type: "trigger", position: { x: 250, y: 50 }, data: { label: "Order Placed", triggerType: "order_placed" } },
      { id: "c1", type: "condition", position: { x: 250, y: 180 }, data: { label: "All Digital?", field: "order.items.all_digital", operator: "equals", value: "true" } },
      { id: "a1", type: "action", position: { x: 250, y: 310 }, data: { label: "Send Email", actionType: "send_email", config: { template: "digital_delivery" } } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "c1", markerEnd: { type: MarkerType.ArrowClosed } },
      { id: "e2", source: "c1", target: "a1", label: "Yes", markerEnd: { type: MarkerType.ArrowClosed } },
    ],
  },
];

// ====== Main Page ======

export default function WorkflowBuilderPage() {
  const router = useRouter();
  const idCounter = useRef(1);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)
      );
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: "trigger" | "condition" | "action", data: BuilderNodeData) => {
      const id = `node_${idCounter.current++}`;
      const y = nodes.length * 130 + 50;
      const newNode: Node = {
        id,
        type,
        position: { x: 250, y },
        data,
      };
      setNodes((nds) => [...nds, newNode]);
      setShowTemplates(false);
    },
    [nodes.length, setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
      setSheetOpen(false);
    },
    [setNodes, setEdges]
  );

  const loadTemplate = useCallback(
    (template: WorkflowTemplate) => {
      setWorkflowName(template.name);
      setNodes(template.nodes);
      setEdges(template.edges);
      setShowTemplates(false);
      idCounter.current = template.nodes.length + 1;
    },
    [setNodes, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSheetOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const workflow = {
      name: workflowName,
      nodes: nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label })),
    };
    // TODO: POST to /admin/workflows when backend endpoint exists
    alert("Workflow saved! (Backend integration pending)");
  }, [workflowName, nodes, edges]);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings/workflows")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-64 h-8 text-sm font-medium"
          />
          <Badge variant="outline" className="text-xs">Draft</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            Save
          </Button>
          <Button size="sm" disabled={nodes.length === 0}>
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Test Run
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar - Node Palette */}
        <div className="w-64 border-r bg-muted/30 p-4 space-y-4 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Triggers</h3>
            <div className="space-y-1">
              {TRIGGER_OPTIONS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-700 transition-colors text-left"
                    onClick={() =>
                      addNode("trigger", { label: t.label, triggerType: t.value })
                    }
                  >
                    <Icon className="h-3.5 w-3.5 text-blue-500" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Conditions</h3>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 transition-colors text-left"
              onClick={() =>
                addNode("condition", { label: "If/Then", field: "", operator: "equals", value: "" })
              }
            >
              <GitBranch className="h-3.5 w-3.5 text-amber-500" />
              If/Then Condition
            </button>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Actions</h3>
            <div className="space-y-1">
              {ACTION_OPTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.value}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-green-50 dark:hover:bg-green-950/20 hover:text-green-700 transition-colors text-left"
                    onClick={() =>
                      addNode("action", { label: a.label, actionType: a.value, config: {} })
                    }
                  >
                    <Icon className="h-3.5 w-3.5 text-green-500" />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          {showTemplates && nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
              <div className="max-w-2xl w-full p-8">
                <h2 className="text-lg font-semibold mb-1">Start with a template</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Pick a pre-built workflow or start from scratch using the palette on the left.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES.map((t) => (
                    <Card
                      key={t.name}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => loadTemplate(t)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{t.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">
                            {t.nodes.length} nodes
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center mt-6">
                  <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                    Start from scratch
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
          >
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              nodeColor={(n) => {
                if (n.type === "trigger") return "#93c5fd";
                if (n.type === "condition") return "#fcd34d";
                return "#86efac";
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node config sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[360px]">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              Configure Node
              {selectedNode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>
          {selectedNode && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Label</label>
                <Input
                  value={(selectedNode.data as BuilderNodeData).label}
                  onChange={(e) => {
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: e.target.value } }
                          : n
                      )
                    );
                    setSelectedNode((prev) =>
                      prev ? { ...prev, data: { ...prev.data, label: e.target.value } } : prev
                    );
                  }}
                  className="mt-1.5"
                />
              </div>

              {selectedNode.type === "trigger" && (
                <div>
                  <label className="text-sm font-medium">Trigger Event</label>
                  <Select
                    value={(selectedNode.data as TriggerNodeData).triggerType}
                    onValueChange={(v) => {
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, triggerType: v } }
                            : n
                        )
                      );
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedNode.type === "condition" && (
                <>
                  <div>
                    <label className="text-sm font-medium">Field</label>
                    <Input
                      value={(selectedNode.data as ConditionNodeData).field}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, field: e.target.value } }
                              : n
                          )
                        );
                      }}
                      placeholder="e.g., order.total"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Operator</label>
                    <Select
                      value={(selectedNode.data as ConditionNodeData).operator}
                      onValueChange={(v) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, operator: v } }
                              : n
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="not_equals">Not Equals</SelectItem>
                        <SelectItem value="greater_than">Greater Than</SelectItem>
                        <SelectItem value="less_than">Less Than</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Value</label>
                    <Input
                      value={(selectedNode.data as ConditionNodeData).value}
                      onChange={(e) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, value: e.target.value } }
                              : n
                          )
                        );
                      }}
                      placeholder="e.g., 500"
                      className="mt-1.5"
                    />
                  </div>
                </>
              )}

              {selectedNode.type === "action" && (
                <div>
                  <label className="text-sm font-medium">Action Type</label>
                  <Select
                    value={(selectedNode.data as ActionNodeData).actionType}
                    onValueChange={(v) => {
                      const label = ACTION_OPTIONS.find((a) => a.value === v)?.label ?? v;
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, actionType: v, label } }
                            : n
                        )
                      );
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Node ID: {selectedNode.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Type: {selectedNode.type}
                </p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
