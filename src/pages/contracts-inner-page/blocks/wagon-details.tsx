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
  Calendar,
  Weight,
  User,
  Tag,
  Info,
  FileText,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WagonDetailsProps {
  wagons: any[];
  handleFileDownload: (fileUrl: string, fileName: string) => void;
}

export const WagonDetails = ({
  wagons = [],
  handleFileDownload,
}: WagonDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Get unique statuses for filtering
  const statuses = Array.from(
    new Set(wagons?.map((wagon) => wagon.status) || [])
  );

  // Filter wagons based on search term and active tab
  const filteredWagons = wagons?.filter((wagon) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      wagon.number?.toLowerCase().includes(searchLower) ||
      wagon.owner?.toLowerCase().includes(searchLower) ||
      wagon.status?.toLowerCase().includes(searchLower) ||
      wagon.id?.toString().includes(searchLower) ||
      wagon.capacity?.toString().includes(searchLower) ||
      wagon.real_weight?.toString().includes(searchLower) ||
      wagon.files?.some((file: any) =>
        file.name?.toLowerCase().includes(searchLower)
      );

    const matchesTab = activeTab === "all" || wagon.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "shipped":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          label: "Отгружен",
          className: "bg-green-100 text-green-800 hover:bg-green-100",
        };
      case "in_transit":
        return {
          icon: <Truck className="h-3.5 w-3.5" />,
          label: "В пути",
          className: "bg-amber-100 text-amber-800 hover:bg-amber-100",
        };
      case "at_elevator":
        return {
          icon: <Building2 className="h-3.5 w-3.5" />,
          label: "На элеваторе",
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        };
      default:
        return {
          icon: <Circle className="h-3.5 w-3.5" />,
          label: status || "Не указан",
          className: "bg-slate-100 text-slate-800 hover:bg-slate-100",
        };
    }
  };

  // Count wagons by status
  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] =
      wagons?.filter((wagon) => wagon.status === status).length || 0;
    return acc;
  }, {} as Record<string, number>);

  const totalWagons = wagons?.length || 0;

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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по вагонам..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-9">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Все ({totalWagons})
                </TabsTrigger>
                {statuses.map((status) => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    {getStatusInfo(status).label} ({statusCounts[status]})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {filteredWagons?.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredWagons.map((wagon) => {
                const statusInfo = getStatusInfo(wagon.status);

                return (
                  <AccordionItem key={wagon.id} value={`item-${wagon.id}`}>
                    <AccordionTrigger className="hover:bg-muted/50 px-4 rounded-md">
                      <div className="flex flex-wrap items-center gap-3 text-left">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 hover:bg-amber-50"
                        >
                          {wagon.number}
                        </Badge>
                        <span className="font-medium">{wagon.owner}</span>
                        <Badge
                          variant="outline"
                          className={`flex w-fit items-center gap-1 ${statusInfo.className}`}
                        >
                          {statusInfo.icon}
                          {statusInfo.label}
                        </Badge>
                        {wagon.real_weight && (
                          <span className="text-sm text-muted-foreground hidden sm:inline-block">
                            {wagon.real_weight.toLocaleString()} т.
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="border rounded-lg mt-2 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead className="w-1/3">Параметр</TableHead>
                              <TableHead>Значение</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Tag className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">ID</span>
                              </TableCell>
                              <TableCell>{wagon.id}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">
                                  Номер вагона
                                </span>
                              </TableCell>
                              <TableCell>{wagon.number}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">
                                  Вес по документам
                                </span>
                              </TableCell>
                              <TableCell>
                                {wagon.capacity?.toLocaleString()} т.
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-green-500" />
                                <span className="font-medium">
                                  Фактический вес
                                </span>
                              </TableCell>
                              <TableCell>
                                {wagon.real_weight?.toLocaleString()}т.
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-500" />
                                <span className="font-medium">Владелец</span>
                              </TableCell>
                              <TableCell>{wagon.owner}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-amber-500" />
                                <span className="font-medium">Статус</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`flex w-fit items-center gap-1 ${statusInfo.className}`}
                                >
                                  {statusInfo.icon}
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                <span className="font-medium">
                                  Дата отправления
                                </span>
                              </TableCell>
                              <TableCell>
                                {wagon.date_of_departure
                                  ? formatDate(wagon.date_of_departure)
                                  : "Не указана"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Файлы</span>
                              </TableCell>
                              <TableCell>
                                {wagon.files && wagon.files.length > 0 ? (
                                  <div className="flex flex-col gap-2">
                                    {wagon.files.map(
                                      (file: any, fileIndex: number) => (
                                        <div
                                          key={fileIndex}
                                          className="flex items-center justify-between"
                                        >
                                          <div className="flex items-center gap-2">
                                            <File className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm">
                                              {file.name}
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    Нет прикрепленных файлов
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Вагоны не найдены</p>
              {searchTerm && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveTab("all");
                  }}
                >
                  Сбросить фильтры
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
