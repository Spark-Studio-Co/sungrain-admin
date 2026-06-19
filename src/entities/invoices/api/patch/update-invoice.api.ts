import { apiClient } from "@/shared/api/apiClient";

interface UpdateInvoiceParams {
  id: number | string;
  applicationId: number | string;
  data: {
    name?: string;
    number?: string;
    amount?: number;
    date?: string;
    status?: string;
    description?: string;
  };
}

export const updateInvoice = async ({
  id,
  applicationId,
  data,
}: UpdateInvoiceParams) => {
  const response = await apiClient.patch(
    `/application/update-invoice/${applicationId}/${id}`,
    data
  );

  return response.data;
};
