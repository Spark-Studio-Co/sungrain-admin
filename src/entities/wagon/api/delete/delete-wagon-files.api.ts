import { apiClient } from "@/shared/api/apiClient";

export interface FileMetaDto {
  id: string | number;
  name: string;
  number?: string;
  date?: string;
  location?: string;
}

/**
 * Deletes files associated with a wagon
 * @param wagonId - The ID of the wagon
 * @param filesInfo - Array of file metadata to delete
 * @returns Promise with the API response
 */
export const deleteWagonFiles = async (
  wagonId: number,
  filesInfo: FileMetaDto[]
): Promise<any> => {
  try {
    const response = await apiClient.patch(
      `/wagon/delete-wagon-files/${wagonId}`,
      {
        files_info: filesInfo,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting wagon files:", error);
    throw error;
  }
};
