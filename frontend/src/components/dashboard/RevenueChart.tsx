"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { RevenuePoint } from "@/lib/api";

interface RevenueChartProps {
  data: RevenuePoint[];
}

export default function RevenueChart({
  data,
}: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    label: new Date(item.month).toLocaleDateString(
      "en-IN",
      {
        month: "short",
        year: "numeric",
      }
    ),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart data={formattedData}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              `₹${(value / 1000000).toFixed(0)}M`
            }
          />

          <Tooltip
            formatter={(value) =>
              `₹${Number(value).toLocaleString("en-IN")}`
            }
          />

          <Area
            type="monotone"
            dataKey="revenue"
            strokeWidth={2}
            fillOpacity={0.15}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}