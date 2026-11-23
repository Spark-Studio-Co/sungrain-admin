import { useQuery } from "@tanstack/react-query";
import { getContractWagons } from "../../api/get/get-contract-wagons.api";

export const useGetWagonContracts = (contractId: string, enabled = true) => {
  return useQuery({
    queryKey: ["wagons", contractId],
    queryFn: () => getContractWagons(contractId),
    enabled: !!contractId && enabled,
  });
};
