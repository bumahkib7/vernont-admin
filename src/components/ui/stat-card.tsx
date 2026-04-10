"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down"; value: string; label?: string };
  subtitle?: string;
  loading?: boolean;
}

// Matches the Card primitive's raised treatment so stat cards on the
// dashboard feel like first-class surfaces rather than flat rectangles.
// Same shadow recipe as Card: crisp 3px bottom edge + layered ambient halo,
// bigger lift on hover.
const STAT_CARD_SURFACE =
  "rounded-lg border bg-card p-6 " +
  "shadow-[0_3px_0_-1px_rgba(17,24,39,0.04),0_12px_24px_-8px_rgba(17,24,39,0.12),0_4px_8px_-4px_rgba(17,24,39,0.08)] " +
  "hover:shadow-[0_4px_0_-1px_rgba(17,24,39,0.06),0_20px_40px_-12px_rgba(17,24,39,0.18),0_8px_16px_-6px_rgba(17,24,39,0.1)] " +
  "transition-shadow duration-200";

function StatCardSkeleton() {
  return (
    <div className={STAT_CARD_SURFACE}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
      <div className="mt-3">
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="mt-2">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return <StatCardSkeleton />;
  }

  return (
    <div className={STAT_CARD_SURFACE}>
      <div className="flex items-center justify-between">
        <span className="text-small-regular text-muted-foreground">{title}</span>
        {icon && (
          <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3">
        <span className="text-2xl-semi">{value}</span>
      </div>
      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-1 text-small-regular">
          {trend && (
            <>
              {trend.direction === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              )}
              <span
                className={cn(
                  trend.direction === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {trend.value}
              </span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </>
          )}
          {!trend && subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

export { StatCard, StatCardSkeleton };
export type { StatCardProps };
