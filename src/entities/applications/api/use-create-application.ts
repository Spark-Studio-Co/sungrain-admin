import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createApplication } from "./create-application.api";

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: (variables) => {
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
    },
  });
};
