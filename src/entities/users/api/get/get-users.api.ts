import { apiClient } from "@/shared/api/apiClient";

// ✅ Fetch Contracts with Pagination & Search
export const getUsers = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get("/user/all", {
    params: { page, limit }, // ✅ Attach query params
  });
  return response.data;
};
