import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadApplicationFiles } from "../../api/patch/upload-application.api";

export const useUploadApplicationFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadApplicationFiles,
    onSuccess: (variables) => {
      queryClient.invalidateQueries({
        queryKey: ["application", variables.applicationId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-files"] });
    },
  });
};
