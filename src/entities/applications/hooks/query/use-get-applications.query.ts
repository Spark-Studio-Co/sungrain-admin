import { useQuery } from "@tanstack/react-query";
import { getApplications } from "../../api/get/get-applications.api";

export const useGetApplications = (contractId: string, enabled = true) => {
  return useQuery({
    queryKey: ["applications", contractId],
    queryFn: () => getApplications(contractId),
    enabled: !!contractId && enabled,
  });
};
