import { apiClient } from "@/shared/api/apiClient";

export const getApplication = async (applicationId: string) => {
  const response = await apiClient.get(`/application/by-id/${applicationId}`);

  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  return data;
};
