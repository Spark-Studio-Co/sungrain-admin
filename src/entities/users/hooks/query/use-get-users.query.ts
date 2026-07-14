import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../api/get/get-users.api";

export const useGetUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  excludeAdmin?: boolean;
}) => {
  return useQuery({
    queryKey: [
      "users",
      Number(params?.page),
      Number(params?.limit),
      params?.search,
      params?.role,
      params?.excludeAdmin,
    ],
    queryFn: () => getUsers(params || {}),
  });
};
