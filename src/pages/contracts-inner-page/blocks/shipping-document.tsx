"use client";

import { FileBarChart, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ShippingDocumentsProps {
  renderedFiles: any[];
}

export const ShippingDocuments = ({
  renderedFiles,
}: ShippingDocumentsProps) => {
  const handleDownload = (fileUrl: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", "document.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-full">
            <FileBarChart className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <CardTitle>Отгрузочные документы</CardTitle>
            <CardDescription>Управление документами отгрузки</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Вагон</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderedFiles.length > 0 ? (
                  renderedFiles.map((doc: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {(() => {
                          const filename = doc.file.toString();
                          if (filename.includes("/uploads/")) {
                            const filenameAfterUploads =
                              filename.split("/uploads/")[1];
                            const match =
                              filenameAfterUploads.match(/^([^-]+)/);
                            if (match && match[1]) {
                              return match[1];
                            }
                          }

                          const lastPart = filename.split("/").pop() || "";
                          const baseName = lastPart.split("-")[0];
                          return baseName || "Документ вагона";
                        })()}
                      </TableCell>
                      <TableCell>{doc.wagonNumber || "Не указан"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownload(doc.file)}
                        >
                          <Download className="h-4 w-4" />
                          Скачать
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      Документы не найдены
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
