import { apiClient } from "@/shared/api/apiClient";
import { shouldBypassAuthLocally } from "@/shared/auth/dev-session";
import { useAuthData } from "@/entities/auth/model/use-auth-store";

export type UserAccess = {
  isAdmin: boolean;
  canAccessApproach: boolean;
};

export const getUserAccess = async (): Promise<UserAccess> => {
  if (
    shouldBypassAuthLocally() &&
    useAuthData.getState().token === "dev-sungrain-token"
  ) {
    return { isAdmin: true, canAccessApproach: true };
  }

  const response = await apiClient.get<UserAccess>("/user/access");
  return response.data;
};
