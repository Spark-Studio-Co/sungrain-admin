import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInvoice } from "../../api/delete/delete-invoice.api";

interface DeleteInvoiceParams {
  applicationId: any;
  id: number;
}

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ applicationId, id }: DeleteInvoiceParams) =>
      deleteInvoice(applicationId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
