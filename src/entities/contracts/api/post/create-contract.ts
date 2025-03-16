import { apiClient } from "@/shared/api/apiClient";

export interface AddContractRequest {
  crop: string;
  sender: string;
  receiver: string;
  company: string;
  departureStation: string;
  destinationStation: string;
  totalVolume: number;
  files?: File[];
}

export const addContract = async (data: AddContractRequest | FormData) => {
  // Check if data is FormData
  if (data instanceof FormData) {
    const response = await apiClient.post("/contract/add-data", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } else {
    // Handle regular JSON data
    const response = await apiClient.post("/contract/add-data", data);
    return response.data;
  }
};
