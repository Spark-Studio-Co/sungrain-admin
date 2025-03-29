import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addCulture, CultureData } from "./create-cultures.api";

export const useCreateCultures = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CultureData) => addCulture(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cultures"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
