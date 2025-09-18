import { apiClient } from "@/shared/api/apiClient";

interface UpdateApplicationFileParams {
  applicationId: string | number;
  fileNumber: string;
  name?: string;
  number?: string;
  date?: string;
  file?: File;
}

export const updateApplicationFile = async ({
  applicationId,
  fileNumber,
  name,
  number,
  date,
  file,
}: UpdateApplicationFileParams) => {
  const formData = new FormData();

  // Добавляем метаданные как поля формы
  if (name) formData.append("name", name);
  if (number) formData.append("number", number);
  if (date) formData.append("date", date);

  // Если есть новый файл, добавляем его
  if (file) {
    formData.append("files", file);
  }

  console.log("Updating application file:", {
    applicationId,
    fileNumber,
    name,
    number,
    date,
    hasFile: !!file,
  });

  const response = await apiClient.patch(
    `/application/update-file/${applicationId}/file/${fileNumber}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
