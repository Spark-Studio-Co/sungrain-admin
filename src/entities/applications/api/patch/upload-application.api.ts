import { apiClient } from "@/shared/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface UploadApplicationFilesParams {
  applicationId: string | number;
  files: File[];
  filesInfo: Array<{
    name: string;
    number: string;
    date: string;
    location?: string;
  }>;
}

// Function to upload files to an application
export const uploadApplicationFiles = async ({
  applicationId,
  files,
  filesInfo,
}: UploadApplicationFilesParams) => {
  const formData = new FormData();

  // Add each file to the formData with the field name 'files'
  files.forEach((file) => {
    formData.append("files", file);
  });

  // Add files_info as JSON string
  formData.append("files_info", JSON.stringify(filesInfo));

  // Log what we're sending for debugging
  console.log("Uploading application files:", {
    applicationId,
    filesCount: files.length,
    filesInfo,
  });

  const response = await apiClient.patch(
    `/application/upload-files/${applicationId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
