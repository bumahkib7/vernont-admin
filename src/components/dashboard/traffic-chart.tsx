"use client";

import { Pie, PieChart, Cell, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { name: "Organic Search", value: 4200, fill: "#3b82f6" },
  { name: "Direct", value: 2800, fill: "#22c55e" },
  { name: "Social Media", value: 1900, fill: "#a855f7" },
  { name: "Referral", value: 1200, fill: "#f59e0b" },
  { name: "Email", value: 800, fill: "#ec4899" },
];

const chartConfig = {
  organic: {
    label: "Organic Search",
    color: "#3b82f6",
  },
  direct: {
    label: "Direct",
    color: "#22c55e",
  },
  social: {
    label: "Social Media",
    color: "#a855f7",
  },
  referral: {
    label: "Referral",
    color: "#f59e0b",
  },
  email: {
    label: "Email",
    color: "#ec4899",
  },
} satisfies ChartConfig;

export function TrafficChart() {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => [
                `${Number(value).toLocaleString()} visitors`,
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
          innerRadius={50}
          outerRadius={80}
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
