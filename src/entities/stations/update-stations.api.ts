import { apiClient } from "@/shared/api/apiClient";

export interface UpdateStationData {
  id: number;
  name: string;
}

export const updateStation = async (data: UpdateStationData) => {
  const response = await apiClient.patch(`/stations/${data.id}`, data);
  return response.data;
};
