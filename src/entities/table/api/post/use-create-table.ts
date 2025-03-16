import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTable, CreateTableRequest } from "./create-table";

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
