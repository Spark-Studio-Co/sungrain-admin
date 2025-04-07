import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Company } from "../../api/post/create-company.api";
import { updateCompany } from "../../api/patch/update-company.api";

export const useUpdateCompanies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Company) => updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
