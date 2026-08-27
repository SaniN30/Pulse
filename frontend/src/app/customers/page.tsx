"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  AcquisitionChannel,
  CustomerSegment,
  RepeatRate,
  api,
} from "@/lib/api";


function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}


function formatCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}


function formatPercent(value: number) {
  return `${Number(value).toFixed(2)}%`;
}


export default function CustomersPage() {

  const [acquisition, setAcquisition] =
    useState<AcquisitionChannel[]>([]);

  const [segments, setSegments] =
    useState<CustomerSegment[]>([]);

  const [repeatRate, setRepeatRate] =
    useState<RepeatRate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadCustomers() {

      try {

        const [
          acquisitionData,
          segmentData,
          repeatData,
        ] = await Promise.all([
          api.acquisition(),
          api.customerSegments(),
          api.repeatRate(),
        ]);

        setAcquisition(acquisitionData);
        setSegments(segmentData);
        setRepeatRate(repeatData);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load customer analytics"
        );

      } finally {

        setLoading(false);

      }
    }

    loadCustomers();

  }, []);


  const metrics = useMemo(() => {

    const users = acquisition.reduce(
      (sum, channel) =>
        sum + Number(channel.users),
      0
    );

    const purchasingUsers =
      acquisition.reduce(
        (sum, channel) =>
          sum +
          Number(channel.purchasing_users),
        0
      );

    const revenue = acquisition.reduce(
      (sum, channel) =>
        sum + Number(channel.revenue),
      0
    );

    const orders = acquisition.reduce(
      (sum, channel) =>
        sum + Number(channel.orders),
      0
    );

    const conversion =
      users > 0
        ? (purchasingUsers / users) * 100
        : 0;

    const revenuePerUser =
      users > 0
        ? revenue / users
        : 0;

    return {
      users,
      purchasingUsers,
      revenue,
      orders,
      conversion,
      revenuePerUser,
    };

  }, [acquisition]);


  const sortedAcquisition =
    [...acquisition].sort(
      (a, b) =>
        Number(b.revenue) -
        Number(a.revenue)
    );


  const sortedSegments =
    [...segments].sort(
      (a, b) =>
        Number(b.revenue) -
        Number(a.revenue)
    );


  const topChannel =
    sortedAcquisition[0] || null;

  const topSegment =
    sortedSegments[0] || null;


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading customer analytics...
        </div>

      </main>
    );
  }


  if (error) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load customer data
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Make sure FastAPI is running on port 8000.
          </p>

        </div>

      </main>
    );
  }


  return (

    <main className="min-h-screen bg-slate-50">

      {/* ================================================== */}
      {/* SIDEBAR */}
      {/* ================================================== */}

      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">

        <div className="flex h-20 items-center border-b border-slate-200 px-6">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">

              <BarChart3 className="h-5 w-5 text-white" />

            </div>

            <div>

              <p className="font-semibold text-slate-950">
                ProductPulse
              </p>

              <p className="text-xs text-slate-400">
                Analytics Platform
              </p>

            </div>

          </div>

        </div>


        <nav className="space-y-1 p-4">

          <a
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </a>


          <a
            href="/conversion"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <BarChart3 className="h-4 w-4" />
            Conversion
          </a>


          <a
            href="/payments"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <CreditCard className="h-4 w-4" />
            Payments
          </a>


          <a
            href="/products"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Package className="h-4 w-4" />
            Products
          </a>


          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950">

            <Users className="h-4 w-4" />

            Customers

          </div>


          <a
            href="/experiments"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Experiments
          </a>

        </nav>

      </aside>


      {/* ================================================== */}
      {/* MAIN CONTENT */}
      {/* ================================================== */}

      <section className="lg:pl-64">

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

          {/* HEADER */}

          <div className="mb-8">

            <p className="text-sm font-medium text-slate-500">
              Customer Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Customer Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Understand customer acquisition,
              purchasing behavior, segment value,
              and repeat purchase performance.
            </p>

          </div>


          {/* ================================================== */}
          {/* KPI GRID */}
          {/* ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Acquired Users
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(metrics.users)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Across tracked channels
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Purchasing Users
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  metrics.purchasingUsers
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {formatPercent(metrics.conversion)}
                {" "}conversion
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(metrics.revenue)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Attributed across channels
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Revenue / User
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(
                  metrics.revenuePerUser
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Average attributed value
              </p>

            </div>

          </div>


          {/* ================================================== */}
          {/* ACQUISITION CHANNELS */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <h2 className="font-semibold text-slate-950">
                Acquisition Channel Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare acquisition volume, conversion,
                and revenue contribution
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Channel
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Users
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Purchasers
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Conversion
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Orders
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Revenue
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Revenue / User
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {sortedAcquisition.map(
                    (channel) => {

                      return (

                        <tr
                          key={
                            channel.acquisition_channel
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">

                                <Users className="h-4 w-4 text-slate-600" />

                              </div>

                              <span className="text-sm font-medium text-slate-900">
                                {channel.acquisition_channel}
                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(channel.users)
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                channel.purchasing_users
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right">

                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                              {formatPercent(
                                Number(
                                  channel.conversion_percent
                                )
                              )}

                            </span>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(channel.orders)
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">

                            {formatCurrency(
                              Number(channel.revenue)
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatCurrency(
                              Number(
                                channel.revenue_per_user
                              )
                            )}

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>


          {/* ================================================== */}
          {/* CUSTOMER SEGMENTS */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <h2 className="font-semibold text-slate-950">
                Customer Segment Value
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare customer groups by size and revenue
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Segment
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Customers
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Revenue
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Avg. Customer Revenue
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {sortedSegments.map(
                    (segment) => {

                      return (

                        <tr
                          key={
                            segment.customer_segment
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">

                                <Users className="h-4 w-4 text-slate-600" />

                              </div>

                              <span className="text-sm font-medium text-slate-900">
                                {segment.customer_segment}
                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                segment.customers
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">

                            {formatCurrency(
                              Number(segment.revenue)
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatCurrency(
                              Number(
                                segment.average_customer_revenue
                              )
                            )}

                          </td>

                        </tr>

                      );

                    }
                  )}

                </tbody>

              </table>

            </div>

          </section>


          {/* ================================================== */}
          {/* REPEAT PURCHASE */}
          {/* ================================================== */}

          {repeatRate && (

            <section className="mt-6 grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Repeat Purchase Rate
                    </p>

                    <h2 className="mt-2 text-4xl font-semibold text-slate-950">
                      {formatPercent(
                        Number(
                          repeatRate.repeat_purchase_rate_percent
                        )
                      )}
                    </h2>

                  </div>


                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">

                    <TrendingUp className="h-5 w-5 text-slate-700" />

                  </div>

                </div>


                <div className="mt-6">

                  <div className="mb-2 flex justify-between text-sm">

                    <span className="text-slate-500">
                      Repeat customers
                    </span>

                    <span className="font-medium text-slate-900">

                      {formatNumber(
                        Number(
                          repeatRate.repeat_customers
                        )
                      )}

                    </span>

                  </div>


                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${Math.min(
                          Number(
                            repeatRate.repeat_purchase_rate_percent
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>


                  <p className="mt-3 text-xs text-slate-400">

                    Based on{" "}

                    {formatNumber(
                      Number(
                        repeatRate.purchasing_customers
                      )
                    )}

                    {" "}purchasing customers.

                  </p>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">

                    <CheckCircle2 className="h-5 w-5 text-slate-700" />

                  </div>


                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Customer Strategy
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Measure acquisition quality, not just volume
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">

                      Compare channels using both conversion
                      and revenue per user. High-volume channels
                      are not necessarily the most valuable if
                      their purchasing rate or customer value is
                      lower.

                    </p>

                  </div>

                </div>

              </div>

            </section>

          )}


          {/* ================================================== */}
          {/* AUTOMATIC INSIGHTS */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-6 lg:grid-cols-2">

            {topChannel && (

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Revenue Leader
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  {topChannel.acquisition_channel}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">

                  This channel generated{" "}

                  <strong className="font-semibold text-white">

                    {formatCurrency(
                      Number(
                        topChannel.revenue
                      )
                    )}

                  </strong>

                  {" "}across{" "}

                  {formatNumber(
                    Number(
                      topChannel.users
                    )
                  )}

                  {" "}users.

                </p>

              </div>

            )}


            {topSegment && (

              <div className="rounded-2xl border border-slate-200 bg-slate-white bg-white p-6 shadow-sm">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Highest-Value Segment
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {topSegment.customer_segment}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">

                  Generated{" "}

                  <strong className="font-semibold text-slate-900">

                    {formatCurrency(
                      Number(
                        topSegment.revenue
                      )
                    )}

                  </strong>

                  {" "}with an average customer value of{" "}

                  <strong className="font-semibold text-slate-900">

                    {formatCurrency(
                      Number(
                        topSegment.average_customer_revenue
                      )
                    )}

                  </strong>

                  .

                </p>

              </div>

            )}

          </section>


          {/* ================================================== */}
          {/* RECOMMENDATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <Users className="h-5 w-5" />

              </div>


              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Recommendation
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Optimize for customer quality and retention
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">

                  Acquisition decisions should consider
                  conversion, revenue per user, and repeat
                  behavior together. Prioritize channels and
                  segments that demonstrate strong downstream
                  customer value rather than optimizing only
                  for acquisition volume.

                </p>

              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}