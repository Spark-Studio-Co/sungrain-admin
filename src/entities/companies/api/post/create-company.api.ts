import { apiClient } from "@/shared/api/apiClient";

export interface Company {
  name: string;
}

export const addCompany = async (data: Company) => {
  const response = await apiClient.post("/company", data);
  return response.data;
};
