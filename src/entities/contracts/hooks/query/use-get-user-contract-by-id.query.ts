import { useQuery } from "@tanstack/react-query";
import { getUserContractById } from "../../api/get/get-user-contract-by-id.api";

export const useGetUserContractById = (id: string | number) => {
  return useQuery({
    queryKey: ["contracts", id],
    queryFn: () => getUserContractById(id),
  });
};
