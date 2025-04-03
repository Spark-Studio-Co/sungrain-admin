import { useQuery } from "@tanstack/react-query";
import { getReceivers } from "./get-receiver";

export const useGetReceivers = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["receivers", page, limit],
    queryFn: () => getReceivers(page, limit),
  });
};
