import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addContract, type AddContractRequest } from "./create-contract";

export const useAddContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddContractRequest | FormData) => addContract(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении контракта:", error);
    },
  });
};
