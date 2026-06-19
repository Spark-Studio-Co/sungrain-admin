import { useQuery } from "@tanstack/react-query";
import { getSenders } from "../../api/get/get-senders.api";

export const useGetSenders = (page: number, limit: number) => {
  return useQuery({
    queryKey: ["senders", page, limit],
    queryFn: () => getSenders(page, limit),
  });
};
