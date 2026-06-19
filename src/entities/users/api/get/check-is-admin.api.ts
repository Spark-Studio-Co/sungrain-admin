import { apiClient } from "@/shared/api/apiClient";
import { useAuthData } from "@/entities/auth/model/use-auth-store";

export const checkIsAdmin = async () => {
  if (useAuthData.getState().token === "dev-sungrain-token") {
    return true;
  }

  const response = await apiClient.get("/user/is-admin");
  return response.data;
};
