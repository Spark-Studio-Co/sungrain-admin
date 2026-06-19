import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addStation, StationData } from "../../api/post/create-stations.api";

export const useCreateStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StationData) => addStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
