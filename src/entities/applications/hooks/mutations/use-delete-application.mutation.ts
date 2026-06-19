import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteApplication } from "../../api/delete/delete-application.api";

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
