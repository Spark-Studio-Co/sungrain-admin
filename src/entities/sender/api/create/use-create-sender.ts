import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSender, CreateSenderData } from "./create-sender";

export const useCreateSender = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSenderData) => createSender(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (error) => {
      console.error("Ошибка при удалении отправителя:", error);
    },
  });
};
