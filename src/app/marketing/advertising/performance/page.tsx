"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import {
  BarChart3,
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
} from "lucide-react";

const metrics = [
  { title: "Total Spend", value: "$0.00", icon: DollarSign },
  { title: "Impressions", value: "0", icon: Eye },
  { title: "Clicks", value: "0", icon: MousePointer },
  { title: "ROAS", value: "0.00x", icon: TrendingUp },
];

export default function PerformancePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance</h1>
        <p className="text-muted-foreground mt-1">
          Cross-platform advertising performance metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
            title="No performance data"
            description="Connect an ad platform and create campaigns to see performance metrics here."
            action={{
              label: "Connect Platform",
              onClick: () => window.location.href = "/marketing/advertising",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
