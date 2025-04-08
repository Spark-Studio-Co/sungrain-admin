import { useQuery } from "@tanstack/react-query";
import { getApplication } from "../../api/get/get-application.api";

export const useGetApplication = (applicationId: string) => {
  return useQuery({
    queryKey: ["application", applicationId, "application-files"],
    queryFn: () => getApplication(applicationId),
    enabled: !!applicationId,
  });
};
