import { apiClient } from "@/shared/api/apiClient";

export interface CreateSenderData {
  name: string;
}

export const createSender = async (data: CreateSenderData): Promise<any> => {
  const response = await apiClient.post("/sender", data);
  return response.data;
};
