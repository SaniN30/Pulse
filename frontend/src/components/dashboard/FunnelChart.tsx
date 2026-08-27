"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Funnel } from "@/lib/api";


interface FunnelChartProps {
  data: Funnel;
}


export default function FunnelChart({
  data,
}: FunnelChartProps) {

  const chartData = [
    {
      stage: "Visitors",
      users: data.visitors,
    },
    {
      stage: "Product View",
      users: data.product_viewers,
    },
    {
      stage: "Add to Cart",
      users: data.cart_users,
    },
    {
      stage: "Checkout",
      users: data.checkout_users,
    },
    {
      stage: "Payment",
      users: data.payment_users,
    },
    {
      stage: "Purchase",
      users: data.purchasers,
    },
  ];


  return (

    <div className="h-[320px] w-full">

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <BarChart
          data={chartData}
          layout="vertical"
          margin={{
            top: 5,
            right: 20,
            left: 10,
            bottom: 5,
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
          />


          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              Number(value).toLocaleString("en-IN")
            }
          />


          <YAxis
            type="category"
            dataKey="stage"
            tickLine={false}
            axisLine={false}
            width={90}
          />


          <Tooltip
            formatter={(value) =>
              Number(value).toLocaleString("en-IN")
            }
          />


          <Bar
            dataKey="users"
            radius={[0, 6, 6, 0]}
            barSize={24}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}