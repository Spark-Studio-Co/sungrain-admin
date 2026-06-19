import { useQuery } from "@tanstack/react-query";
import { getOwners } from "../../api/get/get-owners.api";

export const useGetOwners = (page = 1, limit = 10, search?: string) => {
  return useQuery({
    queryKey: ["owners", { page, limit, search }],
    queryFn: () => getOwners({ page, limit, search }),
  });
};
