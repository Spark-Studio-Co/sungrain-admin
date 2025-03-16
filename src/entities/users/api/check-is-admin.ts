import { apiClient } from "@/shared/api/apiClient";

export const checkIsAdmin = async () => {
  const response = await apiClient.get("/user/is-admin");
  return response.data;
};
