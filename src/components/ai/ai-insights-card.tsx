"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  RefreshCw,
  TrendingUp,
  Package,
  Megaphone,
  Users,
  ChevronRight,
} from "lucide-react";
import { getAiInsights, refreshAiInsights, type AiInsight } from "@/lib/api";

const TYPE_CONFIG: Record<
  AiInsight["type"],
  { icon: typeof TrendingUp; color: string }
> = {
  sales: { icon: TrendingUp, color: "text-blue-600" },
  inventory: { icon: Package, color: "text-orange-600" },
  marketing: { icon: Megaphone, color: "text-purple-600" },
  customer: { icon: Users, color: "text-emerald-600" },
};

const PRIORITY_BADGE: Record<
  AiInsight["priority"],
  { variant: "default" | "secondary" | "outline"; className: string }
> = {
  high: {
    variant: "default",
    className: "bg-red-50 text-red-700 border-red-200 font-normal",
  },
  medium: {
    variant: "default",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200 font-normal",
  },
  low: {
    variant: "default",
    className: "bg-green-50 text-green-700 border-green-200 font-normal",
  },
};

function InsightSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-8 w-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function AiInsightsCard() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setError(null);
      const result = await getAiInsights();
      setInsights(result.insights);
    } catch (err) {
      console.error("[AI Insights] Failed to fetch:", err);
      setError("Failed to load insights");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const result = await refreshAiInsights();
      setInsights(result.insights);
    } catch (err) {
      console.error("[AI Insights] Failed to refresh:", err);
      setError("Failed to refresh insights");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="py-0">
      <CardHeader className="py-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">AI Insights</CardTitle>
        </div>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden">
        <div className="max-h-[280px] overflow-y-auto">
          <div className="divide-y">
            {isLoading ? (
              <>
                <InsightSkeleton />
                <InsightSkeleton />
                <InsightSkeleton />
              </>
            ) : error ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {error}
              </div>
            ) : insights.length === 0 ? (
              <div className="p-6 text-center">
                <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No insights yet. Check back after you have some sales data.
                </p>
              </div>
            ) : (
              insights.map((insight) => {
                const config = TYPE_CONFIG[insight.type];
                const Icon = config.icon;
                const badge = PRIORITY_BADGE[insight.priority];

                const content = (
                  <div className="flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors group">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {insight.title}
                        </span>
                        <Badge className={badge.className}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {insight.description}
                      </p>
                    </div>
                    {insight.actionUrl && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                );

                if (insight.actionUrl) {
                  return (
                    <Link
                      key={insight.id}
                      href={insight.actionUrl}
                      className="block"
                    >
                      {content}
                    </Link>
                  );
                }

                return <div key={insight.id}>{content}</div>;
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
