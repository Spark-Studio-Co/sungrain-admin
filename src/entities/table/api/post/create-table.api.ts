import { apiClient } from "@/shared/api/apiClient";

export interface TableColumn {
  name: string;
  type: string;
}

export interface CreateTableRequest {
  name: string;
  columns: TableColumn[];
}

export const createTable = async (data: CreateTableRequest) => {
  const response = await apiClient.post("/table", data);
  return response.data;
};
