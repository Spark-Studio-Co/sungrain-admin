import { useQuery } from "@tanstack/react-query";
import { getSenders } from "./get-senders";

export const useGetSenders = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["senders", page, limit],
    queryFn: () => getSenders(page, limit),
  });
};
