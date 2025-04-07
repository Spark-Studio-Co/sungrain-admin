import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInvoice } from "../../api/delete/delete-invoice.api";

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
