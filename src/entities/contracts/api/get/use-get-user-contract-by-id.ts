import { useQuery } from "@tanstack/react-query";
import { getUserContractById } from "./get-user-contract-by-id";

export const useGetUserContractById = (id: string | number) => {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getUserContractById(id),
  });
};
