"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";


export default function Sidebar() {

  const pathname = usePathname();


  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };


  const activeClass =
    "bg-slate-100 font-medium text-slate-950";

  const inactiveClass =
    "text-slate-500 hover:bg-slate-50 hover:text-slate-900";


  return (

    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">

      {/* BRAND */}

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


      {/* NAVIGATION */}

      <nav className="space-y-1 p-4">

        {/* OVERVIEW */}

        <Link
          href="/"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/")
              ? activeClass
              : inactiveClass
          }`}
        >

          <LayoutDashboard className="h-4 w-4 shrink-0" />

          <span>
            Overview
          </span>

        </Link>


        {/* CONVERSION */}

        <Link
          href="/conversion"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/conversion")
              ? activeClass
              : inactiveClass
          }`}
        >

          <BarChart3 className="h-4 w-4 shrink-0" />

          <span>
            Conversion
          </span>

        </Link>


        {/* PAYMENTS */}

        <Link
          href="/payments"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/payments")
              ? activeClass
              : inactiveClass
          }`}
        >

          <CreditCard className="h-4 w-4 shrink-0" />

          <span>
            Payments
          </span>

        </Link>


        {/* PRODUCTS */}

        <Link
          href="/products"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/products")
              ? activeClass
              : inactiveClass
          }`}
        >

          <Package className="h-4 w-4 shrink-0" />

          <span>
            Products
          </span>

        </Link>


        {/* CUSTOMERS */}

        <Link
          href="/customers"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/customers")
              ? activeClass
              : inactiveClass
          }`}
        >

          <Users className="h-4 w-4 shrink-0" />

          <span>
            Customers
          </span>

        </Link>


        {/* EXPERIMENTS */}

        <Link
          href="/experiments"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
            isActive("/experiments")
              ? activeClass
              : inactiveClass
          }`}
        >

          <FlaskConical className="h-4 w-4 shrink-0" />

          <span>
            Experiments
          </span>

        </Link>

      </nav>


      {/* SYSTEM STATUS */}

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">

        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">

          <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-600" />

          <div>

            <p className="text-xs font-medium text-slate-700">
              System operational
            </p>

            <p className="text-[11px] text-slate-400">
              Analytics services connected
            </p>

          </div>

        </div>

      </div>

    </aside>
  );
}