"use client";

import { useState, useMemo } from "react";
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
  CalendarIcon,
  X,
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
import { format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface WagonDetailsProps {
  wagons: any[];
  handleFileDownload: (fileUrl: string, fileName: string) => void;
  capacityStats?: any;
  contractData?: any;
}

export const WagonDetails = ({
  wagons = [],
  handleFileDownload,
  capacityStats,
  contractData,
}: WagonDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [expandedApplications, setExpandedApplications] = useState<string[]>(
    []
  );
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Format date for display in the date picker button
  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd.MM.yyyy")} - ${format(
        dateRange.to,
        "dd.MM.yyyy"
      )}`;
    }
    if (dateRange.from) {
      return `С ${format(dateRange.from, "dd.MM.yyyy")}`;
    }
    if (dateRange.to) {
      return `До ${format(dateRange.to, "dd.MM.yyyy")}`;
    }
    return "Выберите даты";
  };

  // Clear date filter
  const clearDateFilter = () => {
    setDateRange({ from: null, to: null });
  };

  // Get unique statuses for filtering
  const statuses = Array.from(
    new Set(wagons?.map((wagon) => wagon.status) || [])
  );

  // Get unique wagon owners for filtering
  const wagonOwners = useMemo(() => {
    const owners = new Set<string>();
    wagons.forEach((wagon) => {
      const owner = wagon.owner || "Не указан";
      owners.add(owner);
    });
    return Array.from(owners).sort();
  }, [wagons]);

  // Group wagons by application name
  const wagonsByApplication = useMemo(() => {
    // Создаем карту приложений по ID для быстрого доступа
    const applicationMap = {};

    if (contractData?.applications) {
      contractData.applications.forEach((app) => {
        applicationMap[app.id] = app;
      });
    }

    // Группируем вагоны по applicationId
    const groupedWagons = {};

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

  // Check if a date is within the selected range
  const isDateInRange = (dateString: string | null | undefined) => {
    if (!dateString) return false;

    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return false;

      const isAfterFrom =
        !dateRange.from ||
        isAfter(date, dateRange.from) ||
        date.getTime() === dateRange.from.getTime();
      const isBeforeTo =
        !dateRange.to ||
        isBefore(date, dateRange.to) ||
        date.getTime() === dateRange.to.getTime();

      return isAfterFrom && isBeforeTo;
    } catch (e) {
      return false;
    }
  };

  // Filter wagons based on search term, active tab, owner, and date range
  const filteredWagons = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const hasDateFilter = dateRange.from || dateRange.to;

    return wagonsByApplication
      .map((group) => {
        const filteredGroupWagons = group.wagons.filter((wagon) => {
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
          const matchesOwner =
            selectedOwner === "all" || wagon.owner === selectedOwner;
          const matchesDateRange =
            !hasDateFilter || isDateInRange(wagon.date_of_unloading);

          return (
            matchesSearch && matchesTab && matchesOwner && matchesDateRange
          );
        });

        return {
          ...group,
          wagons: filteredGroupWagons,
          visible: filteredGroupWagons.length > 0,
        };
      })
      .filter((group) => group.visible);
  }, [wagonsByApplication, searchTerm, activeTab, selectedOwner, dateRange]);

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
    const allExpanded = wagons.reduce((acc, wagon) => {
      acc[wagon.id || wagon.wagon_id] = true;
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
    wagons.length > 0 &&
    wagons.every((wagon) => expandedRows[wagon.id || wagon.wagon_id]);

  // Get wagon capacity and real weight, handling different API response structures
  const getWagonData = (wagon) => {
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
  const getApplicationStats = (wagons) => {
    const totalCapacity = wagons.reduce((sum, wagon) => {
      const capacity =
        wagon.capacity || (wagon.wagon && wagon.wagon.capacity) || 0;
      return sum + capacity;
    }, 0);

    const totalRealWeight = wagons.reduce((sum, wagon) => {
      const realWeight =
        wagon.real_weight || (wagon.wagon && wagon.wagon.real_weight) || 0;
      return sum + realWeight;
    }, 0);

    return {
      totalCapacity,
      totalRealWeight,
      wagonCount: wagons.length,
    };
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    activeTab !== "all" ||
    selectedOwner !== "all" ||
    dateRange.from ||
    dateRange.to;

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
          <div className="flex flex-col gap-4">
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

              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full sm:w-auto",
                      (dateRange.from || dateRange.to) && "text-primary"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                    {(dateRange.from || dateRange.to) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 -mr-1 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearDateFilter();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from || new Date()}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      setDateRange(range || { from: null, to: null });
                      if (range?.to) {
                        setIsDatePickerOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
              >
                <option value="all">Все владельцы</option>
                {wagonOwners.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full sm:w-auto"
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
                              {group.wagons.map((wagon) => {
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
                                          ? formatDate(wagon.date_of_unloading)
                                          : "—"}
                                      </TableCell>
                                      <TableCell className="hidden md:table-cell">
                                        {realWeight
                                          ? `${realWeight.toLocaleString()} т.`
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
                                                          ? `${capacity.toLocaleString()} т.`
                                                          : "—"}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between py-1.5 border-b border-dashed border-slate-200">
                                                      <span className="text-sm text-slate-500">
                                                        Фактический вес
                                                      </span>
                                                      <span className="text-sm font-medium">
                                                        {realWeight
                                                          ? `${realWeight.toLocaleString()} т.`
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
                                                            {(
                                                              realWeight -
                                                              capacity
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
                                                {wagon.files &&
                                                wagon.files.length > 0 ? (
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {wagon.files.map(
                                                      (file, fileIndex) => (
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
                    setSelectedOwner("all");
                    clearDateFilter();
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
