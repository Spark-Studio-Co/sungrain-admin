import { apiClient } from "@/shared/api/apiClient";

export const exportTable = async (): Promise<any> => {
  const response = await apiClient.get("/user/export-all");
  return response.data;
};
