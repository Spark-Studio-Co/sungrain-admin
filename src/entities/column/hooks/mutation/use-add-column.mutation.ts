import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AddColumnRequest,
  addColumnToTable,
} from "../../api/patch/create-column.api";

export const useAddColumn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddColumnRequest) => addColumnToTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tableSchema"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении столбца в таблицу:", error);
    },
  });
};
