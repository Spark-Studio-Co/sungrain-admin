import { apiClient } from "@/shared/api/apiClient";

export interface TableData {
  tableName: string;
  data: Record<string, any>;
}

export const addDataToTable = async (data: TableData) => {
  const response = await apiClient.post("/table/add-data", data);
  return response.data;
};
