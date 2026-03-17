"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getActiveMerchant } from "@/lib/auth";

type StockItem = {
  stockId: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  reorderPoint: number;
  isLowStock: boolean;
  status: string;
  price: number;
  category: { id: string; name: string } | null;
  unit: { id: string; name: string } | null;
  updatedAt: string;
};

export default function StocksPage() {
  const merchant = getActiveMerchant();

  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    type: "add",
    quantity: "0",
    note: "",
  });

  async function loadStocks() {
    try {
      setLoading(true);
      setError("");

      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (lowOnly) query.set("lowStock", "true");

      const result = await api.get<{ success: boolean; data: StockItem[] }>(
        `/stocks${query.toString() ? `?${query.toString()}` : ""}`,
        true
      );

      setItems(result.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat stok");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStocks();
  }, [lowOnly]);

  async function handleAdjust(productId: string) {
    try {
      setError("");
      await api.patch(
        `/stocks/${productId}/adjust`,
        {
          type: adjustForm.type,
          quantity: Number(adjustForm.quantity),
          note: adjustForm.note,
        },
        true
      );

      setAdjustingId(null);
      setAdjustForm({
        type: "add",
        quantity: "0",
        note: "",
      });
      await loadStocks();
    } catch (err: any) {
      setError(err.message || "Gagal adjustment stok");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Stocks
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Merchant: {merchant?.merchantName || "-"}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock..."
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
            />
            <button
              onClick={loadStocks}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            >
              Search
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Low stock only
          </label>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Tidak ada data stok.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.stockId}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      SKU: {item.sku || "-"} • Category: {item.category?.name || "-"} • Unit:{" "}
                      {item.unit?.name || "-"}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Qty: {item.quantity} • Reorder Point: {item.reorderPoint} • Price: Rp{" "}
                      {item.price.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.isLowStock
                          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                          : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                      }`}
                    >
                      {item.isLowStock ? "Low Stock" : "Safe"}
                    </span>

                    <button
                      onClick={() => setAdjustingId(adjustingId === item.productId ? null : item.productId)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
                    >
                      Adjust
                    </button>
                  </div>
                </div>

                {adjustingId === item.productId && (
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-dashed border-gray-300 p-4 dark:border-gray-700 md:grid-cols-4">
                    <select
                      value={adjustForm.type}
                      onChange={(e) =>
                        setAdjustForm((prev) => ({ ...prev, type: e.target.value }))
                      }
                      className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none dark:border-gray-700"
                    >
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="set">Set</option>
                    </select>

                    <input
                      type="number"
                      value={adjustForm.quantity}
                      onChange={(e) =>
                        setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))
                      }
                      placeholder="Quantity"
                      className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none dark:border-gray-700"
                    />

                    <input
                      type="text"
                      value={adjustForm.note}
                      onChange={(e) =>
                        setAdjustForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="Note"
                      className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none dark:border-gray-700"
                    />

                    <button
                      onClick={() => handleAdjust(item.productId)}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      Save Adjustment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}