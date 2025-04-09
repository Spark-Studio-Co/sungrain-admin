import { useQuery } from "@tanstack/react-query";
import { getOwner } from "../../api/get/get-owner.api";

export const useGetOwner = (id: number | string) => {
  return useQuery({
    queryKey: ["owner", id],
    queryFn: () => getOwner(id),
    enabled: !!id,
  });
};
