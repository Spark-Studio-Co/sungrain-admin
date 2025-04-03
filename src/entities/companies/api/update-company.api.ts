import { apiClient } from "@/shared/api/apiClient";

export interface CompanyData {
  name: string;
}

export const updateCompany = async (data: CompanyData) => {
  const response = await apiClient.patch("/company", data);
  return response.data;
};
