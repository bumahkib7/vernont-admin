"use client";

import { Pie, PieChart, Cell, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { name: "Completed", value: 1420, fill: "#22c55e" },
  { name: "Processing", value: 580, fill: "#3b82f6" },
  { name: "Pending", value: 280, fill: "#eab308" },
  { name: "Cancelled", value: 70, fill: "#ef4444" },
];

const chartConfig = {
  completed: {
    label: "Completed",
    color: "#22c55e",
  },
  processing: {
    label: "Processing",
    color: "#3b82f6",
  },
  pending: {
    label: "Pending",
    color: "#eab308",
  },
  cancelled: {
    label: "Cancelled",
    color: "#ef4444",
  },
} satisfies ChartConfig;

export function OrderStatusChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} orders`,
                name,
              ]}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
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
            <span className="text-sm text-muted-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ChartContainer>
  );
}
