import { apiClient } from "@/shared/api/apiClient";

export interface Sender {
  id: string;
  name: string;
}

export interface PaginatedSenderResponse {
  data: Sender[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getSenders = async (
  page: number,
  limit: number
): Promise<PaginatedSenderResponse> => {
  const response = await apiClient.get("/sender", {
    params: { page, limit },
  });
  return response.data;
};
