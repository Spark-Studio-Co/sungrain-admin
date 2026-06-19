import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getContractById } from "../../api/get/get-contract-by-id.api";

export const useGetContractsId = (
  id: string,
  options?: Partial<UseQueryOptions>
) => {
  return useQuery({
    queryKey: ["all-contracts", id],
    queryFn: () => getContractById(id),
    ...options,
  });
};
