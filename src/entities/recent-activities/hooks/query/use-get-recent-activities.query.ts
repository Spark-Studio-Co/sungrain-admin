import { useQuery } from "@tanstack/react-query";
import { getActivities } from "../../api/get/get-recent-activities.api";

export const useActivities = () => {
  return useQuery({
    queryKey: ["activities"],
    queryFn: getActivities,
  });
};
