import { apiClient } from "@/shared/api/apiClient";

export const getStatistics = async () => {
  const response = await apiClient.get("/contracts/statistics");

  return response.data;
};
