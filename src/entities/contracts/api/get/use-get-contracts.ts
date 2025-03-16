import { useQuery } from "@tanstack/react-query";
import { getContracts } from "./get-contracts";

export const useGetContracts = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["contracts", Number(params?.page), Number(params?.limit)],
    queryFn: () => getContracts(params || {}),
  });
};
