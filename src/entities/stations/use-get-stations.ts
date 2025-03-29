import { useQuery } from "@tanstack/react-query";
import { getStations } from "./get-stations.api";

export const useFetchStations = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["stations", page, limit],
    queryFn: () => getStations(page, limit),
  });
};
