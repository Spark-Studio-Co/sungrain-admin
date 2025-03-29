import { apiClient } from "@/shared/api/apiClient";

export interface UpdateStationData {
  id: number;
}

export const updateStation = async (data: UpdateStationData) => {
  const response = await apiClient.patch(`/culture/${data.id}`, data);
  return response.data;
};
