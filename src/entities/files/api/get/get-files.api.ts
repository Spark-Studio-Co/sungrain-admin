import { apiClient } from "@/shared/api/apiClient";

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
}

export const getMyFiles = async (): Promise<FileData[]> => {
  const response = await apiClient.get("/user/my-files");
  return response.data;
};
