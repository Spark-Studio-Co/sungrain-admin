import { useQuery } from "@tanstack/react-query";
import { getReceivers } from "../../api/get/get-receiver.api";

export const useGetReceivers = (
  page: number,
  limit: number,
  search?: string
) => {
  return useQuery({
    queryKey: ["receivers", page, limit, search],
    queryFn: () => getReceivers(page, limit, search),
  });
};
