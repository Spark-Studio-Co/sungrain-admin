import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteApplication } from "./delete-application.api";

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
