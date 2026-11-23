import { useQuery } from "@tanstack/react-query";
import { getUserContracts } from "../../api/get/get-user-contracts.api";
import { retryUserContractRequest } from "./user-contract-retry";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { getTokenUserId } from "@/shared/users/navigation-profile";

export const useGetUserContracts = (params?: {
  page?: number;
  limit?: number;
}) => {
  const token = useAuthData((state) => state.token);
  const userId = useAuthData((state) => state.userId);
  return useQuery({
    queryKey: ["user-contracts", getTokenUserId(token) ?? userId, Number(params?.page), Number(params?.limit)],
    queryFn: () => getUserContracts(params || {}),
    retry: retryUserContractRequest,
    enabled: Boolean(token),
  });
};
