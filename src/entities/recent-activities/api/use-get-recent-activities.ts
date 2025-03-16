import { useQuery } from "@tanstack/react-query";
import { getActivities } from "./get-recent-activities";

export const useActivities = () => {
  return useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });
};
