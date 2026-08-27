"use client";

import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";

import {
  api,
  Funnel,
  DevicePerformance,
} from "@/lib/api";

import Sidebar from "@/components/layout/Sidebar";


function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}


function getDeviceIcon(device: string) {
  const normalized = device.toLowerCase();

  if (normalized === "mobile") {
    return Smartphone;
  }

  if (normalized === "tablet") {
    return Tablet;
  }

  return Monitor;
}


export default function ConversionPage() {

  const [funnel, setFunnel] =
    useState<Funnel | null>(null);

  const [devices, setDevices] =
    useState<DevicePerformance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadData() {

      try {

        const [
          funnelData,
          deviceData,
        ] = await Promise.all([
          api.funnel(),
          api.devices(),
        ]);

        setFunnel(funnelData);
        setDevices(deviceData);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load conversion analytics"
        );

      } finally {

        setLoading(false);

      }
    }

    loadData();

  }, []);


  const funnelStages = useMemo(() => {

    if (!funnel) {
      return [];
    }

    return [
      {
        name: "Visitors",
        value: Number(funnel.visitors),
        rate: 100,
      },
      {
        name: "Product Views",
        value: Number(funnel.product_viewers),
        rate: Number(funnel.view_rate_percent),
      },
      {
        name: "Add to Cart",
        value: Number(funnel.cart_users),
        rate: Number(funnel.add_to_cart_rate_percent),
      },
      {
        name: "Checkout",
        value: Number(funnel.checkout_users),
        rate: Number(funnel.checkout_rate_percent),
      },
      {
        name: "Payment Attempt",
        value: Number(funnel.payment_users),
        rate: Number(funnel.payment_attempt_rate_percent),
      },
      {
        name: "Purchase",
        value: Number(funnel.purchasers),
        rate: Number(funnel.purchase_rate_percent),
      },
    ];

  }, [funnel]);


  const largestDropOff = useMemo(() => {

    if (funnelStages.length < 2) {
      return null;
    }

    let largest = {
      from: "",
      to: "",
      lost: 0,
      percentage: 0,
    };

    for (
      let index = 0;
      index < funnelStages.length - 1;
      index++
    ) {

      const current = funnelStages[index];
      const next = funnelStages[index + 1];

      const lost =
        current.value - next.value;

      const percentage =
        current.value > 0
          ? (lost / current.value) * 100
          : 0;

      if (percentage > largest.percentage) {

        largest = {
          from: current.name,
          to: next.name,
          lost,
          percentage,
        };

      }

    }

    return largest;

  }, [funnelStages]);


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading conversion analytics...
        </div>

      </main>
    );
  }


  if (error || !funnel) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load conversion data
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "Conversion API unavailable."}
          </p>

        </div>

      </main>
    );
  }


  return (

    <main className="min-h-screen bg-slate-50">

      {/* ================================================== */}
      {/* SHARED SIDEBAR */}
      {/* ================================================== */}

      <Sidebar />


      {/* ================================================== */}
      {/* CONTENT */}
      {/* ================================================== */}

      <section className="lg:pl-64">

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

          {/* HEADER */}

          <div className="mb-8">

            <p className="text-sm font-medium text-slate-500">
              Product Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Conversion Analytics
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Understand how users move through the purchase
              journey and identify the largest opportunities
              for conversion improvement.
            </p>

          </div>


          {/* ================================================== */}
          {/* TOP METRICS */}
          {/* ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Visitors
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  Number(funnel.visitors)
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Unique users reaching the site
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Cart Users
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  Number(funnel.cart_users)
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {Number(
                  funnel.add_to_cart_rate_percent
                ).toFixed(2)}% of product viewers
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Checkout Users
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  Number(funnel.checkout_users)
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {Number(
                  funnel.checkout_rate_percent
                ).toFixed(2)}% of cart users
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Purchasers
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(
                  Number(funnel.purchasers)
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {Number(
                  funnel.purchase_rate_percent
                ).toFixed(2)}% of payment attempts
              </p>

            </div>

          </div>


          {/* ================================================== */}
          {/* FUNNEL */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-8">

              <h2 className="font-semibold text-slate-950">
                Purchase Funnel
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                User progression through the purchase journey
              </p>

            </div>


            <div className="space-y-5">

              {funnelStages.map(
                (stage, index) => {

                  const previous =
                    index > 0
                      ? funnelStages[index - 1]
                      : null;

                  const stageConversion =
                    previous && previous.value > 0
                      ? (
                          stage.value /
                          previous.value
                        ) * 100
                      : 100;

                  const width =
                    funnel.visitors > 0
                      ? (
                          stage.value /
                          funnel.visitors
                        ) * 100
                      : 0;

                  return (

                    <div key={stage.name}>

                      <div className="mb-2 flex items-center justify-between">

                        <div className="flex items-center gap-3">

                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">

                            {index + 1}

                          </div>


                          <div>

                            <p className="text-sm font-medium text-slate-900">
                              {stage.name}
                            </p>

                            {previous && (

                              <p className="text-xs text-slate-400">

                                {stageConversion.toFixed(2)}%
                                {" "}of previous stage

                              </p>

                            )}

                          </div>

                        </div>


                        <p className="text-sm font-semibold text-slate-900">

                          {formatNumber(stage.value)}

                        </p>

                      </div>


                      <div className="h-10 overflow-hidden rounded-xl bg-slate-100">

                        <div
                          className="flex h-full items-center rounded-xl bg-slate-900 px-4 text-xs font-medium text-white transition-all"
                          style={{
                            width: `${Math.max(
                              width,
                              3
                            )}%`,
                          }}
                        >

                          {width >= 15
                            ? `${width.toFixed(1)}%`
                            : null}

                        </div>

                      </div>


                      {index <
                        funnelStages.length - 1 && (

                        <div className="flex justify-center py-2">

                          <ArrowDown className="h-4 w-4 text-slate-300" />

                        </div>

                      )}

                    </div>

                  );

                }
              )}

            </div>

          </section>


          {/* ================================================== */}
          {/* DEVICE PERFORMANCE */}
          {/* ================================================== */}

          <section className="mt-6">

            <div className="mb-4">

              <h2 className="font-semibold text-slate-950">
                Device Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Compare purchase conversion across devices
              </p>

            </div>


            <div className="grid gap-4 md:grid-cols-3">

              {devices.map((device) => {

                const Icon =
                  getDeviceIcon(
                    device.device_type
                  );

                const isMobile =
                  device.device_type.toLowerCase()
                    === "mobile";

                return (

                  <div
                    key={device.device_type}
                    className={`rounded-2xl border bg-white p-6 shadow-sm ${
                      isMobile
                        ? "border-slate-300"
                        : "border-slate-200"
                    }`}
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                          <Icon className="h-5 w-5 text-slate-700" />

                        </div>


                        <div>

                          <p className="font-semibold text-slate-950">
                            {device.device_type}
                          </p>

                          <p className="text-xs text-slate-400">
                            {formatNumber(
                              Number(device.sessions)
                            )} sessions
                          </p>

                        </div>

                      </div>

                    </div>


                    <div className="mt-6">

                      <p className="text-3xl font-semibold text-slate-950">

                        {Number(
                          device.conversion_percent
                        ).toFixed(2)}%

                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Purchase conversion
                      </p>

                    </div>


                    <div className="mt-5">

                      <div className="mb-2 flex justify-between text-xs">

                        <span className="text-slate-400">
                          Purchases
                        </span>

                        <span className="font-medium text-slate-700">

                          {formatNumber(
                            Number(
                              device.purchase_sessions
                            )
                          )}

                        </span>

                      </div>


                      <div className="h-2 rounded-full bg-slate-100">

                        <div
                          className="h-2 rounded-full bg-slate-900"
                          style={{
                            width: `${Math.min(
                              Number(
                                device.conversion_percent
                              ) * 10,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

          </section>


          {/* ================================================== */}
          {/* DIAGNOSTIC INSIGHT */}
          {/* ================================================== */}

          {largestDropOff && (

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex gap-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">

                  <AlertTriangle className="h-5 w-5 text-slate-700" />

                </div>


                <div className="flex-1">

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Largest Funnel Drop-off
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-950">

                    {largestDropOff.from}

                    <ArrowRight className="mx-2 inline h-4 w-4 text-slate-400" />

                    {largestDropOff.to}

                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">

                    Approximately{" "}

                    <strong className="font-semibold text-slate-900">
                      {formatNumber(
                        largestDropOff.lost
                      )}
                    </strong>

                    {" "}users are lost at this stage,
                    representing a{" "}

                    <strong className="font-semibold text-slate-900">
                      {largestDropOff.percentage.toFixed(2)}%
                    </strong>

                    {" "}drop from the previous stage.

                  </p>

                </div>

              </div>

            </section>

          )}


          {/* ================================================== */}
          {/* PRODUCT RECOMMENDATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <CheckCircle2 className="h-5 w-5 text-white" />

              </div>


              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Recommendation
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Prioritize conversion optimization over traffic growth
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">

                  The purchase funnel shows meaningful user
                  attrition before purchase, while mobile
                  conversion trails desktop and tablet.
                  The next investigation should focus on
                  mobile cart, checkout, and payment UX.

                </p>

              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}