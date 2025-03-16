import { apiClient } from "@/shared/api/apiClient";

export interface AddWagonRequest {
  number: string;
  capacity: number;
  owner: string;
}

export const addWagon = async (data: AddWagonRequest) => {
  const response = await apiClient.post("/wagons", data);
  return response.data;
};
