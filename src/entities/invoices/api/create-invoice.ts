import { apiClient } from "@/shared/api/apiClient";
import axios from "axios";

interface CreateInvoiceParams {
  applicationId: string | number;
  name: string;
  number?: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
  file?: File;
}

export const createInvoice = async (params: CreateInvoiceParams) => {
  const { applicationId, file, ...invoiceData } = params;

  const formData = new FormData();

  Object.entries(invoiceData).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  if (file) {
    formData.append("files", file);
  }

  // Send request
  const response = await apiClient.post(
    `/application/${applicationId}/invoice`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
