import { apiClient } from "@/shared/api/apiClient";
import axios from "axios";

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

export const uploadDocumentsForUpload = async ({
  applicationId,
  files,
  filesInfo,
}: UploadDocumentsForUploadParams) => {
  const formData = new FormData();

  // Append each file to the form data
  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("files_info", JSON.stringify(filesInfo));

  const { data } = await apiClient.post(
    `/create-for-upload-documents/${applicationId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};
