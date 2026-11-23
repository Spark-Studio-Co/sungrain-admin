import { apiClient } from "@/shared/api/apiClient";

export interface UploadDocumentsForUploadParams {
  applicationId: string | number;
  name: string;
  number?: string;
  date?: string;
}

export const uploadDocumentsForUpload = async ({
  applicationId,
  name,
  number,
  date,
}: UploadDocumentsForUploadParams) => {
  const { data } = await apiClient.post(
    `/application/create-for-upload-documents/${applicationId}`,
    {
      name,
      number,
      date,
    }
  );

  return data;
};
