import { apiClient } from "@/shared/api/apiClient";

export const createOwner = async (data: any) => {
  const response = await apiClient.post("/owner", data);
  return response.data;
};
