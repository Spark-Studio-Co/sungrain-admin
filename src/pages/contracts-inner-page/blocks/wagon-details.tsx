"use client";

import { useState } from "react";
import {
  Search,
  Building2,
  CheckCircle2,
  Circle,
  File,
  Download,
  Calendar,
  Weight,
  User,
  Info,
  FileText,
  ChevronDown,
  ChevronUp,
  TrainFront,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

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
          icon: <TrainFront className="h-3.5 w-3.5" />,
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

  // Toggle row expansion
  const toggleRowExpansion = (wagonId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [wagonId]: !prev[wagonId],
    }));
  };

  // Expand all rows
  const expandAllRows = () => {
    const allExpanded = filteredWagons.reduce((acc, wagon) => {
      acc[wagon.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedRows(allExpanded);
  };

  // Collapse all rows
  const collapseAllRows = () => {
    setExpandedRows({});
  };

  // Check if all rows are expanded
  const areAllRowsExpanded =
    filteredWagons.length > 0 &&
    filteredWagons.every((wagon) => expandedRows[wagon.id]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-full">
            <TrainFront className="h-6 w-6 text-amber-500" />
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
            <>
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={areAllRowsExpanded ? collapseAllRows : expandAllRows}
                >
                  {areAllRowsExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                      Свернуть все
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                      Развернуть все
                    </>
                  )}
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Номер вагона</TableHead>
                      <TableHead>Владелец</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Вес
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWagons.map((wagon) => {
                      const statusInfo = getStatusInfo(wagon.status);
                      const isExpanded = expandedRows[wagon.id] || false;

                      return (
                        <>
                          <TableRow
                            key={wagon.id}
                            className={cn(
                              isExpanded ? "bg-slate-50" : "hover:bg-muted/10",
                              "transition-colors duration-150"
                            )}
                          >
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-8 w-8 rounded-full transition-colors duration-150",
                                  isExpanded
                                    ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                    : "hover:bg-slate-100"
                                )}
                                onClick={() => toggleRowExpansion(wagon.id)}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {wagon.number}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium">
                              {wagon.owner}
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
                            <TableCell className="hidden md:table-cell">
                              {wagon.real_weight
                                ? `${wagon.real_weight.toLocaleString()} т.`
                                : "-"}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-slate-50 border-t border-slate-100">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-5 space-y-4 animate-in fade-in-50 duration-200">
                                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                                      <div className="p-4 space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                          <Info className="h-4 w-4 text-slate-500" />
                                          Основная информация
                                        </h3>
                                        <div className="space-y-2">
                                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                              <TrainFront className="h-4 w-4 text-amber-500" />
                                              Номер вагона
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.number}
                                            </span>
                                          </div>
                                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                              <User className="h-4 w-4 text-indigo-500" />
                                              Владелец
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.owner}
                                            </span>
                                          </div>
                                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                              <Calendar className="h-4 w-4 text-purple-500" />
                                              Дата отгрузки
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.date_of_unloading
                                                ? formatDate(
                                                    wagon.date_of_unloading
                                                  )
                                                : "—"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between py-1.5">
                                            <span className="text-sm text-slate-500 flex items-center gap-2">
                                              <Info className="h-4 w-4 text-amber-500" />
                                              Статус
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className={`flex w-fit items-center gap-1 ${statusInfo.className}`}
                                            >
                                              {statusInfo.icon}
                                              {statusInfo.label}
                                            </Badge>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="p-4 space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                          <Weight className="h-4 w-4 text-slate-500" />
                                          Информация о весе
                                        </h3>
                                        <div className="space-y-2">
                                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                            <span className="text-sm text-slate-500">
                                              Вес по документам
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.capacity
                                                ? `${wagon.capacity.toLocaleString()} т.`
                                                : "—"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                            <span className="text-sm text-slate-500">
                                              Фактический вес
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.real_weight
                                                ? `${wagon.real_weight.toLocaleString()} т.`
                                                : "—"}
                                            </span>
                                          </div>
                                          <div className="flex justify-between py-1.5">
                                            <span className="text-sm text-slate-500">
                                              Разница
                                            </span>
                                            <span className="text-sm font-medium">
                                              {wagon.capacity &&
                                              wagon.real_weight ? (
                                                <span
                                                  className={
                                                    wagon.real_weight >
                                                    wagon.capacity
                                                      ? "text-green-600"
                                                      : wagon.real_weight <
                                                        wagon.capacity
                                                      ? "text-red-600"
                                                      : ""
                                                  }
                                                >
                                                  {(
                                                    wagon.real_weight -
                                                    wagon.capacity
                                                  ).toLocaleString()}{" "}
                                                  т.
                                                </span>
                                              ) : (
                                                "—"
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                    <div className="p-4 border-b border-slate-200">
                                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        Документы
                                      </h3>
                                    </div>
                                    <div className="p-4">
                                      {wagon.files && wagon.files.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          {wagon.files.map(
                                            (file: any, fileIndex: number) => (
                                              <div
                                                key={fileIndex}
                                                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <div className="p-1.5 bg-blue-100 rounded-md">
                                                    <File className="h-4 w-4 text-blue-500" />
                                                  </div>
                                                  <span className="text-sm font-medium">
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
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                          <div className="p-3 bg-slate-100 rounded-full mb-3">
                                            <FileText className="h-6 w-6 text-slate-400" />
                                          </div>
                                          <p className="text-slate-500">
                                            Нет прикрепленных файлов
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <TrainFront className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
