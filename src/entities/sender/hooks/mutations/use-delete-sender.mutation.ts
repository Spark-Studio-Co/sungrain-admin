import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSender } from "../../api/delete/delete-sender.api";

export const useDeleteSender = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteSender(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (error) => {
      console.error("Ошибка при удалении отправителя:", error);
    },
  });
};
