import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInvoice } from "../../api/post/create-invoice.api";

interface CreateInvoiceParams {
  applicationId: string | number;
  name: string;
  number?: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
  file?: File;
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateInvoiceParams) => createInvoice(params),
    onSuccess: (_, { applicationId }) => {
      void queryClient.invalidateQueries({
        queryKey: ["invoices", String(applicationId)],
      });
    },
  });
};
