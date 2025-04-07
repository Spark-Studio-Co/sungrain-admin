import { apiClient } from "@/shared/api/apiClient";

export const deleteContract = async (id: number) => {
  const response = await apiClient.delete(`/contract/${id}`);
  return response.data;
};
