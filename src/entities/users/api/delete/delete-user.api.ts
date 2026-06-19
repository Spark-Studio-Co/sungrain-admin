import { apiClient } from "@/shared/api/apiClient";

export const deleteUser = async (id: string | number) => {
  const response = await apiClient.delete(`/user/${id}`);
  return response.data;
};
