import { useQuery } from "@tanstack/react-query";
import { getContractWagons } from "../../api/get/get-contract-wagons.api";

export const useGetWagonContracts = (contractId: string) => {
  return useQuery({
    queryKey: ["wagons"],
    queryFn: () => getContractWagons(contractId),
  });
};
