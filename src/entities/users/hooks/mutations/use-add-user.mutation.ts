import { addUser, AddUserRequest } from "@/entities/auth/api/post/register.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddUserRequest) => addUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении пользователя:", error);
    },
  });
};
