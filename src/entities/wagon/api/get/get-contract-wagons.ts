import { apiClient } from "@/shared/api/apiClient";

// ✅ Fetch Contracts with Pagination & Search
export const getContractWagons = async (contractId: string) => {
  const response = await apiClient.get(
    `/contract/contract-wagons/${contractId}`,
    {
      params: { contractId },
    }
  );

  console.log(response);
  return response.data;
};
