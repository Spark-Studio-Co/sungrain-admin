import { useQuery } from "@tanstack/react-query";
import { getMyFiles } from "../../api/get/get-files.api";

export const useMyFiles = () => {
  return useQuery({
    queryKey: ["myFiles"],
    queryFn: getMyFiles,
  });
};
