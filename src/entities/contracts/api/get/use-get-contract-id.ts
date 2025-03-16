import { useQuery } from "@tanstack/react-query";
import { getContractById } from "./get-contract-by-id";

export const useGetContractsId = (id: string) => {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContractById(id),
  });
};
