import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CultureData } from "./post/create-cultures.api";
import { updateCulture } from "./patch/update-culture.api";

export const useUpdateCulture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CultureData) => updateCulture(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cultures"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
