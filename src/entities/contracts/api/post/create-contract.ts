import { apiClient } from "@/shared/api/apiClient";

export interface AddContractRequest {
  crop: string;
  sender: string;
  receiver: string;
  company: string;
  departureStation: string;
  destinationStation: string;
  totalVolume: number;
}

export const addContract = async (data: AddContractRequest) => {
  const response = await apiClient.post("/contract/add-data", data);
  return response.data;
};
