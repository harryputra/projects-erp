"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getActiveMerchant } from "@/lib/auth";

type Category = {
  id: string;
  name: string;
};

type Unit = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  reorderPoint: number;
  status: "active" | "inactive";
  stock: number;
  category: Category | null;
  unit: Unit | null;
};

export default function ProductsPage() {
  const merchant = getActiveMerchant();

  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    unitId: "",
    price: "",
    reorderPoint: "5",
    initialStock: "0",
  });

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [productRes, categoryRes, unitRes] = await Promise.all([
        api.get<{ success: boolean; data: Product[] }>("/master/products", true),
        api.get<{ success: boolean; data: Category[] }>("/master/categories", true),
        api.get<{ success: boolean; data: Unit[] }>("/master/units", true),
      ]);

      setItems(productRes.data || []);
      setCategories(categoryRes.data || []);
      setUnits(unitRes.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await api.post(
        "/master/products",
        {
          name: form.name,
          sku: form.sku || undefined,
          categoryId: form.categoryId || null,
          unitId: form.unitId || null,
          price: Number(form.price),
          reorderPoint: Number(form.reorderPoint),
          initialStock: Number(form.initialStock),
        },
        true
      );

      setForm({
        name: "",
        sku: "",
        categoryId: "",
        unitId: "",
        price: "",
        reorderPoint: "5",
        initialStock: "0",
      });

      await loadAll();
    } catch (err: any) {
      setError(err.message || "Gagal menambah produk");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    const ok = window.confirm("Nonaktifkan produk ini?");
    if (!ok) return;

    try {
      setError("");
      await api.patch(`/master/products/${id}/deactivate`, {}, true);
      await loadAll();
    } catch (err: any) {
      setError(err.message || "Gagal menonaktifkan produk");
    }
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Products
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Merchant: {merchant?.merchantName || "-"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 xl:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Add Product
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Product Name"
              value={form.name}
              onChange={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="Contoh: Teh Botol"
            />
            <Input
              label="SKU"
              value={form.sku}
              onChange={(v) => setForm((p) => ({ ...p, sku: v }))}
              placeholder="TB001"
            />

            <Select
              label="Category"
              value={form.categoryId}
              onChange={(v) => setForm((p) => ({ ...p, categoryId: v }))}
              options={categories.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />

            <Select
              label="Unit"
              value={form.unitId}
              onChange={(v) => setForm((p) => ({ ...p, unitId: v }))}
              options={units.map((item) => ({
                label: item.name,
                value: item.id,
              }))}
            />

            <Input
              label="Price"
              type="number"
              value={form.price}
              onChange={(v) => setForm((p) => ({ ...p, price: v }))}
              placeholder="5000"
            />

            <Input
              label="Reorder Point"
              type="number"
              value={form.reorderPoint}
              onChange={(v) => setForm((p) => ({ ...p, reorderPoint: v }))}
              placeholder="5"
            />

            <Input
              label="Initial Stock"
              type="number"
              value={form.initialStock}
              onChange={(v) => setForm((p) => ({ ...p, initialStock: v }))}
              placeholder="0"
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add Product"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Product List
            </h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product..."
              className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
            />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada produk.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white/90">
                        {item.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        SKU: {item.sku || "-"} • Category: {item.category?.name || "-"} • Unit:{" "}
                        {item.unit?.name || "-"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Price: Rp {item.price.toLocaleString("id-ID")} • Stock: {item.stock} •
                        Reorder Point: {item.reorderPoint}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.status === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.status === "active" && (
                        <button
                          onClick={() => handleDeactivate(item.id)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
      >
        <option value="">Select {label}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}