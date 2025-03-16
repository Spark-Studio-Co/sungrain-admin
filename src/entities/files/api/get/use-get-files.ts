import { useQuery } from "@tanstack/react-query";
import { getMyFiles } from "./get-files";

export const useMyFiles = () => {
  return useQuery({
    queryKey: ["myFiles"],
    queryFn: getMyFiles,
  });
};
