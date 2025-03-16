import { useQuery } from "@tanstack/react-query";
import { exportTable } from "./export-table";

export const useExportTable = () => {
  const query = useQuery({
    queryKey: ["exportPDF"],
    queryFn: exportTable,
    enabled: false,
  });

  const downloadPDF = async () => {
    try {
      const pdfBlob = await query.refetch();

      if (pdfBlob.data) {
        const pdfURL = URL.createObjectURL(pdfBlob.data);

        const link = document.createElement("a");
        link.href = pdfURL;
        link.download = "exported-table.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(pdfURL), 100);
      }
    } catch (error) {
      console.error("❌ Error downloading PDF:", error);
    }
  };

  return { ...query, downloadPDF };
};