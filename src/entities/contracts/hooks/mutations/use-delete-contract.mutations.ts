import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteContract } from "../../api/delete/delete-contract.api";

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-contracts"] });
      queryClient.invalidateQueries({ queryKey: ["user-contracts"] });
    },
    onError: (error) => {
      console.error("Error deleting contract:", error);
    },
  });
};
