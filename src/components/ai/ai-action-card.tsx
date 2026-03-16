"use client";

import {
  Navigation2,
  Plus,
  Tag,
  Bell,
  ShieldAlert,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  action: string;
  className?: string;
}

interface ActionMeta {
  icon: LucideIcon;
  label: string;
  color: string;
  bgColor: string;
}

const ACTION_META: Record<string, ActionMeta> = {
  "ui:navigate_to_page": {
    icon: Navigation2,
    label: "Navigated",
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
  },
  "ui:open_create_product_form": {
    icon: Plus,
    label: "Opened product form",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  "ui:open_create_discount_form": {
    icon: Tag,
    label: "Opened discount form",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  "ui:show_notification": {
    icon: Bell,
    label: "Sent notification",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  "ui:request_confirmation": {
    icon: ShieldAlert,
    label: "Awaiting confirmation",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
};

const DEFAULT_META: ActionMeta = {
  icon: Check,
  label: "Action completed",
  color: "text-muted-foreground",
  bgColor: "bg-muted/50",
};

export function ActionCard({ action, className }: ActionCardProps) {
  const meta = ACTION_META[action] || DEFAULT_META;
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
        "border-dashed",
        className
      )}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded",
          meta.bgColor
        )}
      >
        <Icon className={cn("h-3 w-3", meta.color)} />
      </div>
      <span className="text-muted-foreground">{meta.label}</span>
    </div>
  );
}
