import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

interface CreateInvoiceParams {
  applicationId: string | number;
  name: string;
  amount: number;
  date: string;
  status: string;
  description: string;
  file: File;
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateInvoiceParams) => {
      const formData = new FormData();
      formData.append("name", params.name);
      formData.append("amount", params.amount.toString());
      formData.append("date", params.date);
      formData.append("status", params.status);
      formData.append("description", params.description);
      formData.append("files", params.file);

      const response = await apiClient.post(
        `/application/add-invoice/${params.applicationId}/invoice`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
  });
};
