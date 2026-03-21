"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "pending";

const STATUS_STYLES: Record<StatusType, string> = {
  success:
    "!bg-emerald-50 !text-emerald-700 !border-emerald-200 dark:!bg-emerald-900/40 dark:!text-emerald-300 dark:!border-emerald-700",
  warning:
    "!bg-amber-50 !text-amber-700 !border-amber-200 dark:!bg-amber-900/40 dark:!text-amber-300 dark:!border-amber-700",
  error:
    "!bg-red-50 !text-red-700 !border-red-200 dark:!bg-red-900/40 dark:!text-red-300 dark:!border-red-700",
  info: "!bg-blue-50 !text-blue-700 !border-blue-200 dark:!bg-blue-900/40 dark:!text-blue-300 dark:!border-blue-700",
  neutral:
    "!bg-gray-100 !text-gray-700 !border-gray-200 dark:!bg-gray-800/40 dark:!text-gray-300 dark:!border-gray-600",
  pending:
    "!bg-orange-50 !text-orange-700 !border-orange-200 dark:!bg-orange-900/40 dark:!text-orange-300 dark:!border-orange-700",
};

const DOT_STYLES: Record<StatusType, string> = {
  success: "bg-emerald-500 dark:bg-emerald-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  error: "bg-red-500 dark:bg-red-400",
  info: "bg-blue-500 dark:bg-blue-400",
  neutral: "bg-gray-500 dark:bg-gray-400",
  pending: "bg-orange-500 dark:bg-orange-400",
};

// Map domain statuses to status types
const ORDER_STATUS_MAP: Record<string, StatusType> = {
  pending: "pending",
  processing: "info",
  completed: "success",
  shipped: "info",
  canceled: "error",
  cancelled: "error",
  archived: "neutral",
  requires_action: "warning",
};

const PRODUCT_STATUS_MAP: Record<string, StatusType> = {
  published: "success",
  draft: "neutral",
  proposed: "info",
  rejected: "error",
};

const PAYMENT_STATUS_MAP: Record<string, StatusType> = {
  captured: "success",
  authorized: "info",
  pending: "pending",
  refunded: "warning",
  partially_refunded: "warning",
  failed: "error",
  not_paid: "neutral",
  awaiting: "pending",
};

const FULFILLMENT_STATUS_MAP: Record<string, StatusType> = {
  fulfilled: "success",
  not_fulfilled: "neutral",
  partially_fulfilled: "warning",
  shipped: "info",
  delivered: "success",
  returned: "error",
};

const RETURN_STATUS_MAP: Record<string, StatusType> = {
  requested: "pending",
  received: "info",
  refunded: "success",
  rejected: "error",
};

const REVIEW_STATUS_MAP: Record<string, StatusType> = {
  pending: "pending",
  approved: "success",
  rejected: "error",
  flagged: "warning",
  hidden: "neutral",
};

const STATUS_MAP_BY_TYPE: Record<string, Record<string, StatusType>> = {
  order: ORDER_STATUS_MAP,
  product: PRODUCT_STATUS_MAP,
  payment: PAYMENT_STATUS_MAP,
  fulfillment: FULFILLMENT_STATUS_MAP,
  return: RETURN_STATUS_MAP,
  review: REVIEW_STATUS_MAP,
};

function formatStatusText(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusBadgeProps {
  status: string;
  type:
    | "order"
    | "product"
    | "payment"
    | "fulfillment"
    | "return"
    | "review"
    | "custom";
  className?: string;
  dot?: boolean;
}

function StatusBadge({ status, type, className, dot = false }: StatusBadgeProps) {
  let statusType: StatusType = "neutral";

  if (type === "custom") {
    // For custom type, treat the status string as a StatusType directly if valid
    if (status in STATUS_STYLES) {
      statusType = status as StatusType;
    }
  } else {
    const map = STATUS_MAP_BY_TYPE[type];
    if (map) {
      statusType = map[status.toLowerCase()] ?? "neutral";
    }
  }

  const styles = STATUS_STYLES[statusType];

  return (
    <Badge
      variant="outline"
      className={cn(
        styles,
        "font-normal",
        dot && "flex items-center gap-1.5",
        className
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", DOT_STYLES[statusType])}
        />
      )}
      {formatStatusText(status)}
    </Badge>
  );
}

export {
  StatusBadge,
  ORDER_STATUS_MAP,
  PRODUCT_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  FULFILLMENT_STATUS_MAP,
  RETURN_STATUS_MAP,
  REVIEW_STATUS_MAP,
  STATUS_STYLES,
};
export type { StatusType, StatusBadgeProps };
