import { apiClient } from "@/shared/api/apiClient";

export interface AddContractRequest {
  crop: string;
  totalVolume: number;
}

export const getContracts = async ({
  page = 1,
  limit = 10,
}: {
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get("/contract", {
    params: { page, limit },
  });
  return response.data;
};
