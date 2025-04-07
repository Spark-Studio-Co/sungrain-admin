import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTable,
  CreateTableRequest,
} from "../../api/post/create-table.api";

export const useCreateTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTableRequest) => createTable(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error) => {
      console.error("Ошибка при создании таблицы:", error);
    },
  });
};
