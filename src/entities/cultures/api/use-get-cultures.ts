import { useQuery } from "@tanstack/react-query";
import { getCultures } from "./get/get-cultures.api"; // assuming this is the function you created

export const useFetchCultures = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ["cultures", page, limit],
    queryFn: () => getCultures(page, limit),
  });
};
