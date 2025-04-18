import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUploadDocuments } from "../../api/delete/delete-upload-docs";

export const useDeleteUploadedDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUploadDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
