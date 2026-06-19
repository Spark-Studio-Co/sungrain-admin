import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addDataToTable, TableData } from "../../api/post/create-data.api";

export const useAddData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TableData) => addDataToTable(data),
    onSuccess: () => {
      // Invalidates table data query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["tableData"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
