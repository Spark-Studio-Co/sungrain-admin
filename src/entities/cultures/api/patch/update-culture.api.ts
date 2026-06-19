import { apiClient } from "@/shared/api/apiClient";

export interface CultureData {
  name: string;
}

export const updateCulture = async (data: CultureData) => {
  const response = await apiClient.patch("/culture", data);
  return response.data;
};
