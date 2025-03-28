import { apiClient } from "@/shared/api/apiClient";

export const exportTable = async (): Promise<Blob> => {
  const response = await apiClient.get("/user/export-all", {
    responseType: "blob",
  });
  return response.data;
};