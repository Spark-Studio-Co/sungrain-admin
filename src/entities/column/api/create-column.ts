import { apiClient } from "@/shared/api/apiClient";

export interface AddColumnRequest {
  tableName: string;
  name: string;
  type: string;
}

export const addColumnToTable = async (data: AddColumnRequest) => {
  const response = await apiClient.patch("/table/add-column", data);
  return response.data;
};
