import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadApplicationFiles } from "../../api/patch/upload-application.api";

export const useUploadApplicationFiles = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: any) => void;
} = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadApplicationFiles,
    onSuccess: (data, variables) => {
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
