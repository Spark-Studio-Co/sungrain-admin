import { apiClient } from "@/shared/api/apiClient";

export interface AddWagonRequest {
  number: string;
  capacity: number;
  owner: string;
  status: string
  // document: File
}

export const addWagon = async (data: AddWagonRequest) => {
  // Create a FormData object to properly send files
  const formData = new FormData();

  // Add all the text fields
  formData.append('status', data.status)
  formData.append('number', data.number);
  formData.append('capacity', data.capacity.toString());
  formData.append('owner', data.owner);

  // Add the document file
  // formData.append('document', data.document);

  // Send the request with the correct Content-Type header
  const response = await apiClient.post("/wagon", formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
