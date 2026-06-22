import { apiClient } from "@/shared/api/apiClient";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { shouldBypassAuthLocally } from "@/shared/auth/dev-session";

export const checkIsAdmin = async () => {
  if (
    shouldBypassAuthLocally() &&
    useAuthData.getState().token === "dev-sungrain-token"
  ) {
    return true;
  }

  const response = await apiClient.get("/user/is-admin");
  return response.data;
};
