import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWagon, type AddWagonRequest } from "../../api/post/add-wagon.api";

export const useAddWagon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | AddWagonRequest) => addWagon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wagons"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении вагона:", error);
    },
  });
};
