import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplication } from "./update-application.api";

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["application", data.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
};
