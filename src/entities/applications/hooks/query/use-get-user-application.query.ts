import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";
import { retryUserContractRequest } from "@/entities/contracts/hooks/query/user-contract-retry";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { getTokenUserId } from "@/shared/users/navigation-profile";

export const useGetUserApplication = (applicationId: string, enabled = true) => {
  const token = useAuthData((state) => state.token);
  const userId = useAuthData((state) => state.userId);
  return useQuery({
    queryKey: ["user-application", applicationId, getTokenUserId(token) ?? userId],
    queryFn: async () => (await apiClient.get(`/user/my-application/${applicationId}`)).data,
    enabled: !!applicationId && enabled && Boolean(token),
    retry: retryUserContractRequest,
  });
};
