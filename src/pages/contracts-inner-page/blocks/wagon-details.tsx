"use client";

import { useState } from "react";
import {
  Search,
  Truck,
  Building2,
  CheckCircle2,
  Circle,
  File,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface WagonDetailsProps {
  wagons: any[];
  handleFileDownload: (fileUrl: string, fileName: string) => void;
}

export const WagonDetails = ({
  wagons,
  handleFileDownload,
}: WagonDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Filter wagons based on search term
  const filteredWagons = wagons.filter((wagon) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      wagon.number?.toLowerCase().includes(searchLower) ||
      wagon.owner?.toLowerCase().includes(searchLower) ||
      wagon.status?.toLowerCase().includes(searchLower) ||
      wagon.id?.toString().includes(searchLower) ||
      wagon.capacity?.toString().includes(searchLower) ||
      wagon.real_weight?.toString().includes(searchLower) ||
      wagon.files?.some((file: any) =>
        file.name?.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-full">
            <Truck className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <CardTitle>Детали вагонов</CardTitle>
            <CardDescription>Подробная информация о вагонах</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по вагонам..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredWagons.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredWagons.map((wagon) => (
                <AccordionItem key={wagon.id} value={`item-${wagon.id}`}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                    <div className="flex items-center gap-3 text-left">
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-800 hover:bg-amber-50"
                      >
                        {wagon.number}
                      </Badge>
                      <span className="font-medium">{wagon.owner}</span>
                      <Badge
                        variant={
                          wagon.status === "shipped"
                            ? "success"
                            : wagon.status === "in_transit"
                            ? "warning"
                            : "default"
                        }
                        className={`flex w-fit items-center gap-1 ${
                          wagon.status === "shipped"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : wagon.status === "in_transit"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {wagon.status === "shipped" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : wagon.status === "in_transit" ? (
                          <Truck className="h-3.5 w-3.5" />
                        ) : wagon.status === "at_elevator" ? (
                          <Building2 className="h-3.5 w-3.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5" />
                        )}
                        {wagon.status === "shipped"
                          ? "Отгружен"
                          : wagon.status === "in_transit"
                          ? "В пути"
                          : wagon.status === "at_elevator"
                          ? "На элеваторе"
                          : wagon.status || "Не указан"}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="border rounded-lg mt-2">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium w-1/3">
                              ID
                            </TableCell>
                            <TableCell>{wagon.id}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Номер вагона
                            </TableCell>
                            <TableCell>{wagon.number}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Грузоподъемность
                            </TableCell>
                            <TableCell>{wagon.capacity} кг</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Реальный вес
                            </TableCell>
                            <TableCell>{wagon.real_weight} кг</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Владелец
                            </TableCell>
                            <TableCell>{wagon.owner}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Статус
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  wagon.status === "shipped"
                                    ? "success"
                                    : wagon.status === "in_transit"
                                    ? "warning"
                                    : "default"
                                }
                                className={`flex w-fit items-center gap-1 ${
                                  wagon.status === "shipped"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : wagon.status === "in_transit"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                    : "bg-slate-100 text-slate-800 hover:bg-slate-100"
                                }`}
                              >
                                {wagon.status === "shipped" ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : wagon.status === "in_transit" ? (
                                  <Truck className="h-3.5 w-3.5" />
                                ) : wagon.status === "at_elevator" ? (
                                  <Building2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5" />
                                )}
                                {wagon.status === "shipped"
                                  ? "Отгружен"
                                  : wagon.status === "in_transit"
                                  ? "В пути"
                                  : wagon.status === "at_elevator"
                                  ? "На элеваторе"
                                  : wagon.status || "Не указан"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Дата отправления
                            </TableCell>
                            <TableCell>
                              {wagon.date_of_departure
                                ? formatDate(wagon.date_of_departure)
                                : "Не указана"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Файлы</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-2">
                                {wagon.files &&
                                  wagon.files.map(
                                    (file: any, fileIndex: number) => (
                                      <div
                                        key={fileIndex}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <File className="h-4 w-4 text-blue-500" />
                                          <span>{file.name}</span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="gap-1"
                                          onClick={() =>
                                            handleFileDownload(
                                              file.location,
                                              file.name
                                            )
                                          }
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          Скачать
                                        </Button>
                                      </div>
                                    )
                                  )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-8 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground">Вагоны не найдены</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
