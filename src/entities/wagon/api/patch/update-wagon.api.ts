import { apiClient } from "@/shared/api/apiClient";

interface UpdateWagonDetailsParams {
  id: number | string;
  data: {
    number?: string;
    capacity?: number;
    real_weight?: number;
    owner?: string;
    status?: string;
    date_of_departure?: string;
    date_of_unloading?: string;
    contractId?: number;
  };
}

interface UpdateWagonFilesParams {
  id: number | string;
  formData: FormData;
  filesInfo: Array<{
    id?: number | string;
    name: string;
    number: string;
    date: string;
    location?: string;
  }>;
}

// Update wagon details (without files)
export const updateWagonDetails = async ({
  id,
  data,
}: UpdateWagonDetailsParams) => {
  const response = await apiClient.patch(`/wagon/${id}`, data);
  return response.data;
};

// Update wagon files
export const updateWagonFiles = async ({
  id,
  formData,
  filesInfo,
}: UpdateWagonFilesParams) => {
  // Add files_info to formData
  formData.append("files_info", JSON.stringify(filesInfo));

  const response = await apiClient.post(`/wagon/upload-files/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
