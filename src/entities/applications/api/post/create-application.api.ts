import { apiClient } from "@/shared/api/apiClient";

interface CreateApplicationParams {
  price_per_ton: number;
  volume: number;
  contractId: number;
}

export const createApplication = async (data: CreateApplicationParams) => {
  console.log(data);
  const response = await apiClient.post(`/application`, data);
  return response.data;
};
