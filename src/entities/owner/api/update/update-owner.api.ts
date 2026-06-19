import { apiClient } from "@/shared/api/apiClient";

export interface UpdateOwnerResponse {
  data: any;
  message: string;
}

export const updateOwner = async (id: number | string, data: any) => {
  const response = await apiClient.patch<UpdateOwnerResponse>(
    `/owner/${id}`,
    data
  );
  return response.data;
};
