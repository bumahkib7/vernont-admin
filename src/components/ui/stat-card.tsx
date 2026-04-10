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
const STAT_CARD_SURFACE =
  "rounded-lg border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] transition-shadow duration-200";

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
