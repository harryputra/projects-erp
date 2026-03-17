"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { FormEvent, useMemo, useState } from "react";
import { api } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fullName = useMemo(() => {
    return `${form.firstName} ${form.lastName}`.trim();
  }, [form.firstName, form.lastName]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!form.agree) {
      setError("Anda harus menyetujui Terms dan Privacy Policy.");
      setLoading(false);
      return;
    }

    try {
      const result = await api.post("/auth/register", {
        name: fullName,
        email: form.email,
        password: form.password,
      });

      setSuccess(result.message || "Registrasi berhasil");

      setTimeout(() => {
        router.push("/signin");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Back to home
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-white/5">
          <div className="mb-6">
            <h1 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign up.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 pr-14 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white/90"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, agree: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  By creating an account means you agree to the Terms and Conditions and our Privacy Policy
                </span>
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-5">
            <p className="text-sm text-gray-700 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}