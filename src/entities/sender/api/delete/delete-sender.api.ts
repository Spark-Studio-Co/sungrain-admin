import { apiClient } from "@/shared/api/apiClient";

export const deleteSender = async (id: any): Promise<any> => {
  const response = await apiClient.delete(`/sender/${id}`);
  return response.data;
};
