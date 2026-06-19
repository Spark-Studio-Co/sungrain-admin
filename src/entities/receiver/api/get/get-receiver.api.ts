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
  limit: number,
  search?: string
): Promise<PaginatedReceiversResponse> => {
  const params: any = { page, limit };
  if (search && search.trim()) {
    params.search = search.trim();
  }

  const response = await apiClient.get("/receiver", {
    params,
  });
  return response.data;
};
