"use client";

import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { CustomerAcquisitionPoint } from "@/hooks/use-analytics";

interface CustomerAcquisitionChartProps {
  data: CustomerAcquisitionPoint[];
}

const chartConfig = {
  newCustomers: {
    label: "New Customers",
    color: "hsl(var(--chart-1))",
  },
  returningCustomers: {
    label: "Returning Customers",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

export function CustomerAcquisitionChart({ data }: CustomerAcquisitionChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No customer data available
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <AreaChart data={data} accessibilityLayer>
        <defs>
          <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-newCustomers)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-newCustomers)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillReturning" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-returningCustomers)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-returningCustomers)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="returningCustomers"
          type="monotone"
          fill="url(#fillReturning)"
          stroke="var(--color-returningCustomers)"
          strokeWidth={2}
          stackId="a"
        />
        <Area
          dataKey="newCustomers"
          type="monotone"
          fill="url(#fillNew)"
          stroke="var(--color-newCustomers)"
          strokeWidth={2}
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
}
