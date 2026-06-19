// Updated useCreateApplication
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApplication } from "../../api/post/create-application.api";
import type { UseMutationOptions } from "@tanstack/react-query";

export const useCreateApplication = (
  options?: UseMutationOptions<any, any, any, unknown>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: (variables, ...rest) => {
      let contractId;
      if (variables instanceof FormData) {
        contractId = variables.get("contractId");
      } else {
        contractId = variables.contractId;
      }
      if (contractId) {
        queryClient.invalidateQueries({
          queryKey: ["applications", contractId.toString()],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      // Also call the user's onSuccess if provided
      options?.onSuccess?.(variables, ...rest);
    },
    ...options,
  });
};
