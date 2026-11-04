import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplication } from "../../api/patch/update-application.api";
import type { UseMutationOptions } from "@tanstack/react-query";

export const useUpdateApplication = (
  options?: UseMutationOptions<any, any, any, unknown>
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...mutationOptions } = options ?? {};

  return useMutation({
    mutationFn: updateApplication,
    ...mutationOptions,
    onSuccess: (data, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: ["application", data.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["attention-center"] });

      // Call user-defined onSuccess if it exists
      onSuccess?.(data, ...rest);
    },
  });
};
