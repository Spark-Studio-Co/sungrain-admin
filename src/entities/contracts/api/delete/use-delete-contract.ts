import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteContract } from "./delete-contract";

export const useDeleteContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteContract(id), // ✅ Correct function call
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] }); // ✅ Correct object format for v5
    },
    onError: (error) => {
      console.error("Error deleting contract:", error);
    },
  });
};
