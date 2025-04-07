import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateSender,
  UpdateSenderData,
} from "../../api/update/update-sender.api";

export const useUpdateSender = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSenderData) => updateSender(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["senders"] });
    },
    onError: (error) => {
      console.error("Ошибка при обновлении отправителя:", error);
    },
  });
};
