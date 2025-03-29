import { apiClient } from "@/shared/api/apiClient";

export interface GetCultureData {
  id: number;
  name: string;
  code: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getStations = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<GetCultureData>> => {
  const response = await apiClient.get("/stations", {
    params: { page, limit },
  });
  return response.data;
};
