import { apiClient } from "@/shared/api/apiClient";

export interface Receiver {
  id: string;
  name: string;
}

export interface PaginatedReceiversResponse {
  data: Receiver[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getReceivers = async (
  page: number,
  limit: number
): Promise<PaginatedReceiversResponse> => {
  const response = await apiClient.get("/receiver", {
    params: { page, limit },
  });
  return response.data;
};
