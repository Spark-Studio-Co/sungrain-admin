import { apiClient } from "@/shared/api/apiClient";

export const deleteCompany = async (name: string) => {
  const response = await apiClient.delete(`/company/${name}`);
  return response.data;
};
