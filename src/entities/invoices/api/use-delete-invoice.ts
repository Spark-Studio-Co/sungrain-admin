import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInvoice } from "./delete-invoice";

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
