export type MerchantItem = {
  merchantUserId: string;
  merchantId: string;
  merchantName: string;
  role: string;
  membershipStatus?: string;
  merchantStatus?: string;
};

export function saveActiveMerchant(merchant: MerchantItem) {
  localStorage.setItem("merchantId", merchant.merchantId);
  localStorage.setItem("merchantName", merchant.merchantName);
  localStorage.setItem("merchantRole", merchant.role);
}

export function clearActiveMerchant() {
  localStorage.removeItem("merchantId");
  localStorage.removeItem("merchantName");
  localStorage.removeItem("merchantRole");
}

export function getActiveMerchant() {
  if (typeof window === "undefined") return null;

  const merchantId = localStorage.getItem("merchantId");
  const merchantName = localStorage.getItem("merchantName");
  const merchantRole = localStorage.getItem("merchantRole");

  if (!merchantId) return null;

  return {
    merchantId,
    merchantName,
    role: merchantRole,
  };
}