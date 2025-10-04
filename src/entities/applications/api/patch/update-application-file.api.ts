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

  // Добавляем метаданные как поля формы (только если они не пустые)
  if (name !== undefined && name !== null && name !== "") {
    formData.append("name", name);
  }
  if (number !== undefined && number !== null && number !== "") {
    formData.append("number", number);
  }
  if (date !== undefined && date !== null && date !== "") {
    formData.append("date", date);
  }

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
