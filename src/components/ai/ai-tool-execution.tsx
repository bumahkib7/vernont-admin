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
  Navigation2,
  Plus,
  Bell,
  ShieldAlert,
  FolderPlus,
  Library,
  List,
  Mail,
  Gift,
  Megaphone,
  CalendarClock,
  Play,
  Pause,
  PieChart,
  UserPlus,
  FileText,
  Truck,
  PackageCheck,
  CheckCircle2,
  Globe,
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
  get_product: {
    icon: Eye,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  unpublish_product: {
    icon: Ban,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  delete_product: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  create_product: {
    icon: Plus,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  create_discount: {
    icon: Tag,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  create_category: {
    icon: FolderPlus,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  create_collection: {
    icon: Library,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
  },
  list_categories: {
    icon: List,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  list_collections: {
    icon: List,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
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
  "ui:navigate_to_page": {
    icon: Navigation2,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
  "ui:open_create_product_form": {
    icon: Plus,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  "ui:open_create_discount_form": {
    icon: Tag,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  "ui:show_notification": {
    icon: Bell,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  "ui:request_confirmation": {
    icon: ShieldAlert,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  // Marketing tools
  create_campaign: {
    icon: Megaphone,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  schedule_campaign: {
    icon: CalendarClock,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  start_campaign: {
    icon: Play,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  pause_campaign: {
    icon: Pause,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  get_campaign_analytics: {
    icon: PieChart,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  list_campaigns: {
    icon: Megaphone,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
  },
  create_customer_segment: {
    icon: UserPlus,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  list_customer_segments: {
    icon: Users,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  preview_segment: {
    icon: Eye,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
  },
  send_customer_email: {
    icon: Mail,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  send_gift_card: {
    icon: Gift,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
  },
  // Commerce tools
  create_draft_order: {
    icon: FileText,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  add_draft_order_item: {
    icon: Plus,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  convert_draft_to_order: {
    icon: ShoppingCart,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  send_draft_invoice: {
    icon: Mail,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  cancel_draft_order: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  list_draft_orders: {
    icon: FileText,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  get_draft_order: {
    icon: FileText,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
  },
  fulfill_order: {
    icon: PackageCheck,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  ship_order: {
    icon: Truck,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  complete_order: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  get_shipping_rates: {
    icon: Truck,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
  },
  track_shipment: {
    icon: Truck,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/20",
  },
  void_shipping_label: {
    icon: Ban,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  publish_product: {
    icon: Globe,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
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
