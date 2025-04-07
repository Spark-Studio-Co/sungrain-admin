import { apiClient } from "@/shared/api/apiClient";

export const deleteInvoice = async (id: number | string) => {
  const response = await apiClient.delete(`/invoice/${id}`);
  return response.data;
};
