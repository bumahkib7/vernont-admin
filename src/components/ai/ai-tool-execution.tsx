"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Eye,
  ShoppingCart,
  XCircle,
  RefreshCw,
  Package,
  Users,
  BarChart3,
  TrendingUp,
  Box,
  ArrowDownUp,
  Tag,
  RotateCcw,
  Ban,
  DollarSign,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ToolActivity, getToolLabel } from "@/hooks/use-ai-chat";

interface ToolMeta {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TOOL_META: Record<string, ToolMeta> = {
  search_orders: {
    icon: Search,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  get_order: {
    icon: Eye,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  cancel_order: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  update_order_status: {
    icon: RefreshCw,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  search_customers: {
    icon: Users,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  get_customer_profile: {
    icon: Users,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  get_daily_summary: {
    icon: BarChart3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  get_revenue_report: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  get_analytics: {
    icon: BarChart3,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  get_low_stock_report: {
    icon: Box,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  update_stock: {
    icon: ArrowDownUp,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  search_products: {
    icon: Package,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  update_product: {
    icon: Tag,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  list_returns: {
    icon: RotateCcw,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  get_return: {
    icon: RotateCcw,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  receive_return: {
    icon: ShoppingCart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/20",
  },
  process_return_refund: {
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  reject_return: {
    icon: Ban,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
};

const DEFAULT_META: ToolMeta = {
  icon: Zap,
  color: "text-muted-foreground",
  bgColor: "bg-muted/50",
  borderColor: "border-border",
};

function getToolMeta(toolName: string): ToolMeta {
  return TOOL_META[toolName] || DEFAULT_META;
}

export function ToolExecutionCard({ activity }: { activity: ToolActivity }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(activity.toolName);
  const Icon = meta.icon;
  const isExecuting = activity.status === "executing";
  const isComplete = activity.status === "complete";
  const isError = activity.status === "error";

  return (
    <div
      className={cn(
        "group relative rounded-lg border transition-all duration-300",
        meta.borderColor,
        isExecuting && "agent-tool-executing",
        isComplete && "border-green-500/20",
        isError && "border-red-500/20"
      )}
    >
      <button
        onClick={() => !isExecuting && setExpanded(!expanded)}
        disabled={isExecuting}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
      >
        {/* Icon */}
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
            meta.bgColor
          )}
        >
          {isExecuting ? (
            <Loader2 className={cn("h-3.5 w-3.5 animate-spin", meta.color)} />
          ) : (
            <Icon className={cn("h-3.5 w-3.5", meta.color)} />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium truncate">
              {getToolLabel(activity.toolName)}
            </span>
            {isExecuting && (
              <span className="agent-shimmer-text text-[10px] text-muted-foreground">
                running
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {activity.toolName}
          </span>
        </div>

        {/* Status */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isComplete && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="h-3.5 w-3.5" />
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </div>
          )}
          {isError && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-[10px]">Failed</span>
            </div>
          )}
          {isExecuting && (
            <div className="agent-pulse-dot" />
          )}
        </div>
      </button>

      {/* Executing shimmer bar */}
      {isExecuting && (
        <div className="h-0.5 w-full overflow-hidden rounded-b-lg">
          <div className="agent-shimmer-bar h-full" />
        </div>
      )}
    </div>
  );
}

/** Renders a group of tool activities as a vertical stack */
export function ToolExecutionGroup({
  activities,
}: {
  activities: ToolActivity[];
}) {
  if (!activities.length) return null;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {activities.map((activity) => (
        <ToolExecutionCard key={activity.toolId} activity={activity} />
      ))}
    </div>
  );
}
