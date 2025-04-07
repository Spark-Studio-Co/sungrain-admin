import { useQuery } from "@tanstack/react-query";
import { getUserContracts } from "../../api/get/get-user-contracts.api";

export const useGetUserContracts = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["contracts", Number(params?.page), Number(params?.limit)],
    queryFn: () => getUserContracts(params || {}),
  });
};
