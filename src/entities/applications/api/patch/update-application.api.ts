import { apiClient } from "@/shared/api/apiClient";

interface UpdateApplicationParams {
  id: number | string;
  data: {
    price_per_ton?: number;
    volume?: number;
    files?: string[] | any[];
    departure_stations?: string[];
    destination_stations?: string[];
    [key: string]: unknown;
  };
}

export const updateApplication = async ({
  id,
  data,
}: UpdateApplicationParams) => {
  const response = await apiClient.patch(`/application/${id}`, data);
  return response.data;
};
