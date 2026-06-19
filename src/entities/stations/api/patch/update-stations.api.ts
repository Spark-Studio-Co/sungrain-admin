import { apiClient } from "@/shared/api/apiClient";

export interface UpdateStationData {
  code: any;
  name: string;
}

export const updateStation = async (id: any, data: UpdateStationData) => {
  const response = await apiClient.patch(`/stations/${id}`, data);
  return response.data;
};
