"use client";

import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  BarChart3,
  CheckCircle2,
  FileDown,
  FileText,
  Link2,
  MapPin,
  Package,
  Receipt,
  Route,
  TrainFront,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { useGetUserContractById } from "@/entities/contracts/hooks/query/use-get-user-contract-by-id.query";
import { useGetContractsId } from "@/entities/contracts/hooks/query/use-get-contract-id.query";
import { useGetCompanies } from "@/entities/companies/hooks/query/use-get-company.query";
import { useGetWagonContracts } from "@/entities/wagon/hooks/query/use-get-contract-wagon.query";
import { useGetApplications } from "@/entities/applications/hooks/query/use-get-applications.query";
import { getInvoices } from "@/entities/invoices/api/get/get-invoices.api";
import { ContractHeader } from "./contract-header";
import { WagonDetails } from "./wagon-details";
import { ApplicationDetail } from "@/screens/application-page/blocks/application-details";
import { ApplicationBlock } from "./contracts-application-block";
import { useParams } from "react-router-dom";
import {
  formatContractMoney,
  getContractFinanceLinks,
  getContractOpsMeta,
  resolveBackendFileUrl,
  sortApplicationsByNaturalOrder,
} from "@/shared/contracts/contract-ops";

interface ContractInnerBlockProps {
  contractId: string;
}

const toEntityArray = <T = any,>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const formatRouteApplicationsCount = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const label =
    mod10 === 1 && mod100 !== 11
      ? "заявка"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "заявки"
        : "заявок";

  return `${count} ${label}`;
};

export const ContractInnerBlock = ({ contractId }: ContractInnerBlockProps) => {
  const { id } = useParams();
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [activeTab, setActiveTab] = useState("applications");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const {
    data: contract,
    isLoading,
    isError,
    refetch,
  } = useGetContractsId(contractId, {
    enabled: isAdmin,
  });

  const {
    data: userContract,
    isLoading: isUserLoading,
    isError: isUserError,
    refetch: userRefetch,
  } = useGetUserContractById(contractId, {
    enabled: !isAdmin,
  });

  // Fetch wagon data using the useGetWagonContracts hook
  const {
    data: wagonContractsData,
    isLoading: isWagonsLoading,
    isError: isWagonsError,
  } = useGetWagonContracts(contractId);

  const { data: companiesData, isLoading: isCompaniesLoading } =
    useGetCompanies(1, 100);

  const contractData = isAdmin ? contract : userContract;
  const isDataLoading = isAdmin ? isLoading : isUserLoading;
  const isDataError = isAdmin ? isError : isUserError;
  const handleRefetch = isAdmin ? refetch : userRefetch;

  const {
    data: contractApplicationsData,
    isLoading: isContractApplicationsLoading,
  } = useGetApplications(contractId);

  // Get company name from ID
  const getCompanyName = (companyId: number) => {
    if (isCompaniesLoading || !companiesData?.data) return "Загрузка...";
    const company = companiesData.data.find((c) => c.id === companyId);
    return company ? company.name : "Неизвестная компания";
  };

  // Combine wagon data from both sources, prioritizing the wagonContractsData
  const wagons = useMemo(
    () =>
      wagonContractsData?.length > 0
        ? wagonContractsData
        : (contractData as any)?.wagons || [],
    [contractData, wagonContractsData],
  );

  const contractApplications = useMemo(() => {
    const backendApplications = toEntityArray<Record<string, any>>(
      contractApplicationsData,
    );

    if (backendApplications.length > 0) {
      return sortApplicationsByNaturalOrder(backendApplications);
    }

    return sortApplicationsByNaturalOrder(
      toEntityArray<Record<string, any>>((contractData as any)?.applications),
    );
  }, [contractApplicationsData, contractData]);

  const invoiceQueries = useQueries({
    queries: contractApplications.map((application) => ({
      queryKey: ["invoices", String(application.id)],
      queryFn: () => getInvoices(String(application.id)),
      enabled: Boolean(application.id),
    })),
  });

  const contractInvoices = useMemo(
    () =>
      contractApplications.flatMap((application, index) =>
        toEntityArray<Record<string, any>>(invoiceQueries[index]?.data).map(
          (invoice) => ({
            ...invoice,
            applicationId:
              invoice.applicationId || invoice.application_id || application.id,
            application,
            currency:
              invoice.currency ||
              application.currency ||
              (contractData as any)?.currency ||
              "USD",
          }),
        ),
      ),
    [contractApplications, contractData, invoiceQueries],
  );

  const isContractFinanceLoading =
    isContractApplicationsLoading ||
    invoiceQueries.some((query) => query.isLoading);

  // const renderedFiles =
  //   wagons
  //     ?.flatMap((wagon: any) => {
  //       return wagon.files && wagon.files.length > 0
  //         ? wagon.files.map((file: any) => ({
  //             file,
  //             wagonNumber: wagon.number,
  //           }))
  //         : [];
  //     })
  //     .filter(Boolean) || [];

  const contractOps = useMemo(
    () =>
      getContractOpsMeta(contractData, {
        wagons,
        applications: contractApplications,
        invoices: contractInvoices,
      }),
    [contractData, wagons, contractApplications, contractInvoices],
  );

  // Calculate shipment usage from the same source as the operational center.
  const volumeStats = useMemo(() => {
    return {
      totalVolume: contractOps.totalVolume,
      documentedShippedVolume: contractOps.documentedShippedVolume,
      actualShippedVolume: contractOps.actualShippedVolume,
      percentUsed: contractOps.progress,
      remainingVolume: contractOps.remainingVolume,
    };
  }, [contractOps]);

  // Calculate wagon capacity statistics
  const wagonCapacityStats = useMemo(() => {
    if (!wagons || wagons.length === 0) {
      return {
        totalCapacity: 0,
        totalRealWeight: 0,
        capacityUtilization: 0,
        wagonCount: 0,
        averageUtilization: 0,
      };
    }

    const wagonCount = wagons.length;
    const totalCapacity = wagons.reduce(
      (sum: number, wagon: any) => sum + (wagon.capacity || 0),
      0,
    );
    const totalRealWeight = wagons.reduce(
      (sum: number, wagon: any) => sum + (wagon.capacity || 0),
      0,
    );
    const capacityUtilization =
      totalCapacity > 0 ? (totalRealWeight / totalCapacity) * 100 : 0;
    const averageUtilization = wagonCount > 0 ? capacityUtilization : 0;

    return {
      totalCapacity,
      totalRealWeight,
      capacityUtilization,
      wagonCount,
      averageUtilization,
    };
  }, [wagons]);

  const contractFinanceLinks = useMemo(
    () => getContractFinanceLinks(contractData, { invoices: contractInvoices }),
    [contractData, contractInvoices],
  );

  const handleDownload = () => {
    if (
      !(contractData as any)?.files ||
      (contractData as any).files.length === 0
    ) {
      alert("Файл не найден!");
      return;
    }

    handleFileDownload(
      (contractData as any).files[0],
      `contract-${(contractData as any).number || (contractData as any).id}.pdf`,
    );
  };

  const handleFileDownload = (fileRef: any, fileName: string) => {
    const fileUrl = resolveBackendFileUrl(fileRef);

    if (!fileUrl) {
      alert("Файл не найден!");
      return;
    }

    const link = document.createElement("a");
    link.href = fileUrl;
    link.setAttribute("download", fileName);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle application selection
  const handleSelectApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setActiveTab("applications");
  };

  // Handle back to applications list
  const handleBackToApplications = () => {
    setSelectedApplicationId(null);
  };

  if (isDataLoading || isWagonsLoading) {
    return (
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
        <Card className="sungrain-analytics-card">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 sm:h-10 w-32 sm:w-40" />
          </CardContent>
        </Card>

        <Card className="sungrain-analytics-card">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="border rounded-lg p-3 sm:p-4">
                <Skeleton className="h-48 sm:h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sungrain-analytics-card">
          <CardHeader className="pb-3 sm:pb-6">
            <Skeleton className="h-6 sm:h-8 w-48 sm:w-64" />
            <Skeleton className="h-3 sm:h-4 w-64 sm:w-96" />
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-3 sm:p-4">
              <Skeleton className="h-48 sm:h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isDataError || isWagonsError) {
    return (
      <div className="w-full min-w-0 max-w-none overflow-x-hidden px-0">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription className="text-sm">
            {isWagonsError
              ? `Не удалось загрузить данные вагонов.`
              : `Не удалось загрузить данные контракта.`}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => handleRefetch()} className="w-full sm:w-auto">
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return (
      <div className="w-full min-w-0 max-w-none overflow-x-hidden px-0">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Контракт не найден</AlertTitle>
          <AlertDescription className="text-sm">
            Не удалось найти данные контракта.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const paidInvoiceCaption =
    contractOps.invoiceCount > 0
      ? `${contractOps.paidInvoiceCount} из ${contractOps.invoiceCount} счетов`
      : "счетов пока нет";
  const balanceInvoiceCaption =
    contractOps.invoiceCount > 0
      ? `${contractOps.openInvoiceCount} счетов к оплате`
      : "счетов пока нет";
  const contractCurrency =
    (contractData as any)?.currency ||
    contractFinanceLinks.invoices[0]?.currency ||
    "USD";
  const isApplicationDetailOpen = Boolean(selectedApplicationId);
  const hasMultipleRoutes = contractOps.routes.length > 1;

  return (
    <>
      <div className="w-full min-w-0 max-w-none space-y-4 overflow-x-hidden px-0">
        <ContractHeader
          contractData={contractData}
          getCompanyName={getCompanyName}
          handleDownload={handleDownload}
        />
        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[linear-gradient(180deg,#fbfcfa_0%,#ffffff_100%)] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-[#dce8dc] bg-[#f5faf5] px-3 py-1 text-[11px] font-bold uppercase text-[#2f6b4f]">
                  <Route className="h-3.5 w-3.5" />
                  Операционный центр
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-[#223137]">
                  Контроль сделки
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm text-[#6f7774]">
                  Быстрый срез по маршруту, отгрузке, документам и финансам.
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[480px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Статус
                  </div>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${contractOps.statusConfig.badgeClassName}`}
                  >
                    {contractOps.statusConfig.label}
                  </Badge>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Следующее действие
                  </div>
                  <div className="mt-2 text-sm font-black text-[#d5740b]">
                    {contractOps.nextAction}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-md border border-[#dfe7de] bg-white p-4 shadow-[0_12px_28px_rgba(34,49,55,0.045)]">
                {hasMultipleRoutes ? (
                  <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-4">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                        <Route className="h-4 w-4 text-[#f38810]" />
                        Маршруты по приложениям
                      </div>
                      <Badge
                        variant="outline"
                        className="w-fit border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]"
                      >
                        {contractOps.route.label}
                      </Badge>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      {contractOps.routes.map((route, index) => (
                        <div
                          key={`${route.label}-${index}`}
                          className="rounded-md border border-[#dfe7de] bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase text-[#7b857f]">
                              Маршрут {index + 1}
                            </span>
                            <span className="rounded-sm bg-[#f5faf5] px-2 py-1 text-[10px] font-black uppercase text-[#2f6b4f]">
                              {formatRouteApplicationsCount(
                                route.applicationsCount,
                              )}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#7b857f]">
                                <TrainFront className="h-3.5 w-3.5 text-[#2f6b4f]" />
                                Отправление
                              </div>
                              <div className="mt-1 truncate text-sm font-black text-[#223137]">
                                {route.departure}
                              </div>
                            </div>
                            <div className="hidden size-8 items-center justify-center rounded-full border border-[#f2dfca] bg-[#fff3e5] text-[#f38810] sm:flex">
                              <Route className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#7b857f]">
                                <MapPin className="h-3.5 w-3.5 text-[#f38810]" />
                                Назначение
                              </div>
                              <div className="mt-1 truncate text-sm font-black text-[#223137]">
                                {route.destination}
                              </div>
                            </div>
                          </div>
                          {route.applications?.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#edf1eb] pt-3">
                              {route.applications.map((application) => (
                                <span
                                  key={application.id}
                                  className="rounded-md border border-[#e3eae1] bg-[#fbfcfa] px-2 py-1 text-[10px] font-bold text-[#53605a]"
                                >
                                  {application.label} ·{" "}
                                  {application.wagonsCount} ваг.
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
                    <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                        <TrainFront className="h-4 w-4 text-[#2f6b4f]" />
                        Отправление
                      </div>
                      <div className="truncate text-lg font-black text-[#223137]">
                        {contractOps.route.departure}
                      </div>
                    </div>
                    <div className="hidden size-11 items-center justify-center rounded-full border border-[#f2dfca] bg-[#fff3e5] text-[#f38810] lg:flex">
                      <Route className="h-5 w-5" />
                    </div>
                    <div className="rounded-md border border-[#edf1eb] bg-[#fbfcfa] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                        <MapPin className="h-4 w-4 text-[#f38810]" />
                        Назначение
                      </div>
                      <div className="truncate text-lg font-black text-[#223137]">
                        {contractOps.route.destination}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-black uppercase text-[#7b857f]">
                      Прогресс отгрузки
                    </span>
                    <span className="font-black text-[#223137]">
                      {contractOps.progress}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[#edf1eb]">
                    <div
                      className={`h-full rounded-full ${contractOps.statusConfig.progressClassName}`}
                      style={{ width: `${contractOps.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-[#7b857f]">
                    <span>
                      {formatNumber(contractOps.shippedVolume)} /{" "}
                      {formatNumber(contractOps.totalVolume)} т по документам
                    </span>
                    <span>
                      факт {formatNumber(contractOps.actualShippedVolume)} т
                    </span>
                    <span>
                      остаток {formatNumber(contractOps.remainingVolume)} т
                    </span>
                    <span>{contractOps.route.eta}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                    <FileText className="h-4 w-4 text-[#f38810]" />
                    Заявки
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {contractOps.applicationsCount}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {contractOps.wagonsCount} вагонов
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-[#fbfcfa] p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                    <FileDown className="h-4 w-4 text-[#2f6b4f]" />
                    Документы
                  </div>
                  <div className="mt-2 text-3xl font-black text-[#223137]">
                    {contractOps.documentsCount}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    договор, маршруты, заявки
                  </div>
                </div>
                <div className="rounded-md border border-[#dce8dc] bg-[#f5faf5] p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                    <CheckCircle2 className="h-4 w-4 text-[#2f6b4f]" />
                    Оплачено
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#2f6b4f]">
                    {contractOps.paymentProgress}%
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {paidInvoiceCaption}
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-[#fffdf9] p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-[#7b857f]">
                    <Banknote className="h-4 w-4 text-[#f38810]" />
                    Остаток
                  </div>
                  <div className="mt-2 text-2xl font-black text-[#d5740b]">
                    {formatContractMoney(
                      contractOps.balance,
                      (contractData as any)?.currency || "USD",
                    )}
                  </div>
                  <div className="mt-1 text-xs text-[#7b857f]">
                    {balanceInvoiceCaption}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sungrain-analytics-card overflow-hidden">
          <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xl font-black text-[#223137]">
                    Использование объема
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-[#6f7774]">
                    План, вес по документам, фактический вес и остаток
                  </CardDescription>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[780px]">
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Всего
                  </div>
                  <div className="mt-1 text-lg font-black text-[#223137]">
                    {formatNumber(volumeStats.totalVolume)} т
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    По документам
                  </div>
                  <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                    {formatNumber(volumeStats.documentedShippedVolume)} т
                  </div>
                </div>
                <div className="rounded-md border border-[#dfe7de] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Фактически
                  </div>
                  <div className="mt-1 text-lg font-black text-[#223137]">
                    {formatNumber(volumeStats.actualShippedVolume)} т
                  </div>
                </div>
                <div className="rounded-md border border-[#f2dfca] bg-white px-4 py-3">
                  <div className="text-[11px] font-black uppercase text-[#7b857f]">
                    Остаток
                  </div>
                  <div className="mt-1 text-lg font-black text-[#d5740b]">
                    {formatNumber(volumeStats.remainingVolume)} т
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#53605a] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#2f6b4f]" />
                  <span>
                    {volumeStats.percentUsed.toFixed(1)}% использовано по
                    документам
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#f38810]" />
                  <span>
                    {(contractData as any)?.applications?.length || 0} заявок
                  </span>
                </div>
              </div>
              <Progress
                value={volumeStats.percentUsed}
                className="h-3 bg-[#f7eadc] [&>div]:bg-[#f38810]"
              />
            </div>
          </CardContent>
        </Card>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isApplicationDetailOpen && (
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-md border border-[#dfe7de] bg-white p-1 shadow-[0_12px_28px_rgba(34,49,55,0.05)]">
              <TabsTrigger
                value="applications"
                className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
              >
                Заявки
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
              >
                Финансы
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-md py-3 text-sm font-black text-[#6f7774] data-[state=active]:bg-[#f38810] data-[state=active]:text-white data-[state=active]:shadow-[0_10px_22px_rgba(243,136,16,0.22)]"
              >
                <span className="hidden sm:inline">Вагоны</span>
                <span className="sm:hidden">Вагоны</span>
              </TabsTrigger>
            </TabsList>
          )}
          <TabsContent
            value="applications"
            className={isApplicationDetailOpen ? "mt-0" : "mt-4"}
          >
            {selectedApplicationId ? (
              <ApplicationDetail
                contractId={id as any}
                applicationId={selectedApplicationId}
                onBack={handleBackToApplications}
              />
            ) : (
              <ApplicationBlock
                contractId={contractId}
                onSelectApplication={handleSelectApplication}
              />
            )}
          </TabsContent>
          <TabsContent value="finance" className="mt-4">
            <div className="space-y-4">
              <Card className="sungrain-analytics-card overflow-hidden">
                <CardHeader className="border-b border-[#e5ece4] bg-[#fbfcfa] px-4 py-4 sm:px-5 lg:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#fff3e5] text-[#f38810]">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-[#223137]">
                        Связанные счета и платежи
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#6f7774]">
                        Реальные счета и поступления по текущему контракту.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 py-4 sm:px-5 lg:px-6">
                  {isContractFinanceLoading && (
                    <div className="mb-4 rounded-md border border-[#dfe7de] bg-[#fbfcfa] px-4 py-3 text-sm font-semibold text-[#6f7774]">
                      Загружаем счета по заявкам...
                    </div>
                  )}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <div className="text-xs font-black uppercase text-[#7b857f]">
                        Счета
                      </div>
                      {contractFinanceLinks.invoices.length === 0 ? (
                        <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] p-4 text-sm font-semibold text-[#7b857f]">
                          Счета пока не добавлены
                        </div>
                      ) : (
                        contractFinanceLinks.invoices.map((invoice) => (
                          <div
                            key={invoice.id}
                            className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-black text-[#223137]">
                                  {invoice.id}
                                </div>
                                <div className="mt-1 text-xs text-[#7b857f]">
                                  {invoice.title}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  invoice.status === "Оплачен"
                                    ? "border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]"
                                    : "border-[#f2dfca] bg-[#fff3e5] text-[#d5740b]"
                                }
                              >
                                {invoice.status}
                              </Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                              <div className="rounded-md bg-[#fbfcfa] p-2">
                                <div className="text-[10px] font-black uppercase text-[#7b857f]">
                                  Сумма
                                </div>
                                <div className="mt-1 font-black text-[#223137]">
                                  {formatContractMoney(
                                    invoice.amount,
                                    invoice.currency,
                                  )}
                                </div>
                              </div>
                              <div className="rounded-md bg-[#fffdf9] p-2">
                                <div className="text-[10px] font-black uppercase text-[#7b857f]">
                                  Остаток
                                </div>
                                <div className="mt-1 font-black text-[#d5740b]">
                                  {formatContractMoney(
                                    invoice.balance,
                                    invoice.currency,
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-black uppercase text-[#7b857f]">
                        Итог оплаты
                      </div>
                      <div className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]">
                        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                          <div className="rounded-md bg-[#fbfcfa] p-3">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Сумма счетов
                            </div>
                            <div className="mt-1 text-lg font-black text-[#223137]">
                              {formatContractMoney(
                                contractOps.invoiceTotal,
                                contractCurrency,
                              )}
                            </div>
                          </div>
                          <div className="rounded-md bg-[#f5faf5] p-3">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Оплачено
                            </div>
                            <div className="mt-1 text-lg font-black text-[#2f6b4f]">
                              {formatContractMoney(
                                contractOps.paidAmount,
                                contractCurrency,
                              )}
                            </div>
                          </div>
                          <div className="rounded-md bg-[#fffdf9] p-3">
                            <div className="text-[10px] font-black uppercase text-[#7b857f]">
                              Остаток
                            </div>
                            <div className="mt-1 text-lg font-black text-[#d5740b]">
                              {formatContractMoney(
                                contractOps.balance,
                                contractCurrency,
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[#edf1eb] bg-[#fbfcfa] px-3 py-2 text-xs font-semibold text-[#6f7774]">
                          <span>{paidInvoiceCaption}</span>
                          <span>{contractOps.paymentProgress}% оплачено</span>
                        </div>
                      </div>

                      {contractFinanceLinks.payments.length > 0 ? (
                        contractFinanceLinks.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-md border border-[#dfe7de] bg-white p-3 shadow-[0_10px_22px_rgba(34,49,55,0.04)]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-black text-[#223137]">
                                  {payment.id}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#7b857f]">
                                  <Link2 className="h-3.5 w-3.5" />
                                  {payment.reference}
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-[#dce8dc] bg-[#f5faf5] text-[#2f6b4f]"
                              >
                                {payment.status}
                              </Badge>
                            </div>
                            <div className="mt-3 text-lg font-black text-[#2f6b4f]">
                              {formatContractMoney(
                                payment.amount,
                                payment.currency,
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-dashed border-[#dfe7de] bg-[#fbfcfa] p-4 text-sm font-semibold text-[#7b857f]">
                          Отдельные платежи backend пока не хранит. Оплату берем
                          из статусов счетов.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <WagonDetails
              wagons={wagons}
              handleFileDownload={handleFileDownload}
              capacityStats={wagonCapacityStats}
              contractData={contractData}
            />
          </TabsContent>
        </Tabs>
      </div>
      <AddWagonPopup
        contractId={contractId}
        applicationId={selectedApplicationId || undefined}
      />
    </>
  );
};
