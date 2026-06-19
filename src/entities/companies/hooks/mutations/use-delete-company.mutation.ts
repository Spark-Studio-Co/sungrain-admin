import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCompany } from "../../api/delete/delete-company.api";

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteCompany(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
