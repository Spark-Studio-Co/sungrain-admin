import { apiClient } from "@/shared/api/apiClient";

interface UploadDocumentsForUploadParams {
  applicationId: string | number;
  name: string;
}

export const uploadDocumentsForUpload = async ({
  applicationId,
  name,
}: UploadDocumentsForUploadParams) => {
  const { data } = await apiClient.post(
    `/application/create-for-upload-documents/${applicationId}`,
    {
      name, // просто одно текстовое поле
    }
  );

  return data;
};
