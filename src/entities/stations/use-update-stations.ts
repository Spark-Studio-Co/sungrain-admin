import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStation, UpdateStationData } from "./update-stations.api";

export const useUpdateStation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStationData) => updateStation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении данных в таблицу:", error);
    },
  });
};
