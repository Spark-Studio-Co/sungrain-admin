import { apiClient } from "@/shared/api/apiClient";

export interface GetCompanyData {
  id: number;
  name: string;
  users: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  lastPage: number;
  total: number;
  totalPages: number;
}

export const getCompanies = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<GetCompanyData>> => {
  const response = await apiClient.get("/company", {
    params: { page, limit },
  });
  return response.data;
};
