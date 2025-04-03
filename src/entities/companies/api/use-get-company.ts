import { useQuery } from "@tanstack/react-query";
import { getCompanies } from "./get-companies.api";

export const useGetCompanies = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["companies", page, limit],
    queryFn: () => getCompanies(page, limit),
  });
};
