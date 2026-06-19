import { apiClient } from "@/shared/api/apiClient";

interface Invoice {
  id: number | string;
  name: string;
  number?: string;
  amount: number;
  date: string;
  file_url?: string;
  status: string;
  description?: string;
  applicationId: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export const getInvoices = async (
  applicationId: string | number
): Promise<Invoice[]> => {
  const response = await apiClient.get(
    `/application/get-invoice/${applicationId}/invoices`
  );
  return response.data;
};
