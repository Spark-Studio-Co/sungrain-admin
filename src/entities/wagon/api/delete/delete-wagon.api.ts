import { apiClient } from "@/shared/api/apiClient";

export const deleteWagon = async (id: number | string) => {
  const response = await apiClient.delete(`/wagon/${id}`);
  return response.data;
};
