import { useQuery } from "@tanstack/react-query";
import { getContractById } from "../../api/get/get-contract-by-id.api";

export const useGetContractsId = (id: string) => {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getContractById(id),
  });
};
