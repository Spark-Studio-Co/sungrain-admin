import { apiClient } from "@/shared/api/apiClient";

export interface CultureData {
  name: string;
  old_name?: string;
}

export const addCulture = async (data: CultureData) => {
  const response = await apiClient.post("/culture", data);
  return response.data;
};
