import { apiClient } from "@/shared/api/apiClient";

export const deleteStation = async (id: number) => {
  const response = await apiClient.delete(`/stations/${id}`);
  return response.data;
};
