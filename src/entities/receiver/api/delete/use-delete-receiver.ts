import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReceiver } from "./delete-receiver";

export const useDeleteReceiver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteReceiver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivers"] });
    },
    onError: (error) => {
      console.error("Ошибка при удалении получателя:", error);
    },
  });
};
