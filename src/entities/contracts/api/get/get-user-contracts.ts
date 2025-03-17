import { apiClient } from "@/shared/api/apiClient";

export const getUserContracts = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get("/user/my-contracts", {
    params: { page, limit },
  });
  return response.data;
};
