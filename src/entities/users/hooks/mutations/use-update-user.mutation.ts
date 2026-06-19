import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../api/patch/update-user.api";
import { AddUserRequest } from "@/entities/auth/api/post/register.api";

export const useUpdateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: AddUserRequest }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Ошибка при обновлении пользователя:", error);
    },
  });
};
