"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { saveActiveMerchant } from "@/lib/auth";

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

export default function SelectMerchantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [merchants, setMerchants] = useState<MeResponse["data"]["merchants"]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const result = await api.get<MeResponse>("/auth/me");
        setUserName(result.data.user.name);

        const merchantList = result.data.merchants || [];
        setMerchants(merchantList);

        if (merchantList.length === 0) {
          router.push("/create-merchant");
          return;
        }

        if (merchantList.length === 1) {
          saveActiveMerchant({
            merchantUserId: merchantList[0].merchantUserId,
            merchantId: merchantList[0].merchantId,
            merchantName: merchantList[0].merchantName,
            role: merchantList[0].role,
          });
          router.push("/admin/dashboard");
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat merchant");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  function handleSelect(merchant: MeResponse["data"]["merchants"][0]) {
    saveActiveMerchant({
      merchantUserId: merchant.merchantUserId,
      merchantId: merchant.merchantId,
      merchantName: merchant.merchantName,
      role: merchant.role,
    });

    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-white px-4 py-10 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5">
          <Link
            href="/signin"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Back
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Select Merchant
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Halo {userName || "User"}, pilih merchant yang ingin kamu kelola.
            </p>
          </div>

          {loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading merchant...
            </p>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && merchants.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {merchants.map((merchant) => (
                <button
                  key={merchant.merchantUserId}
                  onClick={() => handleSelect(merchant)}
                  className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-theme-xs transition hover:border-brand-500 hover:shadow-md dark:border-gray-800 dark:bg-white/5"
                >
                  <div className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                    {merchant.merchantName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Role: {merchant.role}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Status: {merchant.merchantStatus}
                  </div>

                  <div className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                    Masuk Merchant
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}