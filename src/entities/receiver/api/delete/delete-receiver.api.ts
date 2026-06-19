import { apiClient } from "@/shared/api/apiClient";

export const deleteReceiver = async (id: any): Promise<any> => {
  const response = await apiClient.delete(`/receiver/${id}`);
  return response.data;
};
