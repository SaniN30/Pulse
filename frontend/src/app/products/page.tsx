"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";

import {
  api,
  CategoryPerformance,
  ProductPerformance,
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


export default function ProductsPage() {

  const [categories, setCategories] =
    useState<CategoryPerformance[]>([]);

  const [products, setProducts] =
    useState<ProductPerformance[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {

    async function loadProducts() {

      try {

        const [
          categoryData,
          productData,
        ] = await Promise.all([
          api.categories(),
          api.products(20),
        ]);

        setCategories(categoryData);
        setProducts(productData);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product analytics"
        );

      } finally {

        setLoading(false);

      }
    }

    loadProducts();

  }, []);


  const metrics = useMemo(() => {

    const revenue = categories.reduce(
      (sum, category) =>
        sum + Number(category.revenue),
      0
    );

    const units = categories.reduce(
      (sum, category) =>
        sum + Number(category.units_sold),
      0
    );

    const grossProfit =
      categories.reduce(
        (sum, category) =>
          sum +
          Number(
            category.estimated_gross_profit
          ),
        0
      );

    const averageMargin =
      revenue > 0
        ? (grossProfit / revenue) * 100
        : 0;

    return {
      revenue,
      units,
      grossProfit,
      averageMargin,
    };

  }, [categories]);


  const sortedCategories =
    [...categories].sort(
      (a, b) =>
        Number(b.revenue) -
        Number(a.revenue)
    );


  const sortedProducts =
    [...products].sort(
      (a, b) =>
        Number(b.revenue) -
        Number(a.revenue)
    );


  const topCategory =
    sortedCategories[0] || null;


  const highestMarginCategory =
    [...categories].sort(
      (a, b) =>
        Number(b.gross_margin_percent) -
        Number(a.gross_margin_percent)
    )[0] || null;


  const topProduct =
    sortedProducts[0] || null;


  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-sm text-slate-500">
          Loading product analytics...
        </div>

      </main>
    );
  }


  if (error) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">

          <h1 className="font-semibold text-slate-950">
            Unable to load product data
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


          <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-950">

            <Package className="h-4 w-4" />

            Products

          </div>


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
              Product Intelligence
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Products & Categories
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Understand which products and categories
              drive revenue, volume, and estimated
              gross profit.
            </p>

          </div>


          {/* ================================================== */}
          {/* KPI GRID */}
          {/* ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Product Revenue
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(metrics.revenue)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Across analyzed categories
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Units Sold
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatNumber(metrics.units)}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Total product units
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Estimated Gross Profit
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatCurrency(
                  metrics.grossProfit
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Based on product cost assumptions
              </p>

            </div>


            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <p className="text-sm text-slate-500">
                Estimated Gross Margin
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {formatPercent(
                  metrics.averageMargin
                )}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Gross profit / revenue
              </p>

            </div>

          </div>


          {/* ================================================== */}
          {/* CATEGORY PERFORMANCE */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <h2 className="font-semibold text-slate-950">
                Category Performance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revenue and profitability by category
              </p>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Category
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Orders
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Units
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Revenue
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Gross Profit
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Margin
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {sortedCategories.map(
                    (category) => {

                      return (

                        <tr
                          key={
                            category.category_name
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">

                                <Package className="h-4 w-4 text-slate-600" />

                              </div>

                              <span className="text-sm font-medium text-slate-900">
                                {category.category_name}
                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                category.orders
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                category.units_sold
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">

                            {formatCurrency(
                              Number(
                                category.revenue
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatCurrency(
                              Number(
                                category.estimated_gross_profit
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right">

                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">

                              {formatPercent(
                                Number(
                                  category.gross_margin_percent
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
          {/* CATEGORY REVENUE BARS */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <h2 className="font-semibold text-slate-950">
                Revenue by Category
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Relative contribution to product revenue
              </p>

            </div>


            <div className="space-y-5">

              {sortedCategories.map(
                (category) => {

                  const revenue =
                    Number(category.revenue);

                  const width =
                    metrics.revenue > 0
                      ? (revenue / metrics.revenue) *
                        100
                      : 0;

                  return (

                    <div
                      key={
                        category.category_name
                      }
                    >

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-medium text-slate-800">
                          {category.category_name}
                        </span>

                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(revenue)}
                        </span>

                      </div>


                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{
                            width: `${Math.max(
                              width,
                              2
                            )}%`,
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
          {/* TOP PRODUCTS */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-6">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="font-semibold text-slate-950">
                    Top Products
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Highest revenue-generating products
                  </p>

                </div>

                <TrendingUp className="h-5 w-5 text-slate-400" />

              </div>

            </div>


            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">

                    <th className="px-6 py-4 font-medium">
                      Product
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Brand
                    </th>

                    <th className="px-6 py-4 font-medium">
                      Category
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Units
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Revenue
                    </th>

                    <th className="px-6 py-4 text-right font-medium">
                      Est. Profit
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {sortedProducts.map(
                    (product, index) => {

                      return (

                        <tr
                          key={
                            product.product_id
                          }
                          className="border-b border-slate-100 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">

                                {index + 1}

                              </div>

                              <span className="max-w-[220px] truncate text-sm font-medium text-slate-900">

                                {product.product_name}

                              </span>

                            </div>

                          </td>


                          <td className="px-6 py-4 text-sm text-slate-600">
                            {product.brand}
                          </td>


                          <td className="px-6 py-4 text-sm text-slate-600">
                            {product.category_name}
                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatNumber(
                              Number(
                                product.units_sold
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm font-medium text-slate-900">

                            {formatCurrency(
                              Number(
                                product.revenue
                              )
                            )}

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-slate-600">

                            {formatCurrency(
                              Number(
                                product.estimated_gross_profit
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
          {/* PRODUCT INSIGHTS */}
          {/* ================================================== */}

          <section className="mt-6 grid gap-6 lg:grid-cols-3">

            {topCategory && (

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <Package className="h-5 w-5 text-slate-700" />

                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Revenue Leader
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {topCategory.category_name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">

                  Generated{" "}

                  <strong className="font-semibold text-slate-900">
                    {formatCurrency(
                      Number(
                        topCategory.revenue
                      )
                    )}
                  </strong>

                  {" "}in revenue.

                </p>

              </div>

            )}


            {highestMarginCategory && (

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <TrendingUp className="h-5 w-5 text-slate-700" />

                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Margin Leader
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {highestMarginCategory.category_name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">

                  Estimated gross margin of{" "}

                  <strong className="font-semibold text-slate-900">
                    {formatPercent(
                      Number(
                        highestMarginCategory.gross_margin_percent
                      )
                    )}
                  </strong>

                  .

                </p>

              </div>

            )}


            {topProduct && (

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">

                  <CheckCircle2 className="h-5 w-5 text-slate-700" />

                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Top Product
                </p>

                <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                  {topProduct.product_name}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">

                  Generated{" "}

                  <strong className="font-semibold text-slate-900">
                    {formatCurrency(
                      Number(
                        topProduct.revenue
                      )
                    )}
                  </strong>

                  {" "}in revenue.

                </p>

              </div>

            )}

          </section>


          {/* ================================================== */}
          {/* PRODUCT RECOMMENDATION */}
          {/* ================================================== */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">

            <div className="flex gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <TrendingUp className="h-5 w-5" />

              </div>


              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Product Recommendation
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                  Balance revenue growth with margin optimization
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">

                  Use category-level revenue and estimated
                  gross margin together when prioritizing
                  products. High-revenue categories can drive
                  scale, while high-margin categories may offer
                  stronger profitability opportunities.

                </p>

              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}