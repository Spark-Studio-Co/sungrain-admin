import { apiClient } from "@/shared/api/apiClient";

export const deleteInvoice = async (
  application_id: any,
  id: number | string
) => {
  console.log(application_id, id);

  const response = await apiClient.delete(
    `/application/delete-invoice/${application_id}/${id}`
  );
  return response.data;
};
