import { apiClient } from "@/shared/api/apiClient";

export interface CreateReceiverData {
  name: string;
}

export const createReceiver = async (
  data: CreateReceiverData
): Promise<any> => {
  const response = await apiClient.post(`/receiver/`, data);
  return response.data;
};
