"use client";

import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { OrdersTimePoint } from "@/hooks/use-analytics";

interface OrdersChartProps {
  data: OrdersTimePoint[];
}

const chartConfig = {
  orders: {
    label: "Orders",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function OrdersChart({ data }: OrdersChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No order data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart data={data} accessibilityLayer>
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
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [`${Number(value).toLocaleString()} orders`, ""]}
            />
          }
        />
        <Bar
          dataKey="orders"
          fill="var(--color-orders)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
