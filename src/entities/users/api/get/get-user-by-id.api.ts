import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api/apiClient";

export const getUserById = async (id: number) => {
  const response = await apiClient.get(`/user/${id}`);
  return response.data;
};

export const useGetUserById = (id: number) => {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id),
    enabled: !!id, // только если id передан
    retry: 1,
  });
};
