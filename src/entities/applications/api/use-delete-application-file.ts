import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteApplicationFile } from "./delete-application-file";

export const useDeleteApplicationFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplicationFile,
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
