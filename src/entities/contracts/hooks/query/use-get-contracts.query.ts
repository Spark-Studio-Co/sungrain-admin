import { useQuery } from "@tanstack/react-query";
import { getContracts } from "../../api/get/get-contracts.api";

export const useGetContracts = (params?: {
  page?: number;
  limit?: number;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ["all-contracts", Number(params?.page), Number(params?.limit)],
    queryFn: () => getContracts(params || {}),
    enabled: params?.enabled,
  });
};
