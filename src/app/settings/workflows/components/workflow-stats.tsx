"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Label,
} from "recharts";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { WorkflowExecution } from "@/hooks/use-workflow-events";

interface WorkflowStatsProps {
  executions: WorkflowExecution[];
}

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(142 76% 36%)",
  },
  failed: {
    label: "Failed",
    color: "hsl(0 84% 60%)",
  },
  running: {
    label: "Running",
    color: "hsl(217 91% 60%)",
  },
  avgMs: {
    label: "Avg Duration",
    color: "hsl(262 83% 58%)",
  },
  failures: {
    label: "Failures",
    color: "hsl(0 84% 60%)",
  },
} satisfies ChartConfig;

export function WorkflowStats({ executions }: WorkflowStatsProps) {
  const stats = useMemo(() => {
    const completed = executions.filter((e) => e.status === "COMPLETED").length;
    const failed = executions.filter((e) => e.status === "FAILED").length;
    const running = executions.filter((e) => e.status === "RUNNING").length;
    const total = executions.length;

    const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

    // Average duration (only completed)
    const completedWithDuration = executions.filter(
      (e) => e.status === "COMPLETED" && e.durationMs
    );
    const avgDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum, e) => sum + (e.durationMs || 0), 0) /
          completedWithDuration.length
        : 0;

    // Slowest steps across all executions
    const stepDurations: Record<string, { total: number; count: number }> = {};
    executions.forEach((exec) => {
      exec.steps.forEach((step) => {
        if (step.durationMs && step.status === "COMPLETED") {
          if (!stepDurations[step.name]) {
            stepDurations[step.name] = { total: 0, count: 0 };
          }
          stepDurations[step.name].total += step.durationMs;
          stepDurations[step.name].count += 1;
        }
      });
    });

    const slowestSteps = Object.entries(stepDurations)
      .map(([name, data]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        fullName: name,
        avgMs: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, 5);

    // Failed steps frequency
    const failedSteps: Record<string, number> = {};
    executions.forEach((exec) => {
      exec.steps.forEach((step) => {
        if (step.status === "FAILED") {
          failedSteps[step.name] = (failedSteps[step.name] || 0) + 1;
        }
      });
    });

    const errorHotspots = Object.entries(failedSteps)
      .map(([name, count]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "..." : name,
        fullName: name,
        failures: count,
      }))
      .sort((a, b) => b.failures - a.failures)
      .slice(0, 5);

    // Executions by workflow
    const byWorkflow: Record<string, { completed: number; failed: number; running: number }> = {};
    executions.forEach((exec) => {
      if (!byWorkflow[exec.workflowName]) {
        byWorkflow[exec.workflowName] = { completed: 0, failed: 0, running: 0 };
      }
      if (exec.status === "COMPLETED") byWorkflow[exec.workflowName].completed++;
      else if (exec.status === "FAILED") byWorkflow[exec.workflowName].failed++;
      else if (exec.status === "RUNNING") byWorkflow[exec.workflowName].running++;
    });

    const workflowBreakdown = Object.entries(byWorkflow).map(([name, counts]) => ({
      name: name.length > 18 ? name.substring(0, 18) + "..." : name,
      fullName: name,
      ...counts,
    }));

    // Status distribution for pie chart
    const statusDistribution = [
      { name: "completed", value: completed, fill: "var(--color-completed)" },
      { name: "failed", value: failed, fill: "var(--color-failed)" },
      { name: "running", value: running, fill: "var(--color-running)" },
    ].filter((d) => d.value > 0);

    return {
      completed,
      failed,
      running,
      total,
      successRate,
      avgDuration,
      slowestSteps,
      errorHotspots,
      workflowBreakdown,
      statusDistribution,
    };
  }, [executions]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Executions</p>
                <p className="text-3xl font-bold tracking-tight">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Success Rate</p>
                <p className="text-3xl font-bold tracking-tight">{stats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Failed</p>
                <p className="text-3xl font-bold tracking-tight">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Avg Duration</p>
                <p className="text-3xl font-bold tracking-tight">
                  {stats.avgDuration > 0
                    ? `${(stats.avgDuration / 1000).toFixed(1)}s`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card className="flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">Status Distribution</CardTitle>
            <CardDescription>Breakdown by execution status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            {stats.statusDistribution.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[250px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {stats.total}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground text-sm"
                              >
                                Total
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="name" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflows Breakdown */}
        <Card className="flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-base">By Workflow</CardTitle>
            <CardDescription>Executions per workflow type</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.workflowBreakdown.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart
                  data={stats.workflowBreakdown}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <XAxis type="number" hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="running" stackId="a" fill="var(--color-running)" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slowest Steps */}
        <Card className="flex flex-col">
          <CardHeader className="pb-0">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Slowest Steps</CardTitle>
            </div>
            <CardDescription>Average duration by step</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {stats.slowestSteps.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart
                  data={stats.slowestSteps}
                  layout="vertical"
                  margin={{ left: 0, right: 16 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `${v}ms`}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${value}ms`, "Avg Duration"]}
                      />
                    }
                  />
                  <Bar
                    dataKey="avgMs"
                    fill="var(--color-avgMs)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No step data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Hotspots */}
      {stats.errorHotspots.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">Error Hotspots</CardTitle>
            </div>
            <CardDescription>Steps with the most failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.errorHotspots.map((step, i) => (
                <div
                  key={step.fullName}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500 font-semibold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={step.fullName}>
                      {step.fullName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{
                            width: `${Math.min((step.failures / stats.errorHotspots[0].failures) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground font-mono min-w-[60px] text-right">
                        {step.failures} {step.failures === 1 ? "failure" : "failures"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
