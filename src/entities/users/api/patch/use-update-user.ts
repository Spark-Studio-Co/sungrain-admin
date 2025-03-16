import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "./update-user";
import { AddUserRequest } from "@/entities/auth/api/post/register";

export const useUpdateUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddUserRequest) => updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении пользователя:", error);
    },
  });
};
