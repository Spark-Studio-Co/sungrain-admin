import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOwner } from "../../api/delete/delete-owner.api";

export const useDeleteOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deleteOwner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
};
