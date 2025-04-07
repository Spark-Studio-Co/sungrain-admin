import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "../../api/get/get-statistics.api";

export const useGetStatistics = () => {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: () => getStatistics(),
  });
};
