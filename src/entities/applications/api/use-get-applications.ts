import { useQuery } from "@tanstack/react-query";
import { getApplications } from "./get-applications.api";

export const useGetApplications = (contractId: string) => {
  return useQuery({
    queryKey: ["applications", contractId],
    queryFn: () => getApplications(contractId),
    enabled: !!contractId,
  });
};
