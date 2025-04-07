import { apiClient } from "@/shared/api/apiClient";

export interface StationData {
  name: string;
  code: string;
}

export const addStation = async (data: StationData) => {
  const response = await apiClient.post("/stations", data);
  return response.data;
};
