import { apiClient } from "@/shared/api/apiClient";

export interface AddWagonRequest {
  contract_id: string;
  number: string;
  capacity: number;
  real_weight?: number;
  owner: string;
  status: string;
  date_of_departure?: string;
  files_info?: string;
  files?: File[];
}

export const addWagon = async (data: FormData | AddWagonRequest) => {
  let formData: FormData;

  // Check if data is already FormData
  if (data instanceof FormData) {
    formData = data;
  } else {
    // Create a FormData object from AddWagonRequest
    formData = new FormData();

    // Add all the text fields
    formData.append("contract_id", data.contract_id);
    formData.append("number", data.number);
    formData.append("capacity", data.capacity.toString());
    formData.append("status", data.status);
    formData.append("owner", data.owner);

    // Add optional fields if they exist
    if (data.real_weight !== undefined) {
      formData.append("real_weight", data.real_weight.toString());
    }

    if (data.date_of_departure) {
      formData.append("date_of_departure", data.date_of_departure);
    }

    if (data.files_info) {
      formData.append("files_info", data.files_info);
    }

    // Add files to the FormData
    if (data.files && data.files.length > 0) {
      data.files.forEach((file) => {
        formData.append(`files`, file);
      });
    }
  }

  // Send the request with the correct Content-Type header
  const response = await apiClient.post("/wagon", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};
