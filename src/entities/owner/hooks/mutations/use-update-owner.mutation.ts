import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateOwner } from "../../api/update/update-owner.api";

interface UpdateOwnerParams {
  id: number | string;
  data: any;
}

export const useUpdateOwner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateOwnerParams) => updateOwner(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["owner", variables.id] });
    },
  });
};
