"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { RevenueTimePoint } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/format";

interface RevenueChartProps {
  data: RevenueTimePoint[];
  compare?: boolean;
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  previousRevenue: {
    label: "Previous Period",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function RevenueChart({ data, compare = false }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No revenue data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 100000).toFixed(0)}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [formatCurrency(Number(value)), ""]}
            />
          }
        />
        {compare && (
          <ChartLegend content={<ChartLegendContent />} />
        )}
        <Line
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        {compare && (
          <Line
            dataKey="previousRevenue"
            type="monotone"
            stroke="var(--color-previousRevenue)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
