import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateApplicationFile } from "../../api/patch/update-application-file.api";

export const useUpdateApplicationFile = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: any) => void;
} = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateApplicationFile,
    onSuccess: (data, variables) => {
      // Инвалидируем кэш для обновления данных
      queryClient.invalidateQueries({
        queryKey: ["application", variables.applicationId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["application"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-files"] });

      onSuccess?.(data, variables);
    },
    onError,
  });
};
