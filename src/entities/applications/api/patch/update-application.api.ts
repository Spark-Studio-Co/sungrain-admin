import { apiClient } from "@/shared/api/apiClient";

interface UpdateApplicationParams {
  id: number | string;
  data: {
    price_per_ton?: number;
    volume?: number;
    files?: string[] | any[];
  };
}

export const updateApplication = async ({
  id,
  data,
}: UpdateApplicationParams) => {
  const response = await apiClient.patch(`/application/${id}`, data);
  return response.data;
};
