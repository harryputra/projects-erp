"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getActiveMerchant } from "@/lib/auth";

type Unit = {
  id: string;
  name: string;
};

export default function UnitsPage() {
  const [items, setItems] = useState<Unit[]>([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const merchant = getActiveMerchant();

  async function loadUnits() {
    try {
      setLoading(true);
      setError("");
      const result = await api.get<{ success: boolean; data: Unit[] }>(
        "/master/units",
        true
      );
      setItems(result.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat unit");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnits();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError("");
      await api.post("/master/units", { name }, true);
      setName("");
      await loadUnits();
    } catch (err: any) {
      setError(err.message || "Gagal menambah unit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: string) {
    try {
      setSubmitting(true);
      setError("");
      await api.patch(`/master/units/${id}`, { name: editName }, true);
      setEditId(null);
      setEditName("");
      await loadUnits();
    } catch (err: any) {
      setError(err.message || "Gagal mengubah unit");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Hapus unit ini?");
    if (!ok) return;

    try {
      setError("");
      await api.delete(`/master/units/${id}`, true);
      await loadUnits();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus unit");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Units
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Merchant: {merchant?.merchantName || "-"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 xl:col-span-1">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Add Unit
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Unit Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pcs"
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
              />
            </div>

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
              {submitting ? "Saving..." : "Add Unit"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Unit List
          </h2>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada unit.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between"
                >
                  {editId === item.id ? (
                    <div className="flex w-full flex-col gap-3 md:flex-row">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditId(null);
                            setEditName("");
                          }}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">ID: {item.id}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditId(item.id);
                            setEditName(item.name);
                          }}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}