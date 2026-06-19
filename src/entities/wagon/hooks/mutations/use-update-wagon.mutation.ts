import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateWagonDetails,
  updateWagonFiles,
} from "../../api/patch/update-wagon.api";

export const useUpdateWagon = () => {
  const queryClient = useQueryClient();

  const updateDetailsMutation = useMutation({
    mutationFn: updateWagonDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const updateFilesMutation = useMutation({
    mutationFn: updateWagonFiles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const mutateAsync = async ({
    id,
    data,
  }: {
    id: number | string;
    data: FormData | Record<string, any>;
  }) => {
    try {
      // Extract wagon details and files info from FormData
      if (data instanceof FormData) {
        // Extract basic wagon details
        const wagonDetails: Record<string, any> = {};
        const formEntries = Array.from(data.entries());

        // Process basic fields
        const basicFields = [
          "number",
          "capacity",
          "real_weight",
          "owner",
          "status",
          "date_of_departure",
          "date_of_unloading",
          "contractId",
        ];
        basicFields.forEach((field) => {
          const value = data.get(field);
          if (value !== null && value !== "") {
            wagonDetails[field] = value;
          }
        });

        // Get files_info
        const filesInfoStr = data.get("files_info");
        let filesInfo = [];

        if (filesInfoStr && typeof filesInfoStr === "string") {
          filesInfo = JSON.parse(filesInfoStr);
        }

        // Check if there are files to upload
        const hasFiles = formEntries.some(([key]) => key === "files");

        // First update wagon details
        if (Object.keys(wagonDetails).length > 0) {
          await updateDetailsMutation.mutateAsync({ id, data: wagonDetails });
        }

        // Then update files if needed
        if (hasFiles || filesInfo.length > 0) {
          // Create a new FormData with only file-related data
          const fileFormData = new FormData();

          // Add files
          formEntries.forEach(([key, value]) => {
            if (key === "files") {
              fileFormData.append("files", value);
            }
          });

          await updateFilesMutation.mutateAsync({
            id,
            formData: fileFormData,
            filesInfo,
          });
        }

        return { success: true };
      } else {
        // If it's a plain object, just update the details
        return await updateDetailsMutation.mutateAsync({ id, data });
      }
    } catch (error) {
      console.error("Error updating wagon:", error);
      throw error;
    }
  };

  return {
    mutateAsync,
    isPending: updateDetailsMutation.isPending || updateFilesMutation.isPending,
    isError: updateDetailsMutation.isError || updateFilesMutation.isError,
    error: updateDetailsMutation.error || updateFilesMutation.error,
  };
};
