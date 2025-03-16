import { useQuery } from "@tanstack/react-query";
import { exportTable } from "./export-table";

export const useExportTable = () => {
  return useQuery({
    queryKey: ["tables"],
    queryFn: exportTable,
  });
};
