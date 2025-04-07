import { apiClient } from "@/shared/api/apiClient";

export interface UpdateSenderData {
  id: string | number;
  name: string;
}

export const updateSender = async (data: UpdateSenderData): Promise<any> => {
  const response = await apiClient.patch(`/sender/${data.id}`, data);
  return response.data;
};
