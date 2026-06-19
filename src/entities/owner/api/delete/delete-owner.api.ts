import { apiClient } from "@/shared/api/apiClient";

export interface DeleteOwnerResponse {
  message: string;
}

export const deleteOwner = async (id: number | string) => {
  const response = await apiClient.delete<DeleteOwnerResponse>(`/owner/${id}`);
  return response.data;
};
