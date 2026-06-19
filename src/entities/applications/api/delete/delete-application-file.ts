import { apiClient } from "@/shared/api/apiClient";

interface DeleteApplicationFileParams {
  applicationId: string | number;
  docNumber: string;
}

export const deleteApplicationFile = async ({
  applicationId,
  docNumber,
}: DeleteApplicationFileParams) => {
  const encodedDocNumber = encodeURIComponent(docNumber); // ← важно

  const response = await apiClient.delete(
    `/application/delete-files/${applicationId}/number/${encodedDocNumber}`
  );

  return response.data;
};
