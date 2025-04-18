import { apiClient } from "@/shared/api/apiClient";

export const updateContract = async (id: string, data: any) => {
  const response = await apiClient.patch(
    `/contract/update-contract/${id}`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
