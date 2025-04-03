import { AddUserRequest } from "@/entities/auth/api/post/register";
import { apiClient } from "@/shared/api/apiClient";

export const updateUser = async (id: string | number, data: AddUserRequest) => {
  const response = await apiClient.patch(`/user/${id}`, data);
  return response.data;
};
