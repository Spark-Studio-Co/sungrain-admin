import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOwner } from "../../api/create/create-owner.api";

export const useCreateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createOwner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
  });
};
