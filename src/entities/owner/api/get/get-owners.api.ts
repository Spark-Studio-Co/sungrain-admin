import { apiClient } from "@/shared/api/apiClient";

export interface GetOwnersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetOwnersResponse {
  data: any[];
  total: number;
  page: number;
  lastPage: number;
}

export const getOwners = async (params: GetOwnersParams = {}) => {
  const response = await apiClient.get<GetOwnersResponse>("/owner", {
    params,
  });
  return response.data;
};
