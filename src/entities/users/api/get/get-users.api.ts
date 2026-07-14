import { apiClient } from "@/shared/api/apiClient";

// ✅ Fetch Contracts with Pagination & Search
export const getUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role = "all",
  excludeAdmin = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  excludeAdmin?: boolean;
}) => {
  const response = await apiClient.get("/user/all", {
    params: { page, limit, search, role, excludeAdmin },
  });
  return response.data;
};
