import { apiClient } from "@/shared/api/apiClient";

export interface UpdateReceiverData {
  id: string | number;
  name: string;
}

export const updateReceiver = async (
  data: UpdateReceiverData
): Promise<any> => {
  const response = await apiClient.patch(`/receiver/${data.id}`, data);
  return response.data;
};
