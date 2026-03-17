"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getActiveMerchant } from "@/lib/auth";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: string;
};

type Sale = {
  saleId: string;
  invoiceNumber: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  totalItems: number;
  cashier: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
};

type CartItem = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
};

export default function SalesPage() {
  const merchant = getActiveMerchant();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [productRes, salesRes] = await Promise.all([
        api.get<{ success: boolean; data: Product[] }>(
          "/master/products?status=active",
          true
        ),
        api.get<{ success: boolean; data: Sale[] }>("/sales", true),
      ]);

      const activeProducts = (productRes.data || []).filter(
        (item) => item.status === "active" && item.stock > 0
      );

      setProducts(activeProducts);
      setSales(salesRes.data || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data penjualan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function updateQty(productId: string, type: "plus" | "minus") {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;

          if (type === "plus" && item.quantity < item.stock) {
            return { ...item, quantity: item.quantity + 1 };
          }

          if (type === "minus") {
            return { ...item, quantity: item.quantity - 1 };
          }

          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  }

  async function handleCreateSale(e: FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Keranjang masih kosong");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await api.post(
        "/sales",
        {
          paymentMethod,
          discountAmount: Number(discountAmount),
          items: cart.map((item) => ({
            productId: Number(item.productId),
            quantity: item.quantity,
          })),
        },
        true
      );

      setCart([]);
      setPaymentMethod("cash");
      setDiscountAmount("0");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Gagal membuat transaksi penjualan");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredProducts = products.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - Number(discountAmount || 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Sales / POS
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Merchant: {merchant?.merchantName || "-"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5 xl:col-span-2">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Available Products
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
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada produk tersedia.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                >
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Harga: Rp {item.price.toLocaleString("id-ID")}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Stock: {item.stock}
                  </p>

                  <button
                    onClick={() => addToCart(item)}
                    className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            Cart
          </h2>

          <form onSubmit={handleCreateSale} className="space-y-4">
            <div className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Keranjang kosong.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-xl border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <p className="font-medium text-gray-800 dark:text-white/90">
                      {item.productName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rp {item.price.toLocaleString("id-ID")} x {item.quantity}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, "minus")}
                        className="h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-700"
                      >
                        -
                      </button>
                      <span className="min-w-[24px] text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, "plus")}
                        className="h-8 w-8 rounded-lg border border-gray-300 dark:border-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm outline-none dark:border-gray-700"
              >
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Discount Amount
              </label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm outline-none dark:border-gray-700"
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>Discount</span>
                <span>Rp {Number(discountAmount || 0).toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>Rp {Math.max(total, 0).toLocaleString("id-ID")}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {submitting ? "Processing..." : "Create Sale"}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Sales History
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : sales.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Belum ada transaksi penjualan.
          </p>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.saleId}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">
                      {sale.invoiceNumber}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Cashier: {sale.cashier?.name || "-"} • Items: {sale.totalItems}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Payment: {sale.paymentMethod} • Discount: Rp{" "}
                      {sale.discountAmount.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-gray-800 dark:text-white/90">
                      Rp {sale.totalAmount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(sale.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}