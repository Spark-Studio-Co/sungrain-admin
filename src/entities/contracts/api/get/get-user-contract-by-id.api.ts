import { apiClient } from "@/shared/api/apiClient";

export const getUserContractById = async (id: string | number) => {
  const response = await apiClient.get(`/user/my-contract/${id}`);
  return response.data;
};
