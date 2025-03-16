import { apiClient } from "@/shared/api/apiClient";

export interface AddContractRequest {
  crop: string;
  sender: string;
  receiver: string;
  departureStation: string;
  destinationStation: string;
  totalVolume: number;
}

// ✅ Fetch Contracts with Pagination & Search
export const getContracts = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get("/contract", {
    params: { page, limit }, // ✅ Attach query params
  });
  return response.data;
};
