import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplication } from "../../api/patch/update-application.api";
import type { UseMutationOptions } from "@tanstack/react-query";

export const useUpdateApplication = (
  options?: UseMutationOptions<any, any, any, unknown>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplication,
    onSuccess: (data, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: ["application", data.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      // Call user-defined onSuccess if it exists
      options?.onSuccess?.(data, ...rest);
    },
    ...options,
  });
};
