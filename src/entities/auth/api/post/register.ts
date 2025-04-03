import { apiClient } from "@/shared/api/apiClient";

export interface AddUserRequest {
  username?: string;
  name?: string;
  companyId?: any;
  email?: string;
  password?: string;
  role?: string;
}

export const addUser = async (data: AddUserRequest) => {
  const response = await apiClient.post("/auth/register", data);
  return response.data;
};
