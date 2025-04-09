import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStation } from "../../api/patch/update-stations.api";

export const useUpdateStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: any) => updateStation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
