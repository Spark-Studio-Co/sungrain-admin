import { apiClient } from "@/shared/api/apiClient";

export const deleteCulture = async (name: string) => {
  const response = await apiClient.delete(`/culture/${name}`);
  return response.data;
};
