import { useQuery } from "@tanstack/react-query";
import { getApplication } from "./get-application.api";

export const useGetApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplication(applicationId),
    enabled: !!applicationId,
  });
};
