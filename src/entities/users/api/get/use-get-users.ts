import { useQuery } from "@tanstack/react-query";
import { getUsers } from "./get-users";

export const useGetUsers = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ["users", Number(params?.page), Number(params?.limit)],
    queryFn: () => getUsers(params || {}),
  });
};
