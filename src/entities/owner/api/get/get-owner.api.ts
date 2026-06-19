import { apiClient } from "@/shared/api/apiClient";

export interface GetOwnerResponse {
  data: any;
}

export const getOwner = async (id: number | string) => {
  const response = await apiClient.get<GetOwnerResponse>(`/owner/${id}`);
  return response.data;
};
