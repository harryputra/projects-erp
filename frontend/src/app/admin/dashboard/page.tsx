"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { clearActiveMerchant, getActiveMerchant } from "@/lib/auth";

type DashboardResponse = {
  success: boolean;
  data: {
    metrics: {
      totalProducts: number;
      totalCategories: number;
      totalUsers: number;
      totalStockQuantity: number;
      lowStockCount: number;
      todaySales: number;
      monthSales: number;
      monthPurchases: number;
    };
    recentSales: {
      saleId: string;
      invoiceNumber: string;
      totalAmount: number;
      totalItems: number;
      cashier: {
        id: string;
        name: string;
      } | null;
      createdAt: string;
    }[];
    lowStockItems: {
      productId: string;
      productName: string;
      sku: string | null;
      quantity: number;
      reorderPoint: number;
      category: {
        id: string;
        name: string;
      } | null;
      unit: {
        id: string;
        name: string;
      } | null;
    }[];
  };
};

type MeResponse = {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      status: string;
    };
    merchants: {
      merchantUserId: string;
      merchantId: string;
      merchantName: string;
      merchantStatus: string;
      role: string;
    }[];
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID");
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardResponse["data"] | null>(null);
  const [user, setUser] = useState<MeResponse["data"]["user"] | null>(null);
  const [merchantName, setMerchantName] = useState("");
  const [merchantRole, setMerchantRole] = useState("");

  const metrics = useMemo(() => dashboard?.metrics, [dashboard]);

  useEffect(() => {
    async function initDashboard() {
      try {
        const activeMerchant = getActiveMerchant();

        if (!activeMerchant?.merchantId) {
          const meResult = await api.get<MeResponse>("/auth/me");
          setUser(meResult.data.user);

          const merchants = meResult.data.merchants || [];

          if (merchants.length === 0) {
            router.push("/create-merchant");
            return;
          }

          if (merchants.length > 1) {
            router.push("/select-merchant");
            return;
          }

          localStorage.setItem("merchantId", merchants[0].merchantId);
          localStorage.setItem("merchantName", merchants[0].merchantName);
          localStorage.setItem("merchantRole", merchants[0].role);

          setMerchantName(merchants[0].merchantName);
          setMerchantRole(merchants[0].role);
        } else {
          setMerchantName(activeMerchant.merchantName || "");
          setMerchantRole(activeMerchant.role || "");
        }

        const meData = await api.get<MeResponse>("/auth/me");
        setUser(meData.data.user);

        const dashboardResult = await api.get<DashboardResponse>(
          "/dashboard/summary",
          true
        );

        setDashboard(dashboardResult.data);
      } catch (err: any) {
        setError(err.message || "Gagal memuat dashboard");
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, [router]);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      clearActiveMerchant();
      router.push("/signin");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 dark:text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 shadow-theme-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Dashboard ERP
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {merchantName ? `Merchant aktif: ${merchantName}` : "Merchant aktif belum dipilih"}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.name} {merchantRole ? `• Role: ${merchantRole}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/select-merchant"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Switch Merchant
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-8 xl:grid-cols-4">
          <MetricCard title="Total Products" value={String(metrics?.totalProducts || 0)} subtitle="Produk aktif" />
          <MetricCard title="Total Categories" value={String(metrics?.totalCategories || 0)} subtitle="Kategori terdaftar" />
          <MetricCard title="Total Users" value={String(metrics?.totalUsers || 0)} subtitle="User merchant aktif" />
          <MetricCard title="Low Stock" value={String(metrics?.lowStockCount || 0)} subtitle="Produk stok menipis" />
        </div>

        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
            <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              Sales & Purchase Summary
            </h2>
            <div className="space-y-4">
              <SummaryRow label="Penjualan Hari Ini" value={formatCurrency(metrics?.todaySales || 0)} />
              <SummaryRow label="Penjualan Bulan Ini" value={formatCurrency(metrics?.monthSales || 0)} />
              <SummaryRow label="Purchase Bulan Ini" value={formatCurrency(metrics?.monthPurchases || 0)} />
              <SummaryRow label="Total Stock Qty" value={String(metrics?.totalStockQuantity || 0)} />
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Recent Sales
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                5 transaksi terakhir
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Cashier
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Items
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.recentSales?.length ? (
                    dashboard.recentSales.map((sale) => (
                      <tr
                        key={sale.saleId}
                        className="border-b border-gray-100 dark:border-gray-800"
                      >
                        <td className="px-3 py-3 text-sm text-gray-800 dark:text-white/90">
                          {sale.invoiceNumber}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {sale.cashier?.name || "-"}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {sale.totalItems}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatCurrency(sale.totalAmount)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(sale.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Belum ada transaksi penjualan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Low Stock Items
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Perlu restock
              </span>
            </div>

            <div className="space-y-3">
              {dashboard?.lowStockItems?.length ? (
                dashboard.lowStockItems.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-white/90">
                          {item.productName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          SKU: {item.sku || "-"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Category: {item.category?.name || "-"} • Unit: {item.unit?.name || "-"}
                        </p>
                      </div>

                      <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                        Low
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Qty</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Reorder Point</span>
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {item.reorderPoint}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Tidak ada stok menipis.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {value}
      </h3>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
        {value}
      </span>
    </div>
  );
}