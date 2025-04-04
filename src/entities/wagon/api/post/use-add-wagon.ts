import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWagon, type AddWagonRequest } from "./add-wagon";

export const useAddWagon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData | AddWagonRequest) => addWagon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wagons"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении вагона:", error);
    },
  });
};
