import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCulture } from "./delete/delete-cultures.api";

export const useDeleteCulture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteCulture(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cultures"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
