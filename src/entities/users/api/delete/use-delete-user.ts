import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "./delete-user";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Ошибка при удалении отправителя:", error);
    },
  });
};
