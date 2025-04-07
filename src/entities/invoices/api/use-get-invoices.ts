import { useQuery } from "@tanstack/react-query";
import { getInvoices } from "./get-invoices";

export const useGetInvoices = (applicationId: string | number) => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => getInvoices(applicationId),
    enabled: !!applicationId,
  });
};
