import { AddUserRequest } from "@/entities/auth/api/post/register";
import { apiClient } from "@/shared/api/apiClient";

export const updateUser = async (data: AddUserRequest) => {
  const response = await apiClient.patch("/users", data);
  return response.data;
};
