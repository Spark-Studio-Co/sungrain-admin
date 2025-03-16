import { apiClient } from "@/shared/api/apiClient";

export const getContractById = async (id: string) => {
  const response = await apiClient.get(`/contract/${id}`);
  return response.data;
};
