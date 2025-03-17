import { useQuery } from "@tanstack/react-query";
import { getUserContracts } from "./get-user-contracts";

export const useGetUserContracts = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["contracts", Number(params?.page), Number(params?.limit)],
    queryFn: () => getUserContracts(params || {}),
  });
};
