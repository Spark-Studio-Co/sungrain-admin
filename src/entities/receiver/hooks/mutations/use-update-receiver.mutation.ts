import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateReceiver,
  UpdateReceiverData,
} from "../../api/update/update-receiver.api";

export const useUpdateReceiver = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReceiverData) => updateReceiver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receivers"] });
    },
    onError: (error) => {
      console.error("Ошибка при обновлении отправителя:", error);
    },
  });
};
