import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadDocumentsForUpload } from "../../api/post/upload-documents-for-upload.api";

interface ApplicationFileMetaDto {
  name: string;
  number?: string;
  date?: string;
}

interface UploadDocumentsForUploadParams {
  applicationId: string | number;
  files: File[];
  filesInfo: ApplicationFileMetaDto[];
}

export const useUploadDocumentsForUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UploadDocumentsForUploadParams) =>
      uploadDocumentsForUpload(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["application", variables.applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["applications"],
      });
    },
  });
};
