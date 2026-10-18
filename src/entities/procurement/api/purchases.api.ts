import { apiClient } from "@/shared/api/apiClient";

export type VatMode = "NONE" | "EXCLUSIVE" | "INCLUSIVE";
export type FarmOption = {
  id: number;
  organizationName: string;
  leaderName: string | null;
  phone: string | null;
  district: string | null;
};
export type PurchaseValues = {
  farmId?: number;
  cultureName: string;
  quantity: string;
  unitPrice: string;
  currency: string;
  vatMode: VatMode;
  vatRate: string;
  agreementNumber: string;
  agreementDate: string;
  notes: string;
};
export type Purchase = Omit<PurchaseValues, "farmId"> & {
  id: string;
  sourceFarmId: number | null;
  farmerName: string;
  farmerLeader: string | null;
  farmerPhone: string | null;
  farmerDistrict: string | null;
  netAmount: string;
  vatAmount: string;
  totalAmount: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  document: { id: string; name: string; mimeType: string; size: number } | null;
};
export type PurchaseFilters = {
  search?: string;
  culture?: string;
  from?: string;
  to?: string;
  page?: number;
};
export type PurchaseList = {
  rows: Purchase[];
  total: number;
  page: number;
  pageSize: number;
  cultures: string[];
};
export type PurchaseOptions = { farms: FarmOption[]; cultures: string[] };
export const PURCHASES_KEY = ["procurement-purchases"];

export const getPurchases = async (params: PurchaseFilters) =>
  (await apiClient.get<PurchaseList>("/procurement/purchases", { params }))
    .data;
export const getPurchase = async (id: string) =>
  (await apiClient.get<Purchase>(`/procurement/purchases/${id}`)).data;
export const getPurchaseOptions = async (search = "", selectedId?: number) =>
  (
    await apiClient.get<PurchaseOptions>("/procurement/purchases/options", {
      params: { search, selectedId },
    })
  ).data;

export async function savePurchase({
  values,
  file,
  removeDocument,
  id,
  version,
  requestId,
}: {
  values: PurchaseValues;
  file?: File;
  removeDocument?: boolean;
  id?: string;
  version?: number;
  requestId?: string;
}) {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) form.append(key, String(value));
  });
  if (file) form.append("file", file);
  if (removeDocument) form.append("removeDocument", "true");
  if (version) form.append("version", String(version));
  if (requestId) form.append("requestId", requestId);
  const response = id
    ? await apiClient.patch<Purchase>(`/procurement/purchases/${id}`, form)
    : await apiClient.post<Purchase>("/procurement/purchases", form);
  return response.data;
}

export async function downloadAgreement(purchase: Purchase) {
  const response = await apiClient.get<Blob>(
    `/procurement/purchases/${purchase.id}/document`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = purchase.document?.name || "agreement.pdf";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
