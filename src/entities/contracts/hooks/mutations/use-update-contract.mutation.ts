import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateContract } from "../../api/patch/update-contract";

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) =>
      updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["userContracts"] });
    },
  });
};
