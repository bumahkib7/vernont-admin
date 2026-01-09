"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface TopCategorySummary {
  category: string;
  sales: number;
}

interface TopCategoriesChartProps {
  data?: TopCategorySummary[];
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function TopCategoriesChart({ data = [] }: TopCategoriesChartProps) {
  // Convert cents to dollars for display
  const chartData = data.map(item => ({
    category: item.category,
    sales: item.sales / 100,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No category data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        accessibilityLayer
        margin={{ left: 20 }}
      >
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <YAxis
          dataKey="category"
          type="category"
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value) => [
                `$${Number(value).toLocaleString()}`,
                "Sales",
              ]}
            />
          }
        />
        <Bar
          dataKey="sales"
          fill="var(--color-sales)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
