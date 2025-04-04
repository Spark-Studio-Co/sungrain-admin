import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteWagon } from "./delete-wagon.api";

export const useDeleteWagon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => deleteWagon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });
};
