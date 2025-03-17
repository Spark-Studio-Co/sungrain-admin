import { apiClient } from "@/shared/api/apiClient";

export interface AddWagonRequest {
  contractId: string
  number: string;
  capacity: number;
  owner: string;
  status: string
  files: File[]
}

export const addWagon = async (data: AddWagonRequest) => {
  // Create a FormData object to properly send files
  const formData = new FormData();

  // Add all the text fields
  formData.append('contractId', data.contractId);
  formData.append('status', data.status)
  formData.append('number', data.number);
  formData.append('capacity', data.capacity.toString());
  formData.append('owner', data.owner);

  // Add files to the FormData
  if (data.files && data.files.length > 0) {
    data.files.forEach((file) => {
      formData.append(`files`, file);
    });
  }

  // Send the request with the correct Content-Type header
  const response = await apiClient.post("/wagon", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
