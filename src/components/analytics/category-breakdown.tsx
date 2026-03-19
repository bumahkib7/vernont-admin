"use client";

import { Pie, PieChart, Cell, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CategoryRevenue } from "@/hooks/use-analytics";

interface CategoryBreakdownProps {
  data: CategoryRevenue[];
}

const COLORS = ["#3b82f6", "#22c55e", "#a855f7", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#84cc16"];

import { formatCurrency } from "@/lib/format";

const chartConfig = {
  revenue: {
    label: "Revenue",
  },
} satisfies ChartConfig;

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No category data available
      </div>
    );
  }

  const chartData = data.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                `${formatCurrency(Number(value))} (${data.find(d => d.name === name)?.percentage ?? 0}%)`,
                name,
              ]}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="revenue"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ChartContainer>
  );
}
