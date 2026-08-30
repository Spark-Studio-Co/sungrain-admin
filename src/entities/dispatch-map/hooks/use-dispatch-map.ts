import { useQuery } from "@tanstack/react-query";
import { getDispatchMapDashboard } from "../api/dispatch-map.api";

export const DISPATCH_MAP_QUERY_KEY = ["dispatch-map"];

export const useDispatchMap = () =>
  useQuery({
    queryKey: DISPATCH_MAP_QUERY_KEY,
    queryFn: getDispatchMapDashboard,
    refetchInterval: 5 * 60 * 1000,
  });
