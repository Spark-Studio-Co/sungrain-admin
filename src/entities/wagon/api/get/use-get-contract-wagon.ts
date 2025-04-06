import { useQuery } from "@tanstack/react-query";
import { getContractWagons } from "./get-contract-wagons";

export const useGetWagonContracts = (contractId: string) => {
  return useQuery({
    queryKey: ["wagons"],
    queryFn: () => getContractWagons(contractId),
  });
};
