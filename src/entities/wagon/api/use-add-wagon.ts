import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addWagon, AddWagonRequest } from "./add-wagon";

export const useAddWagon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddWagonRequest) => addWagon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wagons"] });
    },
    onError: (error) => {
      console.error("Ошибка при добавлении вагона:", error);
    },
  });
};
