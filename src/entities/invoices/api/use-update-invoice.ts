import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateInvoice } from "./update-invoice";

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
