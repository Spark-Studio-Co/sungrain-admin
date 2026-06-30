"use client";

import { Fragment, useMemo, useState } from "react";
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
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getWagonExpansionId } from "./wagon-expansion";
import {
  getWagonActualWeightValue,
  getWagonCapacityValue,
} from "@/shared/contracts/contract-ops";
import {
  getOrderedWagonStatuses,
  sortWagonsByStatusGroup,
  type WagonDateSortOrder,
} from "@/shared/contracts/wagon-sort";

interface WagonDetailsProps {
  wagons: any[];
  handleFileDownload: (fileUrl: string, fileName: string) => void;
  capacityStats?: any;
  contractData?: any;
}

const formatDateSafe = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMMM yyyy", { locale: ru });
  } catch {
    return dateString;
  }
};

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

const getWagonData = (wagon: any) => {
  const capacity = getWagonCapacityValue(wagon);
  const realWeight = getWagonActualWeightValue(wagon);
  const wagonId = getWagonExpansionId(wagon);
  const wagonNumber =
    wagon.number || wagon.wagon?.number || `Вагон ${wagonId}`;
  const wagonOwner = wagon.owner || wagon.wagon?.owner || "Не указан";
  const wagonStatus = wagon.status || wagon.wagon?.status || "unknown";

  return {
    capacity,
    realWeight,
    wagonId,
    wagonNumber,
    wagonOwner,
    wagonStatus,
  };
};

const getWagonApplicationId = (wagon: any) =>
  wagon?.applicationId ??
  wagon?.application_id ??
  wagon?.application?.id ??
  wagon?.application?.uuid ??
  wagon?.application?.id_application;

const getApplicationDisplayLabel = (
  application: any,
  index?: number,
  applicationId?: unknown
) => {
  const explicitName =
    application?.name ||
    application?.title ||
    application?.number ||
    application?.application_number;

  if (explicitName) return String(explicitName);
  if (typeof index === "number") return `Приложение №${index + 1}`;
  if (applicationId !== null && applicationId !== undefined && applicationId !== "") {
    return `Приложение ${applicationId}`;
  }

  return "Без приложения";
};

const buildApplicationLookup = (applications: any[] = []) => {
  const lookup: Record<string, string> = {};

  applications.forEach((application, index) => {
    const label = getApplicationDisplayLabel(application, index);

    [
      application?.id,
      application?.uuid,
      application?._id,
      application?.id_application,
    ].forEach((id) => {
      if (id !== null && id !== undefined && id !== "") {
        lookup[String(id)] = label;
      }
    });
  });

  return lookup;
};

const resolveWagonApplicationLabel = (
  wagon: any,
  applicationLookup: Record<string, string>
) => {
  const applicationId = getWagonApplicationId(wagon);

  if (
    applicationId !== null &&
    applicationId !== undefined &&
    applicationLookup[String(applicationId)]
  ) {
    return applicationLookup[String(applicationId)];
  }

  if (wagon?.application) {
    return getApplicationDisplayLabel(wagon.application, undefined, applicationId);
  }

  return getApplicationDisplayLabel(null, undefined, applicationId);
};

export const WagonDetails = ({
  wagons = [],
  handleFileDownload,
  contractData,
}: WagonDetailsProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dateSortOrder, setDateSortOrder] = useState<WagonDateSortOrder>(null);

  const applicationLookup = useMemo(
    () => buildApplicationLookup(contractData?.applications || []),
    [contractData]
  );

  const rawWagonRows = useMemo(
    () =>
      wagons.map((wagon: any) => ({
        wagon,
        applicationLabel: resolveWagonApplicationLabel(
          wagon,
          applicationLookup
        ),
      })),
    [wagons, applicationLookup]
  );

  // Единый список всех вагонов: приложение показываем внутри строки, без разбиения на группы.
  const filteredWagonRows = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const rows = rawWagonRows.filter(({ wagon, applicationLabel }) => {
      const { capacity, realWeight, wagonId, wagonNumber, wagonOwner, wagonStatus } =
        getWagonData(wagon);
      const matchesSearch =
        wagonNumber?.toLowerCase().includes(searchLower) ||
        wagonOwner?.toLowerCase().includes(searchLower) ||
        wagonStatus?.toLowerCase().includes(searchLower) ||
        wagonId?.toString().includes(searchLower) ||
        applicationLabel.toLowerCase().includes(searchLower) ||
        capacity?.toString().includes(searchLower) ||
        realWeight?.toString().includes(searchLower) ||
        wagon.files?.some((file: any) =>
          file.name?.toLowerCase().includes(searchLower)
        );
      const matchesTab = activeTab === "all" || wagonStatus === activeTab;

      return matchesSearch && matchesTab;
    });

    return sortWagonsByStatusGroup(rows, dateSortOrder);
  }, [rawWagonRows, searchTerm, activeTab, dateSortOrder]);

  const statuses = useMemo(
    () =>
      getOrderedWagonStatuses(
        rawWagonRows.map(({ wagon }) => getWagonData(wagon).wagonStatus)
      ),
    [rawWagonRows]
  );

  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = rawWagonRows.filter(
      ({ wagon }) => getWagonData(wagon).wagonStatus === status
    ).length;
    return acc;
  }, {} as Record<string, number>);

  const totalWagons = rawWagonRows.length;

  const toggleRowExpansion = (wagonId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [wagonId]: !prev[wagonId],
    }));
  };

  const expandAllRows = () => {
    setExpandedRows(
      filteredWagonRows.reduce<Record<string, boolean>>((acc, { wagon }) => {
        const wagonId = getWagonExpansionId(wagon);

        if (wagonId) {
          acc[wagonId] = true;
        }

        return acc;
      }, {})
    );
  };

  const collapseAllRows = () => {
    setExpandedRows({});
  };

  const areAllRowsExpanded = useMemo(() => {
    const visibleWagonIds = filteredWagonRows
      .map(({ wagon }) => getWagonExpansionId(wagon))
      .filter(Boolean);

    return (
      visibleWagonIds.length > 0 &&
      visibleWagonIds.every((wagonId) => expandedRows[wagonId])
    );
  }, [filteredWagonRows, expandedRows]);

  const toggleExpandAll = () => {
    if (areAllRowsExpanded) {
      collapseAllRows();
    } else {
      expandAllRows();
    }
  };

  const hasActiveFilters =
    searchTerm || activeTab !== "all" || dateSortOrder !== null;

  return (
    <Card className="sungrain-analytics-card overflow-hidden">
      <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
              <TrainFront className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl font-black text-[#223137]">
                Детали вагонов
              </CardTitle>
              <CardDescription className="mt-1 hidden text-sm text-[#6f7774] sm:block">
                Реестр вагонов, документы и статусы по заявкам
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleExpandAll}
            className="hidden h-10 flex-shrink-0 items-center gap-2 rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm hover:bg-[#fff3e5] hover:text-[#d5740b] sm:flex"
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
      <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
        <div className="space-y-4">
          <div className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
            <div className="flex min-w-0 flex-col gap-3 2xl:flex-row 2xl:items-center">
              <div className="flex flex-1 flex-col gap-2 xl:flex-row xl:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a928f]" />
                  <Input
                    type="search"
                    placeholder="Поиск по вагонам..."
                    className="h-10 rounded-md border-[#dce4da] bg-white pl-9 text-[#223137] shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <ToggleGroup
                  type="single"
                  value={dateSortOrder || ""}
                  className="flex shrink-0 items-center gap-2"
                  onValueChange={(value) =>
                    setDateSortOrder((value as any) || null)
                  }
                >
                  <ToggleGroupItem
                    value="newest"
                    aria-label="Сначала новые"
                    className="h-10 gap-1 whitespace-nowrap rounded-md border border-[#dce4da] bg-white px-3 font-semibold text-[#41514b] data-[state=on]:border-[#f38810] data-[state=on]:bg-[#fff3e5] data-[state=on]:text-[#d5740b]"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Сначала новые</span>
                    <ChevronDown className="h-3 w-3" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="oldest"
                    aria-label="Сначала старые"
                    className="h-10 gap-1 whitespace-nowrap rounded-md border border-[#dce4da] bg-white px-3 font-semibold text-[#41514b] data-[state=on]:border-[#f38810] data-[state=on]:bg-[#fff3e5] data-[state=on]:text-[#d5740b]"
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
                  className="h-10 rounded-md border-[#dce4da] bg-white font-bold text-[#223137] shadow-sm sm:hidden"
                >
                  {areAllRowsExpanded ? "Свернуть все" : "Раскрыть все"}
                </Button>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full min-w-0 shrink-0 2xl:max-w-[720px]"
              >
                <TabsList className="grid h-auto min-h-10 w-full grid-cols-2 gap-1 rounded-md bg-[#f4f7f3] p-1 lg:h-10 lg:grid-cols-4 lg:gap-0">
                  <TabsTrigger
                    value="all"
                    className="h-8 whitespace-nowrap rounded-md px-2 text-xs font-black text-[#6f7774] data-[state=active]:bg-[#1f5a43] data-[state=active]:text-white sm:px-3 sm:text-sm"
                  >
                    Все ({totalWagons})
                  </TabsTrigger>
                  {statuses.map((status) => (
                    <TabsTrigger
                      key={status}
                      value={status}
                      className="h-8 whitespace-nowrap rounded-md px-2 text-xs font-black text-[#6f7774] data-[state=active]:bg-[#1f5a43] data-[state=active]:text-white sm:px-3 sm:text-sm"
                    >
                      {getStatusInfo(status).label} ({statusCounts[status]})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {filteredWagonRows.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-[#dfe7de] bg-white shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
              <div className="hidden border-b border-[#edf2ec] bg-[#fbfcfa] px-4 py-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-black text-[#223137]">
                    Единый список всех вагонов
                  </h3>
                  <p className="mt-0.5 text-xs text-[#7b857f]">
                    Все вагоны в одном реестре, приложение указано в строке
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-[#dfe7de] bg-white px-2 py-1 text-xs font-black text-[#315844]"
                >
                  {filteredWagonRows.length} из {totalWagons}
                </Badge>
              </div>

              <div className="block space-y-3 p-3 sm:hidden">
                {filteredWagonRows.map(({ wagon, applicationLabel }, index) => {
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
                  const rowKey = wagonId || `${wagonNumber}-${index}`;

                  return (
                    <div
                      key={rowKey}
                      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                    >
                      <div
                        className={cn(
                          "cursor-pointer p-3 transition-colors duration-150",
                          isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                        )}
                        onClick={() => toggleRowExpansion(wagonId)}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                № {wagonNumber}
                              </span>
                              <Badge
                                variant="outline"
                                aria-label={`Приложение строки вагона: ${applicationLabel}`}
                                title={`К какому приложению относится вагон: ${applicationLabel}`}
                                className="flex max-w-[150px] shrink items-center gap-1 truncate border-[#f2dfca] bg-[#fff8ed] px-2 py-0.5 text-[10px] font-black text-[#d5740b]"
                              >
                                <FileBox className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {applicationLabel}
                                </span>
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "h-6 w-6 flex-shrink-0 rounded-full",
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
                            <div className="truncate text-xs text-slate-500">
                              {wagonOwner}
                            </div>
                          </div>
                          <div className="ml-2 flex-shrink-0">
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
                            <span className="text-slate-500">Дата:</span>
                            <div className="font-medium">
                              {wagon.date_of_unloading
                                ? formatDateSafe(wagon.date_of_unloading)
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Вес:</span>
                            <div className="font-medium">
                              {realWeight
                                ? `${formatNumber(realWeight)} т.`
                                : "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="animate-in fade-in-50 border-t border-slate-100 bg-slate-50 p-3 duration-200">
                          <div className="space-y-3">
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-100 p-3">
                                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                  <Info className="h-3 w-3 text-slate-500" />
                                  Основная информация
                                </h3>
                              </div>
                              <div className="space-y-2 p-3">
                                <div className="flex justify-between border-b border-dashed border-slate-200 py-1">
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <TrainFront className="h-3 w-3 text-amber-500" />
                                    Номер
                                  </span>
                                  <span className="text-xs font-medium">
                                    {wagonNumber}
                                  </span>
                                </div>
                                <div className="flex justify-between gap-3 border-b border-dashed border-slate-200 py-1">
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <FileBox className="h-3 w-3 text-[#d5740b]" />
                                    Приложение
                                  </span>
                                  <span
                                    className="max-w-[50%] truncate text-xs font-medium"
                                    title={`К какому приложению относится вагон: ${applicationLabel}`}
                                  >
                                    {applicationLabel}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 py-1">
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <User className="h-3 w-3 text-indigo-500" />
                                    Владелец
                                  </span>
                                  <span className="max-w-[50%] truncate text-xs font-medium">
                                    {wagonOwner}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 py-1">
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="h-3 w-3 text-purple-500" />
                                    Дата отгрузки
                                  </span>
                                  <span className="text-xs font-medium">
                                    {wagon.date_of_unloading
                                      ? formatDateSafe(wagon.date_of_unloading)
                                      : "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="flex items-center gap-1 text-xs text-slate-500">
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

                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-100 p-3">
                                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                  <Weight className="h-3 w-3 text-slate-500" />
                                  Информация о весе
                                </h3>
                              </div>
                              <div className="space-y-2 p-3">
                                <div className="flex justify-between border-b border-dashed border-slate-200 py-1">
                                  <span className="text-xs text-slate-500">
                                    По документам
                                  </span>
                                  <span className="text-xs font-medium">
                                    {capacity
                                      ? `${formatNumber(capacity)} т.`
                                      : "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-dashed border-slate-200 py-1">
                                  <span className="text-xs text-slate-500">
                                    Фактический
                                  </span>
                                  <span className="text-xs font-medium">
                                    {realWeight
                                      ? `${formatNumber(realWeight)} т.`
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
                                        {formatNumber(realWeight - capacity)} т.
                                      </span>
                                    ) : (
                                      "—"
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-100 p-3">
                                <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                  <FileText className="h-3 w-3 text-blue-500" />
                                  Документы
                                </h3>
                              </div>
                              <div className="p-3">
                                {wagon.files && wagon.files.length > 0 ? (
                                  <div className="space-y-2">
                                    {wagon.files.map(
                                      (file: any, fileIndex: number) => (
                                        <div
                                          key={fileIndex}
                                          className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2"
                                        >
                                          <div className="flex min-w-0 flex-1 items-center gap-2">
                                            <div className="flex-shrink-0 rounded-md bg-blue-100 p-1">
                                              <File className="h-3 w-3 text-blue-500" />
                                            </div>
                                            <span className="truncate text-xs font-medium">
                                              {file.name}
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 flex-shrink-0 gap-1 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                                    <div className="mb-2 rounded-full bg-slate-100 p-2">
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

              <div className="hidden sm:block">
                <Table className="min-w-[960px]">
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="w-[220px]">Приложение</TableHead>
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
                    {filteredWagonRows.map(
                      ({ wagon, applicationLabel }, index) => {
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
                        const rowKey = wagonId || `${wagonNumber}-${index}`;

                        return (
                          <Fragment key={rowKey}>
                            <TableRow
                              className={cn(
                                isExpanded
                                  ? "bg-slate-50"
                                  : "hover:bg-muted/10",
                                "transition-colors duration-150"
                              )}
                            >
                              <TableCell>
                                <div className="flex min-w-0 items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-8 w-8 shrink-0 rounded-full transition-colors duration-150",
                                      isExpanded
                                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                                        : "hover:bg-slate-100"
                                    )}
                                    onClick={() => toggleRowExpansion(wagonId)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Badge
                                    variant="outline"
                                    aria-label={`Приложение строки вагона: ${applicationLabel}`}
                                    title={`К какому приложению относится вагон: ${applicationLabel}`}
                                    className="flex max-w-[140px] items-center gap-1 truncate border-[#f2dfca] bg-[#fff8ed] px-2 py-1 text-[11px] font-black text-[#d5740b]"
                                  >
                                    <FileBox className="h-3 w-3 shrink-0" />
                                    <span className="truncate">
                                      {applicationLabel}
                                    </span>
                                  </Badge>
                                </div>
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
                                  ? formatDateSafe(wagon.date_of_unloading)
                                  : "—"}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {realWeight
                                  ? `${formatNumber(realWeight)} т.`
                                  : "-"}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="border-t border-slate-100 bg-slate-50">
                                <TableCell colSpan={6} className="p-0">
                                  <div className="animate-in fade-in-50 space-y-4 p-5 duration-200">
                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                      <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-2 md:divide-x md:divide-y-0">
                                        <div className="space-y-3 p-4">
                                          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Info className="h-4 w-4 text-slate-500" />
                                            Основная информация
                                          </h3>
                                          <div className="space-y-2">
                                            <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
                                              <span className="flex items-center gap-2 text-sm text-slate-500">
                                                <TrainFront className="h-4 w-4 text-amber-500" />
                                                Номер вагона
                                              </span>
                                              <span className="text-sm font-medium">
                                                {wagonNumber}
                                              </span>
                                            </div>
                                            <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1.5">
                                              <span className="flex items-center gap-2 text-sm text-slate-500">
                                                <FileBox className="h-4 w-4 text-[#d5740b]" />
                                                Приложение
                                              </span>
                                              <span
                                                className="max-w-[55%] truncate text-sm font-medium text-[#223137]"
                                                title={`К какому приложению относится вагон: ${applicationLabel}`}
                                              >
                                                {applicationLabel}
                                              </span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
                                              <span className="flex items-center gap-2 text-sm text-slate-500">
                                                <User className="h-4 w-4 text-indigo-500" />
                                                Владелец
                                              </span>
                                              <span className="text-sm font-medium">
                                                {wagonOwner}
                                              </span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
                                              <span className="flex items-center gap-2 text-sm text-slate-500">
                                                <Calendar className="h-4 w-4 text-purple-500" />
                                                Дата отгрузки
                                              </span>
                                              <span className="text-sm font-medium">
                                                {wagon.date_of_unloading
                                                  ? formatDateSafe(
                                                      wagon.date_of_unloading
                                                    )
                                                  : "—"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between py-1.5">
                                              <span className="flex items-center gap-2 text-sm text-slate-500">
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
                                        <div className="space-y-3 p-4">
                                          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Weight className="h-4 w-4 text-slate-500" />
                                            Информация о весе
                                          </h3>
                                          <div className="space-y-2">
                                            <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
                                              <span className="text-sm text-slate-500">
                                                Вес по документам
                                              </span>
                                              <span className="text-sm font-medium">
                                                {capacity
                                                  ? `${formatNumber(capacity)} т.`
                                                  : "—"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between border-b border-dashed border-slate-200 py-1.5">
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
                                      </div>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                                      <div className="border-b border-slate-200 p-4">
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                          <FileText className="h-4 w-4 text-blue-500" />
                                          Документы
                                        </h3>
                                      </div>
                                      <div className="p-4">
                                        {wagon.files && wagon.files.length > 0 ? (
                                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {wagon.files.map(
                                              (
                                                file: any,
                                                fileIndex: number
                                              ) => (
                                                <div
                                                  key={fileIndex}
                                                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <div className="rounded-md bg-blue-100 p-1.5">
                                                      <File className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                      {file.name}
                                                    </span>
                                                  </div>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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
                                            <div className="mb-3 rounded-full bg-slate-100 p-3">
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
                          </Fragment>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border bg-muted/10 py-12 text-center">
              <TrainFront className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
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
