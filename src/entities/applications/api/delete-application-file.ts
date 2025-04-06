import { apiClient } from "@/shared/api/apiClient";

interface DeleteApplicationFileParams {
  applicationId: string | number;
  docNumber: string;
}

export const deleteApplicationFile = async ({
  applicationId,
  docNumber,
}: DeleteApplicationFileParams) => {
  const response = await apiClient.delete(
    `/application/delete-files/${applicationId}/number/${docNumber}`,
    {
      params: { application_id: applicationId, doc_number: docNumber },
    }
  );
  return response.data;
};
