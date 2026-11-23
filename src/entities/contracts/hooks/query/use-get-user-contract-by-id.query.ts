import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getUserContractById } from "../../api/get/get-user-contract-by-id.api";
import { retryUserContractRequest } from "./user-contract-retry";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { getTokenUserId } from "@/shared/users/navigation-profile";

export const useGetUserContractById = (
  id: string | number,
  options?: Partial<UseQueryOptions>
) => {
  const token = useAuthData((state) => state.token);
  const userId = useAuthData((state) => state.userId);
  return useQuery({
    queryKey: ["contracts", id, getTokenUserId(token) ?? userId],
    queryFn: () => getUserContractById(id),
    retry: retryUserContractRequest,
    ...options,
    enabled: Boolean(token) && options?.enabled !== false,
  });
};
