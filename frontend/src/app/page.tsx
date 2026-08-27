"use client";

import { useEffect, useState } from "react";

import {
  CreditCard,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";

import KpiCard from "@/components/dashboard/KpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import FunnelChart from "@/components/dashboard/FunnelChart";
import OpportunityCard from "@/components/dashboard/OpportunityCard";

import {
  api,
  Overview,
  RevenuePoint,
  Funnel,
} from "@/lib/api";


function formatCurrency(value: number) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}


function formatPercent(value: number) {
  return `${Number(value).toFixed(2)}%`;
}


function formatNumber(value: number) {
  return Number(value).toLocaleString("en-IN");
}


export default function HomePage() {

  const [overview, setOverview] =
    useState<Overview | null>(null);

  const [revenue, setRevenue] =
    useState<RevenuePoint[]>([]);

  const [funnel, setFunnel] =
    useState<Funnel | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadDashboard() {

      try {

        const [
          overviewData,
          revenueData,
          funnelData,
        ] = await Promise.all([
          api.overview(),
          api.revenue(),
          api.funnel(),
        ]);

        setOverview(overviewData);
        setRevenue(revenueData);
        setFunnel(funnelData);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard data"
        );

      } finally {

        setLoading(false);

      }
    }

    loadDashboard();

  }, []);


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading ProductPulse...
        </div>

      </main>
    );
  }


  if (error || !overview || !funnel) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Dashboard data is unavailable."}
          </p>

          <p className="mt-4 text-xs text-slate-400">
            Make sure the ProductPulse API is running.
          </p>

        </div>

      </main>
    );
  }


  return (

    <main className="min-h-screen bg-slate-50">

      <Sidebar />


      <section className="lg:pl-64">

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">


          {/* HEADER */}

          <div className="mb-8">

            <p className="text-sm font-medium text-slate-500">
              Executive Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              ProductPulse Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              A unified view of revenue, customers,
              conversion performance, and payment behavior.
            </p>

          </div>


          {/* KPI CARDS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <KpiCard
              title="Total Revenue"
              value={formatCurrency(
                overview.total_revenue
              )}
              subtitle="Gross order revenue"
            />


            <KpiCard
              title="Total Orders"
              value={formatNumber(
                overview.total_orders
              )}
              subtitle="Completed orders"
            />


            <KpiCard
              title="Purchasing Customers"
              value={formatNumber(
                overview.purchasing_customers
              )}
              subtitle={`${formatPercent(
                overview.customer_purchase_rate
              )} purchase rate`}
            />


            <KpiCard
              title="Average Order Value"
              value={formatCurrency(
                overview.average_order_value
              )}
              subtitle="Average order size"
            />

          </div>


          {/* SECONDARY METRICS */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Revenue per Customer
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatCurrency(
                      overview.revenue_per_customer
                    )}
                  </p>

                </div>


                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <TrendingUp className="h-5 w-5 text-slate-700" />

                </div>

              </div>

              <p className="mt-3 text-xs text-slate-400">
                Average revenue generated per purchasing customer
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-slate-500">
                    Customer Purchase Rate
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {formatPercent(
                      overview.customer_purchase_rate
                    )}
                  </p>

                </div>


                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <Users className="h-5 w-5 text-slate-700" />

                </div>

              </div>

              <p className="mt-3 text-xs text-slate-400">
                Percentage of tracked customers who purchased
              </p>

            </div>

          </div>


          {/* CHARTS */}

          <div className="mt-6 grid gap-6 xl:grid-cols-2">


            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="font-semibold text-slate-950">
                  Revenue Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Revenue performance across the analyzed dataset
                </p>

              </div>

              <RevenueChart data={revenue} />

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="font-semibold text-slate-950">
                  Conversion Funnel
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customer progression from visit to purchase
                </p>

              </div>

              <FunnelChart data={funnel} />

            </div>

          </div>


          {/* OPPORTUNITY */}

          <div className="mt-6">

            <OpportunityCard
              type="warning"
              title="Payment recovery is a key opportunity"
              description="The payment analysis shows meaningful failed-payment volume. Improving recovery flows, particularly for high-volume payment methods, can recover otherwise lost revenue."
            />

          </div>


          {/* EXECUTIVE INSIGHT */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <TrendingUp className="h-5 w-5" />

              </div>


              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Executive Insight
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  ProductPulse connects business metrics to product decisions
                </h2>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">

                  The dashboard combines revenue performance,
                  customer behavior, conversion analytics,
                  payment reliability, product performance,
                  and controlled experimentation into one
                  decision-making layer.

                </p>

              </div>

            </div>

          </section>


          {/* FOOTER */}

          <footer className="mt-8 border-t border-slate-200 pt-6">

            <p className="text-xs text-slate-400">
              ProductPulse Analytics Platform
            </p>

          </footer>

        </div>

      </section>

    </main>
  );
}