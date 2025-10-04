"use client";

import { useState, useMemo } from "react";
import { formatNumber } from "@/lib/utils";
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
  FileBox,
  ChevronDownIcon,
  ChevronUpIcon,
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
import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface WagonDetailsProps {
  wagons: any[];
  handleFileDownload: (fileUrl: string, fileName: string) => void;
  capacityStats?: any;
  contractData?: any;
}

export const WagonDetails = ({
  wagons = [],
  handleFileDownload,
  contractData,
}: WagonDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedApplications, setExpandedApplications] = useState<string[]>(
    []
  );
  const [dateSortOrder, setDateSortOrder] = useState<
    "newest" | "oldest" | null
  >(null);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Parse date safely
  const parseDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      return null;
    }
  };

  // Get unique statuses for filtering
  const statuses = Array.from(
    new Set(wagons?.map((wagon) => wagon.status) || [])
  );

  // Group wagons by application name
  const wagonsByApplication = useMemo(() => {
    // Создаем карту приложений по ID для быстрого доступа
    const applicationMap: { [key: string]: any } = {};

    if (contractData?.applications) {
      contractData.applications.forEach((app: any) => {
        applicationMap[app.id] = app;
      });
    }

    // Группируем вагоны по applicationId
    const groupedWagons: { [key: string]: any } = {};

    wagons.forEach((wagon) => {
      const applicationId = wagon.applicationId;

      if (!applicationId) {
        // Если нет applicationId, помещаем в группу "Без приложения"
        if (!groupedWagons["none"]) {
          groupedWagons["none"] = {
            application: { id: "none", name: "Без приложения" },
            wagons: [],
          };
        }
        groupedWagons["none"].wagons.push(wagon);
        return;
      }

      // Получаем приложение из карты по ID
      const application = applicationMap[applicationId];

      if (!application) {
        // Если приложение не найдено, используем ID как ключ
        if (!groupedWagons[`app-${applicationId}`]) {
          groupedWagons[`app-${applicationId}`] = {
            application: {
              id: applicationId,
              name: `Приложение ${applicationId}`,
            },
            wagons: [],
          };
        }
        groupedWagons[`app-${applicationId}`].wagons.push(wagon);
        return;
      }

      // Используем ID приложения как ключ для группировки
      const appId = application.id;

      if (!groupedWagons[appId]) {
        groupedWagons[appId] = {
          application: application, // Используем полный объект приложения с name
          wagons: [],
        };
      }

      groupedWagons[appId].wagons.push(wagon);
    });

    return Object.values(groupedWagons);
  }, [wagons, contractData]);

  // Filter and sort wagons
  const filteredWagons = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return wagonsByApplication
      .map((group) => {
        let filteredGroupWagons = (group as any).wagons.filter((wagon: any) => {
          const matchesSearch =
            wagon.number?.toLowerCase().includes(searchLower) ||
            wagon.owner?.toLowerCase().includes(searchLower) ||
            wagon.status?.toLowerCase().includes(searchLower) ||
            wagon.id?.toString().includes(searchLower) ||
            (wagon.wagon?.capacity || wagon.capacity)
              ?.toString()
              .includes(searchLower) ||
            (wagon.wagon?.real_weight || wagon.real_weight)
              ?.toString()
              .includes(searchLower) ||
            wagon.files?.some((file) =>
              file.name?.toLowerCase().includes(searchLower)
            );

          const matchesTab = activeTab === "all" || wagon.status === activeTab;

          return matchesSearch && matchesTab;
        });

        // Sort by date if sort order is specified
        if (dateSortOrder) {
          filteredGroupWagons = [...filteredGroupWagons].sort((a, b) => {
            const dateA = parseDate(a.date_of_unloading);
            const dateB = parseDate(b.date_of_unloading);

            // Handle null dates (put them at the end)
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            // Sort by date
            return dateSortOrder === "newest"
              ? dateB.getTime() - dateA.getTime()
              : dateA.getTime() - dateB.getTime();
          });
        }

        return {
          ...(group as any),
          wagons: filteredGroupWagons,
          visible: filteredGroupWagons.length > 0,
        };
      })
      .filter((group) => group.visible);
  }, [wagonsByApplication, searchTerm, activeTab, dateSortOrder]);

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
    const allExpanded: { [key: string]: boolean } = {};
    filteredWagons.forEach((group: any) => {
      group.wagons.forEach((wagon: any) => {
        const wagonId = wagon.id || wagon.wagon_id;
        allExpanded[wagonId] = true;
      });
    });
    setExpandedRows(allExpanded);
  };

  // Collapse all rows
  const collapseAllRows = () => {
    setExpandedRows({});
  };

  // Check if all rows are expanded
  const areAllRowsExpanded = useMemo(() => {
    if (filteredWagons.length === 0) return false;

    const allWagonIds: string[] = [];
    filteredWagons.forEach((group: any) => {
      group.wagons.forEach((wagon: any) => {
        allWagonIds.push(wagon.id || wagon.wagon_id);
      });
    });

    return (
      allWagonIds.length > 0 &&
      allWagonIds.every((id: string) => expandedRows[id])
    );
  }, [filteredWagons, expandedRows]);

  // Toggle expand/collapse all
  const toggleExpandAll = () => {
    if (areAllRowsExpanded) {
      collapseAllRows();
    } else {
      expandAllRows();
    }
  };

  // Get wagon capacity and real weight, handling different API response structures
  const getWagonData = (wagon: any) => {
    const capacity =
      wagon.capacity || (wagon.wagon && wagon.wagon.capacity) || 0;
    const realWeight =
      wagon.real_weight || (wagon.wagon && wagon.wagon.real_weight) || 0;
    const wagonId = wagon.id || wagon.wagon_id || 0;
    const wagonNumber = wagon.number || `Вагон ${wagonId}`;
    const wagonOwner = wagon.owner || "Не указан";
    const wagonStatus = wagon.status || "unknown";

    return {
      capacity,
      realWeight,
      wagonId,
      wagonNumber,
      wagonOwner,
      wagonStatus,
    };
  };

  // Calculate application stats
  const getApplicationStats = (wagons: any[]) => {
    const totalCapacity = wagons.reduce((sum: number, wagon: any) => {
      return sum + (wagon.capacity || 0);
    }, 0);

    const totalRealWeight = wagons.reduce((sum: number, wagon: any) => {
      return sum + (wagon.realWeight || 0);
    }, 0);

    return {
      totalCapacity,
      totalRealWeight,
      utilizationPercentage:
        totalCapacity > 0 ? (totalRealWeight / totalCapacity) * 100 : 0,
    };
  }; // Check if any filters are active
  const hasActiveFilters =
    searchTerm || activeTab !== "all" || dateSortOrder !== null;

  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-amber-50 rounded-full flex-shrink-0">
              <TrainFront className="h-4 w-4 sm:h-6 sm:w-6 text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-lg truncate">
                Детали вагонов
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm hidden sm:block">
                Подробная информация о вагонах
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpandAll}
            className="hidden sm:flex items-center gap-1 flex-shrink-0"
          >
            {areAllRowsExpanded ? (
              <>
                <ChevronUpIcon className="h-4 w-4" />
                Свернуть все
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-4 w-4" />
                Раскрыть все
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
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

              <ToggleGroup
                type="single"
                value={dateSortOrder || ""}
                onValueChange={(value) =>
                  setDateSortOrder((value as any) || null)
                }
              >
                <ToggleGroupItem
                  value="newest"
                  aria-label="Сначала новые"
                  className="gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Сначала новые</span>
                  <ChevronDown className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="oldest"
                  aria-label="Сначала старые"
                  className="gap-1"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Сначала старые</span>
                  <ChevronUp className="h-3 w-3" />
                </ToggleGroupItem>
              </ToggleGroup>

              <Button
                variant="outline"
                size="sm"
                onClick={toggleExpandAll}
                className="sm:hidden"
              >
                {areAllRowsExpanded ? "Свернуть все" : "Раскрыть все"}
              </Button>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 h-9">
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
            <div className="space-y-4">
              {filteredWagons.map((group) => {
                const stats = getApplicationStats(group.wagons);

                return (
                  <Accordion
                    key={group.application.id}
                    type="single"
                    collapsible
                    className="border rounded-lg overflow-hidden shadow-sm bg-white"
                    value={
                      expandedApplications.includes(group.application.id)
                        ? group.application.id
                        : undefined
                    }
                    onValueChange={(value) => {
                      if (value) {
                        setExpandedApplications((prev) => [
                          ...prev,
                          group.application.id,
                        ]);
                      } else {
                        setExpandedApplications((prev) =>
                          prev.filter((id) => id !== group.application.id)
                        );
                      }
                    }}
                  >
                    <AccordionItem
                      value={group.application.id}
                      className="border-b-0"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 group">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 bg-blue-100 rounded-md">
                            <FileBox className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-sm font-medium">
                              {group.application.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {stats.wagonCount}{" "}
                              {stats.wagonCount === 1
                                ? "вагон"
                                : stats.wagonCount > 1 && stats.wagonCount < 5
                                ? "вагона"
                                : "вагонов"}{" "}
                              • {stats.totalRealWeight.toFixed(2)} т. из{" "}
                              {stats.totalCapacity.toFixed(2)} т.
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <div className="border-t border-slate-200">
                          {/* Mobile Card Layout */}
                          <div className="block sm:hidden p-3 space-y-3">
                            {group.wagons.map((wagon: any) => {
                              const {
                                wagonId,
                                wagonNumber,
                                wagonOwner,
                                wagonStatus,
                                capacity,
                                realWeight,
                              } = getWagonData(wagon);
                              const statusInfo = getStatusInfo(wagonStatus);
                              const isExpanded = expandedRows[wagonId] || false;

                              return (
                                <div
                                  key={wagonId}
                                  className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm"
                                >
                                  <div
                                    className={cn(
                                      "p-3 cursor-pointer transition-colors duration-150",
                                      isExpanded
                                        ? "bg-slate-50"
                                        : "hover:bg-slate-50"
                                    )}
                                    onClick={() => toggleRowExpansion(wagonId)}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-medium text-sm truncate">
                                            № {wagonNumber}
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                              "h-6 w-6 rounded-full flex-shrink-0",
                                              isExpanded
                                                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                                : "hover:bg-slate-100"
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleRowExpansion(wagonId);
                                            }}
                                          >
                                            {isExpanded ? (
                                              <ChevronUp className="h-3 w-3" />
                                            ) : (
                                              <ChevronDown className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">
                                          {wagonOwner}
                                        </div>
                                      </div>
                                      <div className="flex-shrink-0 ml-2">
                                        <Badge
                                          variant="outline"
                                          className={`flex w-fit items-center gap-1 text-xs ${statusInfo.className}`}
                                        >
                                          {statusInfo.icon}
                                          <span className="hidden xs:inline">
                                            {statusInfo.label}
                                          </span>
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-slate-500">
                                          Дата:
                                        </span>
                                        <div className="font-medium">
                                          {wagon.date_of_unloading
                                            ? formatDate(
                                                wagon.date_of_unloading
                                              )
                                            : "—"}
                                        </div>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">
                                          Вес:
                                        </span>
                                        <div className="font-medium">
                                          {realWeight
                                            ? `${formatNumber(realWeight)} т.`
                                            : "—"}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="border-t border-slate-100 p-3 bg-slate-50 animate-in fade-in-50 duration-200">
                                      <div className="space-y-3">
                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                          <div className="space-y-0">
                                            <div className="p-3 border-b border-slate-100">
                                              <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                                <Info className="h-3 w-3 text-slate-500" />
                                                Основная информация
                                              </h3>
                                            </div>
                                            <div className="p-3 space-y-2">
                                              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                  <TrainFront className="h-3 w-3 text-amber-500" />
                                                  Номер
                                                </span>
                                                <span className="text-xs font-medium">
                                                  {wagonNumber}
                                                </span>
                                              </div>
                                              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                  <User className="h-3 w-3 text-indigo-500" />
                                                  Владелец
                                                </span>
                                                <span className="text-xs font-medium truncate max-w-[50%]">
                                                  {wagonOwner}
                                                </span>
                                              </div>
                                              <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                  <Calendar className="h-3 w-3 text-purple-500" />
                                                  Дата отгрузки
                                                </span>
                                                <span className="text-xs font-medium">
                                                  {wagon.date_of_unloading
                                                    ? formatDate(
                                                        wagon.date_of_unloading
                                                      )
                                                    : "—"}
                                                </span>
                                              </div>
                                              <div className="flex justify-between py-1">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                  <Info className="h-3 w-3 text-amber-500" />
                                                  Статус
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className={`flex w-fit items-center gap-1 text-xs ${statusInfo.className}`}
                                                >
                                                  {statusInfo.icon}
                                                  {statusInfo.label}
                                                </Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                          <div className="p-3 border-b border-slate-100">
                                            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                              <Weight className="h-3 w-3 text-slate-500" />
                                              Информация о весе
                                            </h3>
                                          </div>
                                          <div className="p-3 space-y-2">
                                            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                              <span className="text-xs text-slate-500">
                                                По документам
                                              </span>
                                              <span className="text-xs font-medium">
                                                {capacity
                                                  ? `${formatNumber(
                                                      capacity
                                                    )} т.`
                                                  : "—"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                                              <span className="text-xs text-slate-500">
                                                Фактический
                                              </span>
                                              <span className="text-xs font-medium">
                                                {realWeight
                                                  ? `${formatNumber(
                                                      realWeight
                                                    )} т.`
                                                  : "—"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                              <span className="text-xs text-slate-500">
                                                Разница
                                              </span>
                                              <span className="text-xs font-medium">
                                                {capacity && realWeight ? (
                                                  <span
                                                    className={
                                                      realWeight > capacity
                                                        ? "text-green-600"
                                                        : realWeight < capacity
                                                        ? "text-red-600"
                                                        : ""
                                                    }
                                                  >
                                                    {formatNumber(
                                                      realWeight - capacity
                                                    )}{" "}
                                                    т.
                                                  </span>
                                                ) : (
                                                  "—"
                                                )}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                          <div className="p-3 border-b border-slate-100">
                                            <h3 className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                                              <FileText className="h-3 w-3 text-blue-500" />
                                              Документы
                                            </h3>
                                          </div>
                                          <div className="p-3">
                                            {wagon.files &&
                                            wagon.files.length > 0 ? (
                                              <div className="space-y-2">
                                                {wagon.files.map(
                                                  (
                                                    file: any,
                                                    fileIndex: number
                                                  ) => (
                                                    <div
                                                      key={fileIndex}
                                                      className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md"
                                                    >
                                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div className="p-1 bg-blue-100 rounded-md flex-shrink-0">
                                                          <File className="h-3 w-3 text-blue-500" />
                                                        </div>
                                                        <span className="text-xs font-medium truncate">
                                                          {file.name}
                                                        </span>
                                                      </div>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0 h-6 px-2"
                                                        onClick={() =>
                                                          handleFileDownload(
                                                            file.location,
                                                            file.name
                                                          )
                                                        }
                                                      >
                                                        <Download className="h-3 w-3" />
                                                        <span className="text-xs">
                                                          Скачать
                                                        </span>
                                                      </Button>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center py-4 text-center">
                                                <div className="p-2 bg-slate-100 rounded-full mb-2">
                                                  <FileText className="h-4 w-4 text-slate-400" />
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                  Нет файлов
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Desktop Table Layout */}
                          <div className="hidden sm:block">
                            <Table>
                              <TableHeader className="bg-muted/20">
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Номер вагона</TableHead>
                                  <TableHead>Владелец</TableHead>
                                  <TableHead>Статус</TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    Дата отгрузки
                                  </TableHead>
                                  <TableHead className="hidden md:table-cell">
                                    Вес
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.wagons.map((wagon: any) => {
                                  const {
                                    wagonId,
                                    wagonNumber,
                                    wagonOwner,
                                    wagonStatus,
                                    capacity,
                                    realWeight,
                                  } = getWagonData(wagon);
                                  const statusInfo = getStatusInfo(wagonStatus);
                                  const isExpanded =
                                    expandedRows[wagonId] || false;

                                  return (
                                    <>
                                      <TableRow
                                        key={wagonId}
                                        className={cn(
                                          isExpanded
                                            ? "bg-slate-50"
                                            : "hover:bg-muted/10",
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
                                            onClick={() =>
                                              toggleRowExpansion(wagonId)
                                            }
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
                                            {wagonNumber}
                                          </span>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {wagonOwner}
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
                                          {wagon.date_of_unloading
                                            ? formatDate(
                                                wagon.date_of_unloading
                                              )
                                            : "—"}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                          {realWeight
                                            ? `${formatNumber(realWeight)} т.`
                                            : "-"}
                                        </TableCell>
                                      </TableRow>
                                      {isExpanded && (
                                        <TableRow className="bg-slate-50 border-t border-slate-100">
                                          <TableCell
                                            colSpan={6}
                                            className="p-0"
                                          >
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
                                                          {wagonNumber}
                                                        </span>
                                                      </div>
                                                      <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                                        <span className="text-sm text-slate-500 flex items-center gap-2">
                                                          <User className="h-4 w-4 text-indigo-500" />
                                                          Владелец
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                          {wagonOwner}
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
                                                          {capacity
                                                            ? `${formatNumber(
                                                                capacity
                                                              )} т.`
                                                            : "—"}
                                                        </span>
                                                      </div>
                                                      <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                                        <span className="text-sm text-slate-500">
                                                          Фактический вес
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                          {realWeight
                                                            ? `${formatNumber(
                                                                realWeight
                                                              )} т.`
                                                            : "—"}
                                                        </span>
                                                      </div>
                                                      <div className="flex justify-between py-1.5">
                                                        <span className="text-sm text-slate-500">
                                                          Разница
                                                        </span>
                                                        <span className="text-sm font-medium">
                                                          {capacity &&
                                                          realWeight ? (
                                                            <span
                                                              className={
                                                                realWeight >
                                                                capacity
                                                                  ? "text-green-600"
                                                                  : realWeight <
                                                                    capacity
                                                                  ? "text-red-600"
                                                                  : ""
                                                              }
                                                            >
                                                              {formatNumber(
                                                                realWeight -
                                                                  capacity
                                                              )}{" "}
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
                                                  {wagon.files &&
                                                  wagon.files.length > 0 ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                      {wagon.files.map(
                                                        (
                                                          file: any,
                                                          fileIndex: number
                                                        ) => (
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
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <TrainFront className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Вагоны не найдены</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setActiveTab("all");
                    setDateSortOrder(null);
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
