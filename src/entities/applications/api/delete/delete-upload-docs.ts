import { apiClient } from "@/shared/api/apiClient";

export const deleteUploadDocuments = async (id: number) => {
  const response = await apiClient.delete(
    `/application/delete-upload-documents/${id}`
  );
  return response.data;
};
