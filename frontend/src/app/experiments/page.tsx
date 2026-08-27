"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Package,
  Users,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import {
  api,
  ExperimentGroup,
  ExperimentStatistics,
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


export default function ExperimentsPage() {

  const [experiment, setExperiment] =
    useState<ExperimentGroup[]>([]);

  const [statistics, setStatistics] =
    useState<ExperimentStatistics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadExperiment() {

      try {

        const [
          experimentData,
          statisticsData,
        ] = await Promise.all([
          api.experiment(),
          api.experimentStatistics(),
        ]);

        setExperiment(experimentData);
        setStatistics(statisticsData);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load experiment analytics"
        );

      } finally {

        setLoading(false);

      }
    }

    loadExperiment();

  }, []);


  const control =
    experiment.find(
      (group) =>
        group.experiment_group
          .toLowerCase() === "control"
    ) || null;


  const treatment =
    experiment.find(
      (group) =>
        group.experiment_group
          .toLowerCase() === "treatment"
    ) || null;


  const recoveryImprovement =
    statistics
      ? Number(statistics.absolute_lift_percentage_points)
      : 0;


  const relativeLift =
    statistics
      ? Number(statistics.relative_lift_percent)
      : 0;


  const maxRecoveryRate =
    Math.max(
      Number(control?.recovery_rate_percent || 0),
      Number(treatment?.recovery_rate_percent || 0),
      1
    );


  const totalRecoveredRevenue =
    useMemo(() => {

      return experiment.reduce(
        (sum, group) =>
          sum +
          Number(group.recovered_revenue),
        0
      );

    }, [experiment]);


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading experiment analytics...
        </div>

      </main>
    );
  }


  if (error || !statistics) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load experiment data
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Experiment API unavailable."}
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


          <a
            href="/customers"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Customers
          </a>


          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950">

            <FlaskConical className="h-4 w-4" />

            Experiments

          </div>

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
              Product Experimentation
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Experiment Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Evaluate the UPI payment-recovery experiment
              and determine whether the improved recovery
              experience should be shipped.
            </p>

          </div>


          {/* ================================================== */}
          {/* DECISION BANNER */}
          {/* ================================================== */}

          <section className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div className="flex gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">

                  <CheckCircle2 className="h-6 w-6" />

                </div>


                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Experiment Decision
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    {statistics.recommendation}
                  </h2>

                  <p className="mt-1 text-sm text-slate-300">
                    The treatment produced a statistically
                    significant improvement in payment recovery.
                  </p>

                </div>

              </div>


              <div className="rounded-xl bg-white/10 px-5 py-3 text-center">

                <p className="text-xs text-slate-400">
                  p-value
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {Number(
                    statistics.p_value
                  ).toFixed(5)}
                </p>

              </div>

            </div>

          </section>


          {/* ================================================== */}
          {/* KPI GRID */}
          {/* ================================================== */}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Absolute Lift
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                +{recoveryImprovement.toFixed(2)} pp
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Recovery-rate improvement
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Relative Lift
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                +{relativeLift.toFixed(2)}%
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Relative improvement vs control
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Z-statistic
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {Number(
                  statistics.z_statistic
                ).toFixed(4)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Two-proportion test
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Recovered Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(
                  totalRecoveredRevenue
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Across experiment groups
              </p>

            </div>

          </div>


          {/* ================================================== */}
          {/* CONTROL VS TREATMENT */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-8">

              <h2 className="font-semibold text-slate-950">
                Control vs Treatment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Payment recovery performance by experiment group
              </p>

            </div>


            <div className="grid gap-8 md:grid-cols-2">

              {/* CONTROL */}

              {control && (

                <div>

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-semibold text-slate-950">
                        Control
                      </p>

                      <p className="text-xs text-slate-400">
                        Existing recovery experience
                      </p>

                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {formatNumber(
                        Number(control.failed_payments)
                      )} failures
                    </span>

                  </div>


                  <div className="rounded-2xl bg-slate-50 p-6">

                    <p className="text-4xl font-semibold text-slate-950">
                      {formatPercent(
                        Number(
                          control.recovery_rate_percent
                        )
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Recovery rate
                    </p>


                    <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-200">

                      <div
                        className="h-full rounded-full bg-slate-500"
                        style={{
                          width: `${
                            (
                              Number(
                                control.recovery_rate_percent
                              ) /
                              maxRecoveryRate
                            ) *
                            100
                          }%`,
                        }}
                      />

                    </div>


                    <div className="mt-5 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-xs text-slate-400">
                          Recoveries
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {formatNumber(
                            Number(
                              control.recovered_payments
                            )
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-slate-400">
                          Recovered Revenue
                        </p>

                        <p className="mt-1 font-semibold text-slate-900">
                          {formatCurrency(
                            Number(
                              control.recovered_revenue
                            )
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}


              {/* TREATMENT */}

              {treatment && (

                <div>

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-semibold text-slate-950">
                        Treatment
                      </p>

                      <p className="text-xs text-slate-400">
                        Improved recovery experience
                      </p>

                    </div>

                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                      +{relativeLift.toFixed(2)}%
                    </span>

                  </div>


                  <div className="rounded-2xl bg-slate-950 p-6 text-white">

                    <p className="text-4xl font-semibold">
                      {formatPercent(
                        Number(
                          treatment.recovery_rate_percent
                        )
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-300">
                      Recovery rate
                    </p>


                    <div className="mt-6 h-4 overflow-hidden rounded-full bg-white/10">

                      <div
                        className="h-full rounded-full bg-white"
                        style={{
                          width: `${
                            (
                              Number(
                                treatment.recovery_rate_percent
                              ) /
                              maxRecoveryRate
                            ) *
                            100
                          }%`,
                        }}
                      />

                    </div>


                    <div className="mt-5 grid grid-cols-2 gap-4">

                      <div>

                        <p className="text-xs text-slate-400">
                          Recoveries
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatNumber(
                            Number(
                              treatment.recovered_payments
                            )
                          )}
                        </p>

                      </div>


                      <div>

                        <p className="text-xs text-slate-400">
                          Recovered Revenue
                        </p>

                        <p className="mt-1 font-semibold">
                          {formatCurrency(
                            Number(
                              treatment.recovered_revenue
                            )
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              )}

            </div>

          </section>


          {/* ================================================== */}
          {/* STATISTICAL EVIDENCE */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-6 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <ShieldCheck className="h-5 w-5 text-slate-700" />

                </div>

                <div>

                  <h2 className="font-semibold text-slate-950">
                    Statistical Evidence
                  </h2>

                  <p className="text-xs text-slate-400">
                    Experiment significance
                  </p>

                </div>

              </div>


              <div className="mt-6 space-y-4">

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <span className="text-sm text-slate-500">
                    Control recovery
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatPercent(
                      Number(
                        statistics.control.recovery_rate *
                          100
                      )
                    )}
                  </span>

                </div>


                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <span className="text-sm text-slate-500">
                    Treatment recovery
                  </span>

                  <span className="font-semibold text-slate-900">
                    {formatPercent(
                      Number(
                        statistics.treatment.recovery_rate *
                          100
                      )
                    )}
                  </span>

                </div>


                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <span className="text-sm text-slate-500">
                    Z-statistic
                  </span>

                  <span className="font-semibold text-slate-900">
                    {Number(
                      statistics.z_statistic
                    ).toFixed(4)}
                  </span>

                </div>


                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    P-value
                  </span>

                  <span className="font-semibold text-slate-900">
                    {Number(
                      statistics.p_value
                    ).toFixed(6)}
                  </span>

                </div>

              </div>


              <div className="mt-6 rounded-xl bg-slate-100 p-4">

                <p className="text-sm font-medium text-slate-900">

                  {statistics.statistically_significant
                    ? "Statistically significant"
                    : "Not statistically significant"}

                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">

                  The observed difference is unlikely to
                  be explained by random variation under the
                  experiment's statistical test.

                </p>

              </div>

            </div>


            {/* LIFT */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <TrendingUp className="h-5 w-5 text-slate-700" />

                </div>

                <div>

                  <h2 className="font-semibold text-slate-950">
                    Experiment Impact
                  </h2>

                  <p className="text-xs text-slate-400">
                    Practical business improvement
                  </p>

                </div>

              </div>


              <div className="mt-8 text-center">

                <p className="text-5xl font-semibold tracking-tight text-slate-950">
                  +{relativeLift.toFixed(2)}%
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Relative recovery improvement
                </p>

              </div>


              <div className="mt-8 rounded-2xl bg-slate-50 p-5">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Absolute improvement
                  </span>

                  <span className="font-semibold text-slate-950">
                    +{recoveryImprovement.toFixed(2)} pp
                  </span>

                </div>


                <div className="mt-4 flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Statistical significance
                  </span>

                  <span className="font-semibold text-slate-950">
                    {statistics.statistically_significant
                      ? "Yes"
                      : "No"}
                  </span>

                </div>


                <div className="mt-4 flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Product decision
                  </span>

                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                    {statistics.recommendation}
                  </span>

                </div>

              </div>

            </div>

          </section>


          {/* ================================================== */}
          {/* GROUP DETAIL */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <h2 className="font-semibold text-slate-950">
                Experiment Observations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detailed recovery results for each group
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Group
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Failed Payments
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Recoveries
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Recovery Rate
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Recovered Revenue
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {experiment.map(
                    (group) => {

                      const isTreatment =
                        group.experiment_group
                          .toLowerCase() ===
                        "treatment";

                      return (

                        <tr
                          key={
                            group.experiment_group
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">

                                <FlaskConical className="h-4 w-4 text-slate-600" />

                              </div>

                              <span className="text-sm font-medium text-slate-900">

                                {group.experiment_group}

                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                group.failed_payments
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                group.recovered_payments
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                isTreatment
                                  ? "bg-slate-950 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >

                              {formatPercent(
                                Number(
                                  group.recovery_rate_percent
                                )
                              )}

                            </span>

                          </td>


                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">

                            {formatCurrency(
                              Number(
                                group.recovered_revenue
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
          {/* FINAL RECOMMENDATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-7 text-white shadow-sm">

            <div className="flex flex-col gap-6 md:flex-row md:items-start">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <CheckCircle2 className="h-6 w-6" />

              </div>


              <div className="flex-1">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Recommendation
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Ship the improved UPI recovery flow
                </h2>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">

                  The treatment increased payment recovery
                  from 11.64% to 15.70%, producing a 4.07
                  percentage-point absolute lift and a 34.95%
                  relative lift. With a p-value of 0.022617,
                  the result meets the statistical significance
                  threshold used by the experiment.

                </p>


                <div className="mt-5 flex flex-wrap gap-3">

                  <div className="rounded-xl bg-white/10 px-4 py-2 text-sm">

                    +34.95% relative lift

                  </div>

                  <div className="rounded-xl bg-white/10 px-4 py-2 text-sm">

                    p = 0.022617

                  </div>

                  <div className="rounded-xl bg-white/10 px-4 py-2 text-sm">

                    Decision: SHIP

                  </div>

                </div>

              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}