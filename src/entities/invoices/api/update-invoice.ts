import { apiClient } from "@/shared/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateInvoiceParams {
  id: number | string;
  data: {
    name?: string;
    number?: string;
    amount?: number;
    date?: string;
    status?: string;
    description?: string;
  };
}

export const updateInvoice = async ({ id, data }: UpdateInvoiceParams) => {
  const response = await apiClient.patch(`/invoice/${id}`, data);
  return response.data;
};
