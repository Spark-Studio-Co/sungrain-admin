import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "./get-statistics.api";

export const useGetStatistics = () => {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: () => getStatistics(),
  });
};
