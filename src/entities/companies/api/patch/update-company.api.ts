import { apiClient } from "@/shared/api/apiClient";

export interface CompanyData {
  id: any;
  name: string;
}

export const updateCompany = async (data: CompanyData) => {
  const response = await apiClient.put(`/company/${data.id}`, {
    name: data.name,
  });
  return response.data;
};
