import { apiClient } from "@/shared/api/apiClient";

export const refreshToken = async () => {
  const response = await apiClient.post("/auth/refresh");
  return response.data;
};
