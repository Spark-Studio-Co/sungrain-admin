import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "../../api/get/get-invoices.api";

export const useGetInvoices = (applicationId: string | number, enabled = true) => {
  return useQuery({
    queryKey: ["invoices", String(applicationId)],
    queryFn: () => getInvoices(applicationId),
    enabled: !!applicationId && enabled,
  });
};
