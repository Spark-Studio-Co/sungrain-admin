import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInvoice } from "../../api/patch/update-invoice.api";

interface UpdateInvoiceParams {
  id: number | string;
  applicationId: number | string;
  data: {
    name?: string;
    number?: string;
    amount?: number;
    date?: string;
    status?: string;
    description?: string;
  };
}

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params: Omit<UpdateInvoiceParams, "applicationId"> & {
        applicationId: number | string;
      }
    ) => updateInvoice(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
