import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AddColumnRequest, addColumnToTable } from "./create-column";

export const useAddColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddColumnRequest) => addColumnToTable(data),
    onSuccess: () => {
      // Invalidates the table schema query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["tableSchema"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении столбца в таблицу:", error);
    },
  });
};
