"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Package,
  Smartphone,
  Users,
} from "lucide-react";

import {
  api,
  PaymentPerformance,
} from "@/lib/api";


function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}


function formatPercent(value: number) {
  return `${Number(value).toFixed(2)}%`;
}


export default function PaymentsPage() {

  const [payments, setPayments] =
    useState<PaymentPerformance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadPayments() {

      try {

        const data = await api.payments();

        setPayments(data);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load payment analytics"
        );

      } finally {

        setLoading(false);

      }
    }

    loadPayments();

  }, []);


  const metrics = useMemo(() => {

    const attempts = payments.reduce(
      (sum, payment) =>
        sum + Number(payment.attempts),
      0
    );

    const successful = payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.successful_payments
        ),
      0
    );

    const failed = payments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.failed_payments
        ),
      0
    );

    const failureRate =
      attempts > 0
        ? (failed / attempts) * 100
        : 0;

    return {
      attempts,
      successful,
      failed,
      failureRate,
    };

  }, [payments]);


  const highestFailureMethod =
    payments.length > 0
      ? payments.reduce(
          (highest, current) =>
            Number(
              current.failure_rate_percent
            ) >
            Number(
              highest.failure_rate_percent
            )
              ? current
              : highest,
          payments[0]
        )
      : null;


  const sortedPayments = [
    ...payments,
  ].sort(
    (a, b) =>
      Number(b.failure_rate_percent) -
      Number(a.failure_rate_percent)
  );


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading payment analytics...
        </div>

      </main>
    );
  }


  if (error) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load payment data
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


          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950">

            <CreditCard className="h-4 w-4" />

            Payments

          </div>


          <a
            href="/products"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Package className="h-4 w-4" />
            Products
          </a>


          <a
            href="/customers"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Customers
          </a>


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
              Transaction Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Payment Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Identify payment reliability issues,
              compare payment methods, and uncover
              opportunities to recover failed transactions.
            </p>

          </div>


          {/* ================================================== */}
          {/* KPI GRID */}
          {/* ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Payment Attempts
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  metrics.attempts
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Across all payment methods
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Successful Payments
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  metrics.successful
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Completed successfully
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Failed Payments
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  metrics.failed
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Transactions requiring attention
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Overall Failure Rate
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatPercent(
                  metrics.failureRate
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Failed / total attempts
              </p>

            </div>

          </div>


          {/* ================================================== */}
          {/* PAYMENT METHOD TABLE */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <h2 className="font-semibold text-slate-950">
                Payment Method Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare reliability across payment methods
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Payment Method
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Attempts
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Successful
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Failed
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Failure Rate
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {sortedPayments.map(
                    (payment) => {

                      const isHighest =
                        highestFailureMethod &&
                        payment.payment_method ===
                          highestFailureMethod.payment_method;

                      return (

                        <tr
                          key={
                            payment.payment_method
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">

                                <CreditCard className="h-4 w-4 text-slate-600" />

                              </div>

                              <span className="text-sm font-medium text-slate-900">

                                {payment.payment_method}

                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                payment.attempts
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                payment.successful_payments
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                payment.failed_payments
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isHighest
                                  ? "bg-slate-900 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >

                              {formatPercent(
                                Number(
                                  payment.failure_rate_percent
                                )
                              )}

                            </span>

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
          {/* FAILURE RATE VISUALIZATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="font-semibold text-slate-950">
                Failure Rate by Payment Method
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Higher values indicate greater payment friction
              </p>

            </div>


            <div className="space-y-5">

              {sortedPayments.map(
                (payment) => {

                  const rate =
                    Number(
                      payment.failure_rate_percent
                    );

                  const width =
                    Math.min(
                      (rate / 10) * 100,
                      100
                    );

                  return (

                    <div
                      key={
                        payment.payment_method
                      }
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-800">

                          {payment.payment_method}

                        </span>

                        <span className="text-sm font-semibold text-slate-900">

                          {formatPercent(rate)}

                        </span>

                      </div>


                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${width}%`,
                          }}
                        />

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          </section>


          {/* ================================================== */}
          {/* DIAGNOSTIC INSIGHT */}
          {/* ================================================== */}

          {highestFailureMethod && (

            <section className="mt-6 grid gap-6 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">

                    <AlertTriangle className="h-5 w-5 text-slate-700" />

                  </div>


                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Highest Payment Friction
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-950">

                      {highestFailureMethod.payment_method}

                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">

                      {highestFailureMethod.payment_method}
                      {" "}has the highest observed failure
                      rate at{" "}

                      <strong className="font-semibold text-slate-900">

                        {formatPercent(
                          Number(
                            highestFailureMethod.failure_rate_percent
                          )
                        )}

                      </strong>

                      {" "}across{" "}

                      <strong className="font-semibold text-slate-900">

                        {formatNumber(
                          Number(
                            highestFailureMethod.attempts
                          )
                        )}

                      </strong>

                      {" "}attempts.

                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex gap-4">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">

                    <Smartphone className="h-5 w-5 text-slate-700" />

                  </div>


                  <div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Recommended Investigation
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-slate-950">
                      Improve failed-payment recovery
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">

                      Investigate retry flows, payment
                      failure messaging, and recovery
                      journeys for high-friction payment
                      methods.

                    </p>

                  </div>

                </div>

              </div>

            </section>

          )}


          {/* ================================================== */}
          {/* EXPERIMENT CONNECTION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <CheckCircle2 className="h-5 w-5" />

              </div>


              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Experiment
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  UPI recovery flow shows statistically significant improvement
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">

                  The ProductPulse UPI recovery experiment
                  increased recovery from 11.64% to 15.70%,
                  representing a 34.95% relative lift.
                  The result was statistically significant
                  with a p-value of 0.022617.

                </p>

                <a
                  href="/experiments"
                  className="mt-4 inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
                >
                  View experiment
                </a>

              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}