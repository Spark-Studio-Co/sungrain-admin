import { apiClient } from "@/shared/api/apiClient";
import axios from "axios";

export const deleteApplication = async (id: number | string) => {
  const response = await apiClient.delete(`/application/${id}`);
  return response.data;
};
