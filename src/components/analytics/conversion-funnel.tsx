"use client";

import type { FunnelStep } from "@/hooks/use-analytics";

interface ConversionFunnelProps {
  data: FunnelStep[];
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  if (data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">
        No funnel data available
      </div>
    );
  }

  const maxValue = data[0]?.value || 1;
  const colors = [
    "bg-blue-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-orange-500",
    "bg-green-500",
  ];
  const bgColors = [
    "bg-blue-500/10",
    "bg-cyan-500/10",
    "bg-amber-500/10",
    "bg-orange-500/10",
    "bg-green-500/10",
  ];

  return (
    <div className="space-y-3">
      {data.map((step, index) => {
        const widthPercent = Math.max((step.value / maxValue) * 100, 8);
        const conversionFromStart = ((step.value / maxValue) * 100).toFixed(1);

        return (
          <div key={step.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{step.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground tabular-nums">
                  {formatNumber(step.value)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground w-14 text-right">
                  {conversionFromStart}%
                </span>
              </div>
            </div>
            <div className={`h-8 rounded-md ${bgColors[index % bgColors.length]} relative overflow-hidden`}>
              <div
                className={`h-full rounded-md ${colors[index % colors.length]} transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            {index > 0 && step.dropOff > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground pl-2">
                <svg width="10" height="10" viewBox="0 0 10 10" className="text-red-400">
                  <path d="M5 2 L5 8 M3 6 L5 8 L7 6" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-red-400">{step.dropOff.toFixed(1)}% drop-off</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
