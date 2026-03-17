const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  useMerchant?: boolean;
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, useMerchant = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined" && useMerchant) {
    const merchantId = localStorage.getItem("merchantId");
    if (merchantId) {
      headers["x-merchant-id"] = merchantId;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.message || "Terjadi kesalahan");
  }

  return result;
}

export const api = {
  get: <T = any>(endpoint: string, useMerchant = false) =>
    apiFetch<T>(endpoint, { method: "GET", useMerchant }),

  post: <T = any>(endpoint: string, body?: unknown, useMerchant = false) =>
    apiFetch<T>(endpoint, { method: "POST", body, useMerchant }),

  patch: <T = any>(endpoint: string, body?: unknown, useMerchant = false) =>
    apiFetch<T>(endpoint, { method: "PATCH", body, useMerchant }),

  delete: <T = any>(endpoint: string, useMerchant = false) =>
    apiFetch<T>(endpoint, { method: "DELETE", useMerchant }),
};