import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReceiver, CreateReceiverData } from "./create-receiver";

export const useCreateReceiver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReceiverData) => createReceiver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivers"] });
    },
    onError: (error) => {
      console.error("Ошибка при удалении отправителя:", error);
    },
  });
};
