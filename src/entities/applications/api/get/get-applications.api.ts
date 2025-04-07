import { apiClient } from "@/shared/api/apiClient";

export const getApplications = async (contractId: string) => {
  const response = await apiClient.get(`/application/${contractId}`);
  return response.data;
};
